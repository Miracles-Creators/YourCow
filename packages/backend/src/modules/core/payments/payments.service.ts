import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OnChainSyncStatus, Payment, PaymentStatus } from "@prisma/client";
import { Decimal } from "@prisma/client-runtime-utils";

import { PrismaService } from "../../../database/prisma.service";
import { CustodyService } from "../custody/custody.service";
import { LedgerService } from "../ledger/ledger.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly custodyService: CustodyService,
    private readonly ledgerService: LedgerService,
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

    const pendingDeposit = await this.prisma.payment.findFirst({
      where: {
        userId: data.investorId,
        lotId: data.lotId,
        status: PaymentStatus.CONFIRMED,
        onChainStatus: { not: OnChainSyncStatus.SYNCED },
      },
    });

    if (pendingDeposit) {
      throw new BadRequestException(
        "Existing confirmed payment is pending deposit; retry fiat deposit instead of creating a new payment",
      );
    }

    return this.prisma.payment.create({
      data: {
        paymentIntentId: data.paymentIntentId,
        userId: data.investorId,
        // TODO: Remove lotId dependency from payments; payments should be general fiat deposits.
        // Lot association should happen only when spending balance to buy shares.
        lotId: data.lotId,
        amountFiat: data.amountFiat,
        currency: data.currency,
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

  async fiatDeposit(id: number): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
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
      });

      if (!latest) {
        throw new NotFoundException("Payment not found");
      }

      if (latest.onChainStatus === OnChainSyncStatus.SYNCED) {
        return latest;
      }

      if (latest.onChainStatus === OnChainSyncStatus.SYNCING) {
        throw new BadRequestException("Payment deposit already in progress");
      }

      if (latest.status !== PaymentStatus.CONFIRMED) {
        throw new BadRequestException("Payment not confirmed");
      }
    }

    try {
      const account = await this.custodyService.getOrCreateAccount(payment.userId);
      //TODO:review role of protocol vault
      const protocolVault = await this.custodyService.getOrCreateSystemAccount("PROTOCOL_VAULT");
      const assetType = this.mapCurrencyToAssetType(payment.currency);

      return await this.prisma.$transaction(async (tx) => {
        await this.custodyService.creditFiat(
          tx,
          account.id,
          assetType,
          new Decimal(payment.amountFiat),
        );

        await this.ledgerService.writeEntry(tx, {
          eventType: "FIAT_DEPOSIT",
          debitAccountId: protocolVault.id,
          creditAccountId: account.id,
          assetType,
          lotId: null,
          amount: new Decimal(payment.amountFiat),
        });

        const updatedPayment = await tx.payment.update({
          where: { id },
          data: {
            onChainStatus: OnChainSyncStatus.SYNCED,
          },
        });

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
//TODO:UTILS
  private mapCurrencyToAssetType(currency: string): "FIAT_ARS" | "FIAT_USD" {
    const normalized = currency.trim().toUpperCase();

    if (normalized === "ARS" || normalized === "FIAT_ARS") {
      return "FIAT_ARS";
    }

    if (normalized === "USD" || normalized === "FIAT_USD") {
      return "FIAT_USD";
    }

    throw new BadRequestException(`Unsupported currency: ${currency}`);
  }

  async failPayment(id: number): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.FAILED },
    });
  }
}
