import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Lot, LotStatus } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
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
        totalShares: data.totalShares,
        pricePerShare: data.pricePerShare,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        metadata: data.metadata ?? undefined,
      },
    });
  }

  async listLots(): Promise<Lot[]> {
    return this.prisma.lot.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getLotById(id: string): Promise<Lot> {
    const lot = await this.prisma.lot.findUnique({ where: { id } });
    if (!lot) {
      throw new NotFoundException("Lot not found");
    }

    return lot;
  }

  async getLotByOnChainId(onChainLotId: string): Promise<Lot | null> {
    return this.prisma.lot.findUnique({ where: { onChainLotId } });
  }

  async deployLot(id: string, data: DeployLotDto): Promise<Lot> {
    return this.prisma.lot.update({
      where: { id },
      data: {
        status: LotStatus.FUNDING,
        onChainLotId: data.onChainLotId ?? undefined,
        tokenAddress: data.tokenAddress ?? undefined,
        txHash: data.txHash ?? undefined,
      },
    });
  }

  async approveAndDeployLot(id: string, data: ApproveLotDto): Promise<Lot> {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      include: { producer: true },
    });

    if (!lot) {
      throw new NotFoundException("Lot not found");
    }

    if (lot.status !== LotStatus.DRAFT) {
      throw new BadRequestException("Lot is not pending approval");
    }

    const producerAddress = data.producerAddress ?? lot.producer.walletAddress;
    if (!producerAddress) {
      throw new BadRequestException("Producer wallet address is required");
    }

    await this.prisma.lot.update({
      where: { id },
      data: { status: LotStatus.PENDING_DEPLOY },
    });

    const result = await this.lotFactoryService.createLot({
      producer: producerAddress,
      totalShares: BigInt(lot.totalShares),
      initialPricePerShare: BigInt(data.initialPricePerShare),
      metadataHash: data.metadataHash,
      tokenName: data.tokenName,
      tokenSymbol: data.tokenSymbol,
    });

    const tokenAddress = await this.lotFactoryService.getSharesToken(
      result.lotId
    );

    return this.prisma.lot.update({
      where: { id },
      data: {
        status: LotStatus.FUNDING,
        onChainLotId: result.lotId.toString(),
        tokenAddress,
        txHash: result.transactionHash,
      },
    });
  }

  async updateLotStatus(id: string, status: LotStatus): Promise<Lot> {
    return this.prisma.lot.update({
      where: { id },
      data: { status },
    });
  }
}
