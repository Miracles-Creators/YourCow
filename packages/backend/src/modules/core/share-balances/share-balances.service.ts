import { Injectable, NotFoundException } from "@nestjs/common";
import { ShareBalance } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";

type ShareBalanceResponse = Omit<ShareBalance, "amount"> & { amount: string };

@Injectable()
export class ShareBalancesService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(balance: ShareBalance): ShareBalanceResponse {
    return {
      ...balance,
      amount: balance.amount.toString(),
    };
  }

  async listAll(): Promise<ShareBalanceResponse[]> {
    const balances = await this.prisma.shareBalance.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return balances.map((balance) => this.serialize(balance));
  }

  async listByLot(lotId: number): Promise<ShareBalanceResponse[]> {
    const balances = await this.prisma.shareBalance.findMany({
      where: { lotId },
      orderBy: { updatedAt: "desc" },
    });
    return balances.map((balance) => this.serialize(balance));
  }

  async listByInvestor(investorId: number): Promise<ShareBalanceResponse[]> {
    const balances = await this.prisma.shareBalance.findMany({
      where: { userId: investorId },
      orderBy: { updatedAt: "desc" },
    });
    return balances.map((balance) => this.serialize(balance));
  }

  async getByInvestorLot(
    investorId: number,
    lotId: number,
  ): Promise<ShareBalanceResponse> {
    const balance = await this.prisma.shareBalance.findUnique({
      where: {
        userId_lotId: {
          userId: investorId,
          lotId,
        },
      },
    });

    if (!balance) {
      throw new NotFoundException("Share balance not found");
    }

    return this.serialize(balance);
  }
}
