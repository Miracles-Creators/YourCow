import { apiFetch } from "./client";
import {
  PaymentSchema,
  type PaymentDto,
} from "./schemas";

export type CreatePaymentInput = {
  paymentIntentId: string;
  investorId: number;
  lotId: number;
  amountFiat: number;
  currency: string;
  sharesAmount: string;
  txHash?: string;
};

export async function createPayment(
  input: CreatePaymentInput,
): Promise<PaymentDto> {
  const payment = await apiFetch<PaymentDto>("/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return PaymentSchema.parse(payment);
}

export async function confirmPayment(
  id: number,
  txHash?: string,
): Promise<PaymentDto> {
  const payment = await apiFetch<PaymentDto>(`/payments/${id}/confirm`, {
    method: "POST",
    body: JSON.stringify({ txHash }),
  });
  return PaymentSchema.parse(payment);
}

export async function mintPayment(id: number): Promise<PaymentDto> {
  const payment = await apiFetch<PaymentDto>(`/payments/${id}/mint`, {
    method: "POST",
  });
  return PaymentSchema.parse(payment);
}

export async function getPayment(id: number): Promise<PaymentDto> {
  const payment = await apiFetch<PaymentDto>(`/payments/${id}`);
  return PaymentSchema.parse(payment);
}

export async function listPaymentsByInvestor(
  investorId: number,
): Promise<PaymentDto[]> {
  const payments = await apiFetch<PaymentDto[]>(
    `/payments/investor/${investorId}`,
  );
  return PaymentSchema.array().parse(payments);
}

export async function listPaymentsByLot(lotId: number): Promise<PaymentDto[]> {
  const payments = await apiFetch<PaymentDto[]>(`/payments/lot/${lotId}`);
  return PaymentSchema.array().parse(payments);
}
