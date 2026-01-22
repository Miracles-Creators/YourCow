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
  investorPercent!: number;
  fundingDeadline?: string;
  operatingCosts?: number;

  // Optional
  notes?: string;
}

export class ApproveLotDto {
  tokenName!: string;
  tokenSymbol!: string;
  totalShares!: number;
  pricePerShare!: number;
  producerAddress?: string;
}

export class DeployLotDto {
  onChainLotId?: number;
  tokenAddress?: string;
  txHash?: string;
}
