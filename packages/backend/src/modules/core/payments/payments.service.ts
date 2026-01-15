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
        investorId: data.investorId,
        lotId: data.lotId,
        amountFiat: data.amountFiat,
        currency: data.currency,
        sharesAmount: data.sharesAmount,
        txHash: data.txHash ?? null,
      },
    });
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    return payment;
  }

  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { paymentIntentId } });
  }

  async listByLot(lotId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { lotId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listByInvestor(investorId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { investorId },
      orderBy: { createdAt: "desc" },
    });
  }

  async confirmPayment(id: string, txHash: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.CONFIRMED,
        txHash,
        confirmedAt: new Date(),
      },
    });
  }

  async failPayment(id: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.FAILED },
    });
  }
}
