import { Prisma } from "@prisma/client";

export class RegisterAnimalDto {
  eid!: string;
  custodian!: string;
  profile!: Prisma.InputJsonValue;
  profileHash?: string;
  onChainId?: number;
  lotId?: number;
}
