import { Injectable, NotFoundException } from "@nestjs/common";
import { Animal, AnimalStatus } from "@prisma/client";

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
        profile: data.profile,
        profileHash: data.profileHash ?? null,
        onChainId: data.onChainId ?? null,
        lotId: data.lotId ?? null,
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
