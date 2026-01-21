import { Injectable } from "@nestjs/common";
import { ShareTransfer } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";

type ShareTransferResponse = Omit<ShareTransfer, "amount"> & { amount: string };

@Injectable()
export class ShareTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(transfer: ShareTransfer): ShareTransferResponse {
    return {
      ...transfer,
      amount: transfer.amount.toString(),
    };
  }

  async listAll(): Promise<ShareTransferResponse[]> {
    const transfers = await this.prisma.shareTransfer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return transfers.map((transfer) => this.serialize(transfer));
  }

  async listByLot(lotId: number): Promise<ShareTransferResponse[]> {
    const transfers = await this.prisma.shareTransfer.findMany({
      where: { lotId },
      orderBy: { createdAt: "desc" },
    });
    return transfers.map((transfer) => this.serialize(transfer));
  }

  async listByInvestor(investorId: number): Promise<ShareTransferResponse[]> {
    const transfers = await this.prisma.shareTransfer.findMany({
      where: {
        OR: [{ toUserId: investorId }, { fromUserId: investorId }],
      },
      orderBy: { createdAt: "desc" },
    });
    return transfers.map((transfer) => this.serialize(transfer));
  }
}
