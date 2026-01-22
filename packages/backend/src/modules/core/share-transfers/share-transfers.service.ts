import { Injectable } from "@nestjs/common";
import { ShareTransfer } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class ShareTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<ShareTransfer[]> {
    return this.prisma.shareTransfer.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async listByLot(lotId: number): Promise<ShareTransfer[]> {
    return this.prisma.shareTransfer.findMany({
      where: { lotId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listByInvestor(investorId: number): Promise<ShareTransfer[]> {
    return this.prisma.shareTransfer.findMany({
      where: {
        OR: [{ toUserId: investorId }, { fromUserId: investorId }],
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
