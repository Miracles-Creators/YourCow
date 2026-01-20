import { Injectable, NotFoundException } from "@nestjs/common";
import { Payment, PaymentStatus } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
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

  async failPayment(id: number): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.FAILED },
    });
  }
}
