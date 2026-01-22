import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Lot, LotStatus, OnChainSyncStatus, ProducerStatus, Prisma } from "@prisma/client";
import { hash } from "starknet";

import { PrismaService } from "../../../database/prisma.service";
import { toBigInt } from "../../../utils/bigint";
import { LotFactoryService } from "../../onchain/lot-factory/lot-factory.service";
import { ApproveLotDto, CreateLotDto, DeployLotDto } from "./dto/lots.dto";

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

  async listLots(): Promise<
    (Prisma.LotGetPayload<{
      include: {
        producer: { include: { user: true } };
        payments: { select: { sharesAmount: true } };
      };
    }> & { fundedPercent: number })[]
  > {
    const lots = await this.prisma.lot.findMany({
      include: {
        producer: { include: { user: true } },
        payments: {
          where: { status: "CONFIRMED" },
          select: { sharesAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return lots.map((lot) => {
      const totalShares = lot.totalShares;
      const fundedShares = lot.payments.reduce(
        (acc, payment) => acc + payment.sharesAmount,
        0
      );
      const fundedPercent =
        totalShares === 0
          ? 0
          : Math.round((fundedShares / totalShares) * 10000) / 100;

      return {
        ...lot,
        fundedPercent,
      };
    });
  }

  async getLotById(id: number): Promise<Lot> {
    const lot = await this.prisma.lot.findUnique({ where: { id },include:{producer:{include:{user:true}}} });
    console.log(lot, "lot");
    if (!lot) {
      throw new NotFoundException("Lot not found");
    }

    return lot;
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
    const json = JSON.stringify(metadata);
    const keccak = hash.starknetKeccak(json);
    return hash.computePoseidonHashOnElements([keccak]).toString();
  }
}
