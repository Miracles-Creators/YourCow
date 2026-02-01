import { apiFetch } from "./client";
import { SettlementSchema, type SettlementDto } from "./schemas";

export type CreateSettlementInput = {
  lotId: number;
  totalProceeds: number;
  currency?: string;
  finalTotalWeightGrams: number;
  finalAverageWeightGrams: number;
  initialTotalWeightGrams: number;
};

export async function listSettlements(): Promise<SettlementDto[]> {
  const settlements = await apiFetch<SettlementDto[]>("/settlements");
  return SettlementSchema.array().parse(settlements);
}

export async function getSettlementByLot(lotId: number): Promise<SettlementDto> {
  const settlement = await apiFetch<SettlementDto>(`/settlements/lot/${lotId}`);
  return SettlementSchema.parse(settlement);
}

export async function createSettlement(
  input: CreateSettlementInput,
): Promise<SettlementDto> {
  const settlement = await apiFetch<SettlementDto>("/settlements", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return SettlementSchema.parse(settlement);
}

export async function confirmSettlement(id: number): Promise<SettlementDto> {
  const settlement = await apiFetch<SettlementDto>(`/settlements/${id}/confirm`, {
    method: "POST",
  });
  return SettlementSchema.parse(settlement);
}
