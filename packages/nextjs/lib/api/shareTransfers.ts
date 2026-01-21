import { apiFetch } from "./client";
import { ShareTransferSchema, type ShareTransferDto } from "./schemas";

export async function listShareTransfers(): Promise<ShareTransferDto[]> {
  const transfers = await apiFetch<ShareTransferDto[]>("/share-transfers");
  return ShareTransferSchema.array().parse(transfers);
}

export async function listShareTransfersByInvestor(
  investorId: number,
): Promise<ShareTransferDto[]> {
  const transfers = await apiFetch<ShareTransferDto[]>(
    `/share-transfers/investor/${investorId}`,
  );
  return ShareTransferSchema.array().parse(transfers);
}

export async function listShareTransfersByLot(
  lotId: number,
): Promise<ShareTransferDto[]> {
  const transfers = await apiFetch<ShareTransferDto[]>(
    `/share-transfers/lot/${lotId}`,
  );
  return ShareTransferSchema.array().parse(transfers);
}
