import { apiFetch } from "./client";
import { ShareBalanceSchema, type ShareBalanceDto } from "./schemas";

export async function listShareBalances(): Promise<ShareBalanceDto[]> {
  const balances = await apiFetch<ShareBalanceDto[]>("/share-balances");
  return ShareBalanceSchema.array().parse(balances);
}

export async function listShareBalancesByInvestor(
  investorId: number,
): Promise<ShareBalanceDto[]> {
  const balances = await apiFetch<ShareBalanceDto[]>(
    `/share-balances/investor/${investorId}`,
  );
  return ShareBalanceSchema.array().parse(balances);
}

export async function listShareBalancesByLot(
  lotId: number,
): Promise<ShareBalanceDto[]> {
  const balances = await apiFetch<ShareBalanceDto[]>(
    `/share-balances/lot/${lotId}`,
  );
  return ShareBalanceSchema.array().parse(balances);
}

export async function getShareBalance(
  investorId: number,
  lotId: number,
): Promise<ShareBalanceDto> {
  const balance = await apiFetch<ShareBalanceDto>(
    `/share-balances/investor/${investorId}/lot/${lotId}`,
  );
  return ShareBalanceSchema.parse(balance);
}
