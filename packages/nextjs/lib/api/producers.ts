import { apiFetch } from "./client";
import { ProducerSchema, type ProducerDto } from "./schemas";

export type ApproveProducerInput = {
  producerId: number;
  approvedById: number;
};

export type CreateProducerInput = {
  name: string;
  email: string;
  senasaId: string;
  location?: string;
  phone?: string;
  yearsOperating?: number;
  walletAddress?: string;
};

export async function listProducers(): Promise<ProducerDto[]> {
  const producers = await apiFetch<ProducerDto[]>("/producers");
  return ProducerSchema.array().parse(producers);
}

export async function getProducer(id: number): Promise<ProducerDto> {
  const producer = await apiFetch<ProducerDto>(`/producers/${id}`);
  return ProducerSchema.parse(producer);
}

export async function getProducerMe(): Promise<ProducerDto> {
  const producer = await apiFetch<ProducerDto>("/producers/me");
  return ProducerSchema.parse(producer);
}

export async function createProducer(
  input: CreateProducerInput,
): Promise<ProducerDto> {
  const producer = await apiFetch<ProducerDto>("/producers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return ProducerSchema.parse(producer);
}

export async function approveProducer(
  input: ApproveProducerInput,
): Promise<ProducerDto> {
  const producer = await apiFetch<ProducerDto>(
    `/producers/${input.producerId}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ approvedById: input.approvedById }),
    },
  );
  return ProducerSchema.parse(producer);
}
