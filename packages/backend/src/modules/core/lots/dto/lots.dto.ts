import { ProductionType } from "@prisma/client";

export class CreateLotDto {
  producerId!: number;
  name!: string;
  description!: string;

  // Location & Operation
  farmName!: string;
  location!: string;
  productionType!: ProductionType;

  // Herd data
  cattleCount!: number;
  averageWeightKg!: number;
  initialWeightKg?: number;
  durationWeeks!: number;
  startDate?: string;
  endDate?: string;

  // Financing terms
  totalShares!: string;
  pricePerShare!: string;
  investorPercent!: number;
  fundingDeadline?: string;
  operatingCosts?: string;

  // Optional
  notes?: string;
}

export class ApproveLotDto {
  tokenName!: string;
  tokenSymbol!: string;
  initialPricePerShare!: string;
  producerAddress?: string;
}

export class DeployLotDto {
  onChainLotId?: string;
  tokenAddress?: string;
  txHash?: string;
}
