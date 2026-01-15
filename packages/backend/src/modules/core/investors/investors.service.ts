import { Injectable, NotFoundException } from "@nestjs/common";
import { Investor } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { CreateInvestorDto } from "./dto/create-investor.dto";

@Injectable()
export class InvestorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvestor(data: CreateInvestorDto): Promise<Investor> {
    return this.prisma.investor.create({
      data: {
        walletAddress: data.walletAddress,
        email: data.email,
        name: data.name ?? null,
      },
    });
  }

  async getInvestorById(id: string): Promise<Investor> {
    const investor = await this.prisma.investor.findUnique({ where: { id } });
    if (!investor) {
      throw new NotFoundException("Investor not found");
    }

    return investor;
  }

  async getInvestorByWallet(walletAddress: string): Promise<Investor> {
    const investor = await this.prisma.investor.findUnique({
      where: { walletAddress },
    });
    if (!investor) {
      throw new NotFoundException("Investor not found");
    }

    return investor;
  }
}
