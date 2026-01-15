import { Injectable, NotFoundException } from "@nestjs/common";
import { Settlement, SettlementOnChainStatus } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { CreateSettlementDto } from "./dto/create-settlement.dto";

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSettlement(data: CreateSettlementDto): Promise<Settlement> {
    return this.prisma.settlement.create({
      data: {
        lotId: data.lotId,
        totalProceeds: data.totalProceeds,
        currency: data.currency ?? "USD",
        finalReportHash: data.finalReportHash,
        finalReportUrl: data.finalReportUrl ?? null,
        finalTotalWeightGrams: data.finalTotalWeightGrams,
        finalAverageWeightGrams: data.finalAverageWeightGrams,
        initialTotalWeightGrams: data.initialTotalWeightGrams,
      },
    });
  }

  async getSettlementByLotId(lotId: string): Promise<Settlement> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { lotId },
    });
    if (!settlement) {
      throw new NotFoundException("Settlement not found for this lot");
    }
    return settlement;
  }

  async updateOnChainStatus(
    lotId: string,
    status: SettlementOnChainStatus,
    txHash?: string,
  ): Promise<Settlement> {
    const data: { onChainStatus: SettlementOnChainStatus; onChainTxHash?: string; settledAt?: Date } = {
      onChainStatus: status,
    };

    if (txHash) {
      data.onChainTxHash = txHash;
    }

    if (status === SettlementOnChainStatus.SYNCED) {
      data.settledAt = new Date();
    }

    return this.prisma.settlement.update({
      where: { lotId },
      data,
    });
  }

  async listPendingSync(): Promise<Settlement[]> {
    return this.prisma.settlement.findMany({
      where: {
        onChainStatus: {
          in: [SettlementOnChainStatus.PENDING, SettlementOnChainStatus.FAILED],
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
