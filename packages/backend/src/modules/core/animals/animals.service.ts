import { Injectable, NotFoundException } from "@nestjs/common";
import {
  Animal,
  AnimalApprovalStatus,
  AnimalStatus,
  OnChainSyncStatus,
} from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { RegisterAnimalDto } from "./dto/register-animal.dto";

@Injectable()
export class AnimalsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerAnimal(data: RegisterAnimalDto): Promise<Animal> {
    return this.prisma.animal.create({
      data: {
        eid: data.eid,
        custodian: data.custodian,
        initialWeightGrams: data.initialWeightGrams,
        currentWeightGrams: data.currentWeightGrams ?? null,
        profile: data.profile,
        profileHash: data.profileHash ?? null,
        onChainId: data.onChainId ?? null,
        lotId: data.lotId ?? null,
        approvalStatus: data.approvalStatus ?? undefined,
      },
    });
  }

  async getAnimalById(id: number): Promise<Animal> {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    if (!animal) {
      throw new NotFoundException("Animal not found");
    }
    return animal;
  }

  async getAnimalByEid(eid: string): Promise<Animal | null> {
    return this.prisma.animal.findUnique({ where: { eid } });
  }

  async getAnimalByOnChainId(onChainId: number): Promise<Animal | null> {
    return this.prisma.animal.findUnique({ where: { onChainId } });
  }

  async listByLot(lotId: number): Promise<Animal[]> {
    return this.prisma.animal.findMany({
      where: { lotId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listByIds(ids: number[]): Promise<Animal[]> {
    return this.prisma.animal.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
    });
  }

  async listPendingByLot(lotId: number): Promise<Animal[]> {
    return this.prisma.animal.findMany({
      where: { lotId, approvalStatus: AnimalApprovalStatus.PENDING_APPROVAL },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateApprovalStatus(
    ids: number[],
    status: AnimalApprovalStatus,
    approvedById?: number
  ): Promise<number> {
    const result = await this.prisma.animal.updateMany({
      where: { id: { in: ids } },
      data: {
        approvalStatus: status,
        ...(approvedById ? { approvedById } : {}),
      },
    });

    return result.count;
  }

  async updateApprovalOnChainResults(
    updates: {
      id: number;
      approvalStatus: AnimalApprovalStatus;
      onChainStatus: OnChainSyncStatus;
      onChainId?: number;
      profileHash?: string | null;
      registrationTxHash?: string | null;
      approvedById?: number;
    }[]
  ): Promise<Animal[]> {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.animal.update({
          where: { id: update.id },
          data: {
            approvalStatus: update.approvalStatus,
            onChainStatus: update.onChainStatus,
            onChainId: update.onChainId ?? undefined,
            profileHash: update.profileHash ?? undefined,
            registrationTxHash: update.registrationTxHash ?? undefined,
            ...(update.approvedById ? { approvedById: update.approvedById } : {}),
          },
        })
      )
    );
  }

  async updateOnChainId(id: number, onChainId: number): Promise<Animal> {
    return this.prisma.animal.update({
      where: { id },
      data: { onChainId },
    });
  }

  async updateStatus(id: number, status: AnimalStatus): Promise<Animal> {
    return this.prisma.animal.update({
      where: { id },
      data: { status },
    });
  }

  async assignToLot(id: number, lotId: number): Promise<Animal> {
    return this.prisma.animal.update({
      where: { id },
      data: { lotId },
    });
  }
}
