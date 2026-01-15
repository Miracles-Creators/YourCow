import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async purchaseShares(@Body() body: CreatePaymentDto) {
    return this.paymentsService.createPayment(body);
  }

  @Get(":id")
  async getPaymentById(@Param("id") id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  @Get("lot/:lotId")
  async listByLot(@Param("lotId") lotId: string) {
    return this.paymentsService.listByLot(lotId);
  }

  @Get("investor/:investorId")
  async listByInvestor(@Param("investorId") investorId: string) {
    return this.paymentsService.listByInvestor(investorId);
  }
}
