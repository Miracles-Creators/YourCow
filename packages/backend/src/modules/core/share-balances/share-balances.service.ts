import { Injectable, NotFoundException } from "@nestjs/common";
import { ShareBalance } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class ShareBalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<ShareBalance[]> {
    return this.prisma.shareBalance.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }

  async listByLot(lotId: number): Promise<ShareBalance[]> {
    return this.prisma.shareBalance.findMany({
      where: { lotId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listByInvestor(investorId: number): Promise<ShareBalance[]> {
    return this.prisma.shareBalance.findMany({
      where: { userId: investorId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getByInvestorLot(
    investorId: number,
    lotId: number,
  ): Promise<ShareBalance> {
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

    return balance;
  }
}
