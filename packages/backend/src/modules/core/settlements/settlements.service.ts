import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { LotStatus, OnChainSyncStatus, Settlement } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { SettlementRegistryService } from "../../onchain/settlement-registry/settlement-registry.service";
import { CreateSettlementDto } from "./dto/create-settlement.dto";

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settlementRegistryService: SettlementRegistryService,
  ) {}

  async createSettlement(data: CreateSettlementDto): Promise<Settlement> {
    if (!Number.isInteger(data.totalProceeds)) {
      throw new BadRequestException("totalProceeds must be an integer");
    }

    const currency = data.currency ?? "USD";
    const reportDate = new Date();
    const finalReportHash = "0x0";
    const finalReportUrl = "pending://final-report";

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.lot.findUnique({
        where: { id: data.lotId },
        select: { status: true, onChainLotId: true },
      });
      if (!lot) {
        throw new NotFoundException("Lot not found");
      }
      if (!lot.onChainLotId) {
        throw new BadRequestException("Lot is not deployed on-chain yet");
      }

      const allowedStatuses = new Set<LotStatus>([
        LotStatus.FUNDING,
        LotStatus.ACTIVE,
        LotStatus.FUNDED,
      ]);
      if (!allowedStatuses.has(lot.status)) {
        throw new BadRequestException(
          `Lot status ${lot.status} is not eligible for settlement`,
        );
      }

      await tx.lot.update({
        where: { id: data.lotId },
        data: { status: LotStatus.SETTLING },
      });

      return tx.settlement.create({
        data: {
          lotId: data.lotId,
          totalProceeds: data.totalProceeds,
          currency,
          finalReportHash,
          finalReportUrl,
          finalTotalWeightGrams: data.finalTotalWeightGrams,
          finalAverageWeightGrams: data.finalAverageWeightGrams,
          initialTotalWeightGrams: data.initialTotalWeightGrams,
          createdAt: reportDate,
        },
      });
    });
  }

  async getSettlementByLotId(lotId: number): Promise<Settlement> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { lotId },
    });
    if (!settlement) {
      throw new NotFoundException("Settlement not found for this lot");
    }
    return settlement;
  }

  async updateOnChainStatus(
    lotId: number,
    status: OnChainSyncStatus,
    txHash?: string,
  ): Promise<Settlement> {
    const data: { onChainStatus: OnChainSyncStatus; onChainTxHash?: string; settledAt?: Date } = {
      onChainStatus: status,
    };

    if (txHash) {
      data.onChainTxHash = txHash;
    }

    if (status === OnChainSyncStatus.SYNCED) {
      data.settledAt = new Date();
    }

    return this.prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.update({
        where: { lotId },
        data,
      });

      if (status === OnChainSyncStatus.SYNCED) {
        await tx.lot.update({
          where: { id: lotId },
          data: { status: LotStatus.COMPLETED },
        });
      }

      return settlement;
    });
  }

  async listPendingSync(): Promise<Settlement[]> {
    return this.prisma.settlement.findMany({
      where: {
        onChainStatus: {
          in: [OnChainSyncStatus.PENDING, OnChainSyncStatus.FAILED],
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async listSettlements(): Promise<Settlement[]> {
    return this.prisma.settlement.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async confirmSettlement(id: number): Promise<Settlement> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      throw new NotFoundException("Settlement not found");
    }

    if (settlement.onChainStatus === OnChainSyncStatus.SYNCED) {
      await this.prisma.lot.updateMany({
        where: { id: settlement.lotId, status: { not: LotStatus.COMPLETED } },
        data: { status: LotStatus.COMPLETED },
      });
      return settlement;
    }

    const lockResult = await this.prisma.settlement.updateMany({
      where: {
        id,
        onChainStatus: { in: [OnChainSyncStatus.PENDING, OnChainSyncStatus.FAILED] },
      },
      data: { onChainStatus: OnChainSyncStatus.SYNCING },
    });

    if (lockResult.count === 0) {
      const latest = await this.prisma.settlement.findUnique({
        where: { id },
      });

      if (!latest) {
        throw new NotFoundException("Settlement not found");
      }

      if (latest.onChainStatus === OnChainSyncStatus.SYNCED) {
        return latest;
      }

      if (latest.onChainStatus === OnChainSyncStatus.SYNCING) {
        throw new BadRequestException("Settlement confirmation already in progress");
      }
    }

    try {
      const txHash = await this.settlementRegistryService.settleLot({
        lotId: BigInt(settlement.lotId),
        finalReportHash: settlement.finalReportHash,
        totalProceeds: BigInt(settlement.totalProceeds),
      });

      return this.updateOnChainStatus(
        settlement.lotId,
        OnChainSyncStatus.SYNCED,
        txHash,
      );
    } catch (error) {
      await this.prisma.settlement.updateMany({
        where: { id, onChainStatus: OnChainSyncStatus.SYNCING },
        data: { onChainStatus: OnChainSyncStatus.FAILED },
      });
      throw error;
    }
  }
}
