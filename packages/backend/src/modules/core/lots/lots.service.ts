import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Lot, LotStatus, OnChainSyncStatus, ProducerStatus, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client-runtime-utils";

import { PrismaService } from "../../../database/prisma.service";
import { toBigInt } from "../../../utils/bigint";
import { hashObject } from "../../../utils/hash";
import { LotFactoryService } from "../../onchain/lot-factory/lot-factory.service";
import { ApproveLotDto, CreateLotDto, DeployLotDto } from "./dto/lots.dto";

type ComputeLotInput = {
  startDate: Date | null;
  durationWeeks: number;
  initialTotalWeightGrams: number | null;
  currentTotalWeightGrams: number | null;
};

export function computeLotFields(lot: ComputeLotInput) {
  const estimatedEndDate = lot.startDate
    ? new Date(lot.startDate.getTime() + lot.durationWeeks * 7 * 24 * 60 * 60 * 1000)
    : null;

  const daysRemaining = estimatedEndDate
    ? Math.max(0, Math.ceil((estimatedEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const weightGainPercent =
    lot.initialTotalWeightGrams && lot.currentTotalWeightGrams
      ? Number(
          (((lot.currentTotalWeightGrams - lot.initialTotalWeightGrams) / lot.initialTotalWeightGrams) * 100).toFixed(2),
        )
      : null;

  return { estimatedEndDate: estimatedEndDate?.toISOString() ?? null, daysRemaining, weightGainPercent };
}

@Injectable()
export class LotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lotFactoryService: LotFactoryService
  ) {}

  async createLot(data: CreateLotDto): Promise<Lot> {
    return this.prisma.lot.create({
      data: {
        producerId: data.producerId,
        name: data.name,
        description: data.description,

        // Location & Operation
        farmName: data.farmName,
        location: data.location,
        productionType: data.productionType,

        // Herd data
        cattleCount: data.cattleCount,
        averageWeightKg: data.averageWeightKg,
        initialWeightKg:data.initialWeightKg ,
        durationWeeks: data.durationWeeks,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,

        // Financing terms (set by admin later)
        totalShares: 0,
        pricePerShare: 0,
        investorPercent: data.investorPercent,
        fundingDeadline: data.fundingDeadline ? new Date(data.fundingDeadline) : null,
        operatingCosts: data.operatingCosts ?? null,

        // Optional
        notes: data.notes ?? null,
      },
    });
  }

  //TODO:REVIEW THIS TO REFACTOR 
  async listLots(): Promise<
    (Prisma.LotGetPayload<{
      include: {
        producer: { include: { user: true } };
      };
    }> & { fundedPercent: number })[]
  > {
    const lots = await this.prisma.lot.findMany({
      include: {
        producer: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const lotIds = lots.map((lot) => lot.id);
    const balancesByLot = lotIds.length
      ? await this.prisma.balance.groupBy({
          by: ["lotId"],
          where: {
            lotId: { in: lotIds },
            assetType: "LOT_SHARES",
          },
          _sum: {
            available: true,
            locked: true,
          },
        })
      : [];

    const mintedByLotId = new Map<number, Decimal>();
    for (const row of balancesByLot) {
      if (row.lotId == null) {
        continue;
      }
      const available = new Decimal(row._sum.available ?? 0);
      const locked = new Decimal(row._sum.locked ?? 0);
      mintedByLotId.set(row.lotId, available.plus(locked));
    }

    return lots.map((lot) => {
      const totalShares = lot.totalShares;
      const fundedShares = mintedByLotId.get(lot.id) ?? new Decimal(0);
      const fundedPercent =
        totalShares === 0
          ? 0
          : Number(fundedShares.div(totalShares).mul(100).toFixed(2));

      return {
        ...lot,
        fundedPercent,
        ...computeLotFields(lot),
      };
    });
  }
//TODO:REVIEW THIS TO REFACTOR 
  async getLotById(
    id: number,
  ): Promise<
    Prisma.LotGetPayload<{
      include: {
        producer: { include: { user: true } };
      };
    }> & { fundedPercent: number }
  > {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      include: { producer: { include: { user: true } } },
    });
    if (!lot) {
      throw new NotFoundException("Lot not found");
    }

    const balances = await this.prisma.balance.aggregate({
      where: {
        lotId: id,
        assetType: "LOT_SHARES",
      },
      _sum: {
        available: true,
        locked: true,
      },
    });

    const available = new Decimal(balances._sum.available ?? 0);
    const locked = new Decimal(balances._sum.locked ?? 0);
    const fundedShares = available.plus(locked);
    const fundedPercent =
      lot.totalShares === 0
        ? 0
        : Number(fundedShares.div(lot.totalShares).mul(100).toFixed(2));

    return {
      ...lot,
      fundedPercent,
      ...computeLotFields(lot),
    };
  }

  async getActiveLotsForOracle(): Promise<
    {
      onChainLotId: number;
      totalShares: number;
      currentTotalWeightGrams: number | null;
      initialTotalWeightGrams: number | null;
      startDate: Date | null;
      endDate: Date | null;
      operatingCosts: number | null;
    }[]
  > {
    const lots = await this.prisma.lot.findMany({
      where: {
        //TODO: REVIEW THE DIFFERENTS STATUS OF LOTS
        status: { in: [LotStatus.ACTIVE] },
        onChainLotId: { not: null },
      },
      select: {
        onChainLotId: true,
        totalShares: true,
        currentTotalWeightGrams: true,
        initialTotalWeightGrams: true,
        startDate: true,
        endDate: true,
        operatingCosts: true,
      },
    });
    return lots.filter((l) => l.onChainLotId !== null) as {
      onChainLotId: number;
      totalShares: number;
      currentTotalWeightGrams: number | null;
      initialTotalWeightGrams: number | null;
      startDate: Date | null;
      endDate: Date | null;
      operatingCosts: number | null;
    }[];
  }

  async getLotByOnChainId(onChainLotId: number): Promise<Lot | null> {
    return this.prisma.lot.findUnique({ where: { onChainLotId } });
  }

  async deployLot(id: number, data: DeployLotDto): Promise<Lot> {
    return this.prisma.lot.update({
      where: { id },
      data: {
        status: LotStatus.FUNDING,
        onChainLotId: data.onChainLotId ?? undefined,
        tokenAddress: data.tokenAddress ?? undefined,
        txHash: data.txHash ?? undefined,
        onChainStatus: data.onChainLotId ? OnChainSyncStatus.SYNCED : undefined,
      },
    });
  }

  async approveAndDeployLot(id: number, data: ApproveLotDto): Promise<Lot> {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      include: { producer: { include: { user: true } } },
    });

    if (!lot) {
      throw new NotFoundException("Lot not found");
    }

    if (lot.status !== LotStatus.DRAFT) {
      throw new BadRequestException("Lot is not pending approval");
    }
    if (lot.producer.status !== ProducerStatus.ACTIVE) {
      throw new BadRequestException("Producer is not approved");
    }
    if (!data.totalShares || !data.pricePerShare) {
      throw new BadRequestException("Total shares and price per share are required");
    }

    const producerAddress = data.producerAddress ?? lot.producer.user.walletAddress;
    if (!producerAddress) {
      throw new BadRequestException("Producer wallet address is required");
    }

    const updatedLot = await this.prisma.lot.update({
      where: { id },
      data: {
        status: LotStatus.PENDING_DEPLOY,
        totalShares: data.totalShares,
        pricePerShare: data.pricePerShare,
      },
      include: { producer: { include: { user: true } } },
    });

    const metadata = this.buildLotMetadata(updatedLot);
    const metadataHash = this.computeMetadataHash(metadata);

    let result;
    try {
      result = await this.lotFactoryService.createLot({
        producer: producerAddress,
        totalShares: toBigInt(updatedLot.totalShares),
        initialPricePerShare: toBigInt(data.pricePerShare),
        metadataHash,
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
      });
    } catch (error) {
      await this.prisma.lot.update({
        where: { id },
        data: { status: LotStatus.DRAFT },
      });
      // TODO: Add FAILED_DEPLOY status to preserve error context and support retries.
      throw error;
    }

    const tokenAddress = await this.lotFactoryService.getSharesToken(
      result.lotId
    );
    console.log(tokenAddress, "tokenAddress");
    return this.prisma.lot.update({
      where: { id },
      data: {
        status: LotStatus.FUNDING,
        onChainLotId: Number(result.lotId),
        tokenAddress,
        txHash: result.transactionHash,
        metadataHash,
        onChainStatus: OnChainSyncStatus.SYNCED,
      },
      include: { producer: { include: { user: true } } },
    });
    
  }

  async updateLotStatus(id: number, status: LotStatus): Promise<Lot> {
    return this.prisma.lot.update({
      where: { id },
      data: { status },
    });
  }

  private buildLotMetadata(
    lot: Prisma.LotGetPayload<{ include: { producer: { include: { user: true } } } }>
  ) {
    return {
      id: lot.id,
      name: lot.name,
      description: lot.description,
      farmName: lot.farmName,
      location: lot.location,
      productionType: lot.productionType,
      cattleCount: lot.cattleCount,
      averageWeightKg: lot.averageWeightKg,
      initialWeightKg: lot.initialWeightKg ?? null,
      durationWeeks: lot.durationWeeks,
      startDate: lot.startDate?.toISOString() ?? null,
      endDate: lot.endDate?.toISOString() ?? null,
      totalShares: lot.totalShares,
      pricePerShare: lot.pricePerShare,
      investorPercent: lot.investorPercent,
      fundingDeadline: lot.fundingDeadline?.toISOString() ?? null,
      producerId: lot.producerId,
      producerName: lot.producer.user.name ?? null,
    };
  }

  private computeMetadataHash(metadata: Record<string, unknown>): string {
    return hashObject(metadata);
  }
}
