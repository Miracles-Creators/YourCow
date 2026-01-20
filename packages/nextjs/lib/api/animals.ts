import { apiFetch } from "./client";
import { AnimalSchema, type AnimalDto } from "./schemas";

export type CreateAnimalInput = {
  eid: string;
  custodian: string;
  profile: unknown;
  profileHash?: string;
  onChainId?: string;
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
