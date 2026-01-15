import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateInvestorDto } from "./dto/create-investor.dto";
import { InvestorsService } from "./investors.service";

@Controller("investors")
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Post()
  async createInvestor(@Body() body: CreateInvestorDto) {
    return this.investorsService.createInvestor(body);
  }

  @Get(":id")
  async getInvestorById(@Param("id") id: string) {
    return this.investorsService.getInvestorById(id);
  }

  @Get("wallet/:walletAddress")
  async getInvestorByWallet(@Param("walletAddress") walletAddress: string) {
    return this.investorsService.getInvestorByWallet(walletAddress);
  }
}
