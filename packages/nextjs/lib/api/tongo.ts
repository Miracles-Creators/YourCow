import { apiFetch } from "./client";
import { TongoBalanceSchema, type TongoBalanceDto } from "./schemas";

export async function getTongoBalance(): Promise<TongoBalanceDto> {
  const result = await apiFetch<TongoBalanceDto>("/tongo/balance");
  return TongoBalanceSchema.parse(result);
}

export async function getTongoConfig(): Promise<{ operatorAddress: string }> {
  return apiFetch<{ operatorAddress: string }>("/tongo/config");
}

export async function confirmDeposit(dto: {
  txHash: string;
  amount: string;
}): Promise<{ tongoTxHash: string }> {
  return apiFetch<{ tongoTxHash: string }>("/tongo/deposit-confirm", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function withdrawTongo(dto: {
  toAddress: string;
  amount: string;
}): Promise<{ txHash: string }> {
  return apiFetch<{ txHash: string }>("/tongo/withdraw", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
