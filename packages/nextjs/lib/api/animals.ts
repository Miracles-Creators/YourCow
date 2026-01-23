import { apiFetch } from "./client";
import { AnimalSchema, ApproveAnimalsInputSchema, type AnimalDto, type ApproveAnimalsInput } from "./schemas";

export type CreateAnimalInput = {
  eid: string;
  custodian: string;
  initialWeightGrams: number;
  currentWeightGrams?: number;
  profile: unknown;
  profileHash?: string;
  onChainId?: number;
  lotId?: number;
};

export async function listAnimalsByLot(lotId: number): Promise<AnimalDto[]> {
  const animals = await apiFetch<AnimalDto[]>(`/animals/lot/${lotId}`);
  return AnimalSchema.array().parse(animals);
}

export async function createAnimal(input: CreateAnimalInput): Promise<AnimalDto> {
  const animal = await apiFetch<AnimalDto>("/animals", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return AnimalSchema.parse(animal);
}

export type ApproveAnimalsResult = {
  approved: number;
  animals: AnimalDto[];
};

export async function approveAnimalsBatch(
  input: ApproveAnimalsInput,
): Promise<ApproveAnimalsResult> {
  const parsed = ApproveAnimalsInputSchema.parse(input);
  const result = await apiFetch<ApproveAnimalsResult>("/animals/approve-batch", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return {
    approved: result.approved,
    animals: AnimalSchema.array().parse(result.animals),
  };
}
