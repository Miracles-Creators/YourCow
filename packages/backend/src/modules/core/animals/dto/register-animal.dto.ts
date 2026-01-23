import { AnimalApprovalStatus, Prisma } from "@prisma/client";

export class RegisterAnimalDto {
  eid!: string;
  custodian!: string;
  initialWeightGrams!: number;
  currentWeightGrams?: number;
  profile!: Prisma.InputJsonValue;
  profileHash?: string;
  onChainId?: number;
  lotId?: number;
  approvalStatus?: AnimalApprovalStatus;
}
