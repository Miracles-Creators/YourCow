import { Prisma } from "@prisma/client";

export class ApproveLotDto {
  metadataHash!: string;
  tokenName!: string;
  tokenSymbol!: string;
  initialPricePerShare!: string;
  producerAddress?: string;
}

export class CreateLotDto {
  producerId!: string;
  name!: string;
  description!: string;
  totalShares!: number;
  pricePerShare!: string;
  startDate?: string;
  endDate?: string;
  metadata?: Prisma.InputJsonValue;
}

export class DeployLotDto {
  onChainLotId?: string;
  tokenAddress?: string;
  txHash?: string;
}
