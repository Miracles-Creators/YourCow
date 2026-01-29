import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async purchaseShares(@Body() body: CreatePaymentDto) {
    return this.paymentsService.createPayment(body);
  }

  @Post(":id/confirm")
  async confirmPayment(@Param("id") id: string, @Body() body: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(Number(id), body.txHash);
  }

  @Post(":id/fiat-deposit")
  async fiatDeposit(@Param("id") id: string) {
    return this.paymentsService.fiatDeposit(Number(id));
  }

  @Get(":id")
  async getPaymentById(@Param("id") id: string) {
    return this.paymentsService.getPaymentById(Number(id));
  }

  @Get("lot/:lotId")
  async listByLot(@Param("lotId") lotId: string) {
    return this.paymentsService.listByLot(Number(lotId));
  }

  @Get("investor/:investorId")
  async listByInvestor(@Param("investorId") investorId: string) {
    return this.paymentsService.listByInvestor(Number(investorId));
  }
}
