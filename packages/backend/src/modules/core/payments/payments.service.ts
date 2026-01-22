import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  OnChainSyncStatus,
  Payment,
  PaymentStatus,
  ShareTransferKind,
} from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { toBigInt } from "../../../utils/bigint";
import { LotSharesTokenService } from "../../onchain/lot-shares-token/lot-shares-token.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lotSharesTokenService: LotSharesTokenService,
  ) {}

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const existingByIntent = await this.prisma.payment.findUnique({
      where: { paymentIntentId: data.paymentIntentId },
    });

    if (existingByIntent) {
      if (existingByIntent.userId !== data.investorId || existingByIntent.lotId !== data.lotId) {
        throw new BadRequestException("paymentIntentId already used for another user or lot");
      }
      return existingByIntent;
    }

    const pendingMint = await this.prisma.payment.findFirst({
      where: {
        userId: data.investorId,
        lotId: data.lotId,
        status: PaymentStatus.CONFIRMED,
        onChainStatus: { not: OnChainSyncStatus.SYNCED },
      },
    });

    if (pendingMint) {
      throw new BadRequestException(
        "Existing confirmed payment is pending mint; retry mint instead of creating a new payment",
      );
    }

    return this.prisma.payment.create({
      data: {
        paymentIntentId: data.paymentIntentId,
        userId: data.investorId,
        lotId: data.lotId,
        amountFiat: data.amountFiat,
        currency: data.currency,
        sharesAmount: data.sharesAmount,
        txHash: data.txHash ?? null,
      },
    });
  }

  async getPaymentById(id: number): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    return payment;
  }

  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { paymentIntentId } });
  }

  async listByLot(lotId: number): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { lotId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listByInvestor(investorId: number): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { userId: investorId },
      orderBy: { createdAt: "desc" },
    });
  }

  async confirmPayment(id: number, txHash?: string): Promise<Payment> {
    const data: { status: PaymentStatus; confirmedAt: Date; txHash?: string } = {
      status: PaymentStatus.CONFIRMED,
      confirmedAt: new Date(),
    };

    if (txHash) {
      data.txHash = txHash;
    }

    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  async mintPayment(id: number): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { user: true, lot: true },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    if (payment.status !== PaymentStatus.CONFIRMED) {
      throw new BadRequestException("Payment not confirmed");
    }

    if (payment.onChainStatus === OnChainSyncStatus.SYNCED) {
      return payment;
    }

    if (!payment.user.walletAddress) {
      throw new BadRequestException("Investor wallet address is missing");
    }

    if (payment.lot.onChainLotId == null) {
      throw new BadRequestException("Lot onChainLotId is missing");
    }

    const lockResult = await this.prisma.payment.updateMany({
      where: {
        id,
        status: PaymentStatus.CONFIRMED,
        onChainStatus: { in: [OnChainSyncStatus.PENDING, OnChainSyncStatus.FAILED] },
      },
      data: { onChainStatus: OnChainSyncStatus.SYNCING },
    });

    if (lockResult.count === 0) {
      const latest = await this.prisma.payment.findUnique({
        where: { id },
        include: { user: true, lot: true },
      });

      if (!latest) {
        throw new NotFoundException("Payment not found");
      }

      if (latest.onChainStatus === OnChainSyncStatus.SYNCED) {
        return latest;
      }

      if (latest.onChainStatus === OnChainSyncStatus.SYNCING) {
        throw new BadRequestException("Payment mint already in progress");
      }

      if (latest.status !== PaymentStatus.CONFIRMED) {
        throw new BadRequestException("Payment not confirmed");
      }
    }

    try {
      let txHash = payment.txHash ?? null;

      if (!txHash) {
        txHash = await this.lotSharesTokenService.mint(
        toBigInt(payment.lot.onChainLotId),
        payment.user.walletAddress,
        toBigInt(payment.sharesAmount),
      );

        await this.prisma.payment.update({
          where: { id },
          data: { txHash },
        });
      }

      return await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id },
          data: {
            txHash,
            onChainStatus: OnChainSyncStatus.SYNCED,
          },
        });

        const existingTransfer = await tx.shareTransfer.findFirst({
          where: { txHash, kind: ShareTransferKind.MINT },
        });

        if (!existingTransfer) {
          await tx.shareBalance.upsert({
            where: {
              userId_lotId: {
                userId: payment.userId,
                lotId: payment.lotId,
              },
            },
            update: {
            amount: {
              increment: payment.sharesAmount,
            },
            lastSyncedAt: new Date(),
          },
          create: {
            userId: payment.userId,
            lotId: payment.lotId,
            amount: payment.sharesAmount,
            lastSyncedAt: new Date(),
          },
        });

          await tx.shareTransfer.create({
            data: {
              lotId: payment.lotId,
            fromUserId: null,
            toUserId: payment.userId,
            amount: payment.sharesAmount,
            kind: ShareTransferKind.MINT,
            txHash,
            onChainStatus: OnChainSyncStatus.SYNCED,
            },
          });
        }

        return updatedPayment;
      });
    } catch (error) {
      await this.prisma.payment.updateMany({
        where: { id, onChainStatus: OnChainSyncStatus.SYNCING },
        data: { onChainStatus: OnChainSyncStatus.FAILED },
      });
      throw error;
    }
  }

  async failPayment(id: number): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.FAILED },
    });
  }
}
