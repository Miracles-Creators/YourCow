import { Injectable, NotFoundException } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { CreateInvestorDto } from "./dto/create-investor.dto";

@Injectable()
export class InvestorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvestor(data: CreateInvestorDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        role: UserRole.INVESTOR,
        walletAddress: data.walletAddress,
        email: data.email,
        name: data.name ?? null,
      },
    });
  }

  async getInvestorById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    console.log(user);
    console.log(id)
    if (!user || user.role !== UserRole.INVESTOR) {
      throw new NotFoundException("Investor not found");
    }

    return user;
  }

  async getInvestorByWallet(walletAddress: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });
    if (!user || user.role !== UserRole.INVESTOR) {
      throw new NotFoundException("Investor not found");
    }

    return user;
  }
}
