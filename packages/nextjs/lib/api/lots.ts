import { apiFetch } from "./client";
import {
  ApproveLotInputSchema,
  LotSchema,
  type ApproveLotInput,
  type LotDto,
  type ProductionType,
} from "./schemas";

export type CreateLotInput = {
  producerId: number;
  name: string;
  description: string;

  // Location & Operation
  farmName: string;
  location: string;
  productionType: ProductionType;

  // Herd data
  cattleCount: number;
  averageWeightKg: number;
  durationWeeks: number;
  startDate?: string;
  endDate?: string;

  // Financing terms
  totalShares: string;
  pricePerShare: string;
  investorPercent: number;
  fundingDeadline?: string;
  operatingCosts?: string;

  // Optional
  notes?: string;
};

export async function listLots(): Promise<LotDto[]> {
  const lots = await apiFetch<LotDto[]>("/lots");
  return LotSchema.array().parse(lots);
}

export async function getLot(id: number): Promise<LotDto> {
  const lot = await apiFetch<LotDto>(`/lots/${id}`);
  return LotSchema.parse(lot);
}

export async function createLot(input: CreateLotInput): Promise<LotDto> {
  const lot = await apiFetch<LotDto>("/lots", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return LotSchema.parse(lot);
}

export async function approveLot(
  lotId: number,
  input: ApproveLotInput,
): Promise<LotDto> {
  const parsed = ApproveLotInputSchema.parse(input);
  const lot = await apiFetch<LotDto>(`/lots/${lotId}/approve`, {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return LotSchema.parse(lot);
}
