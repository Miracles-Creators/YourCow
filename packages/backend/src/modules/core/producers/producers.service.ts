import { Injectable, NotFoundException } from "@nestjs/common";
import { ProducerProfile, ProducerStatus, UserRole } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { CreateProducerDto } from "./dto/create-producer.dto";

@Injectable()
export class ProducersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProducer(data: CreateProducerDto): Promise<ProducerProfile> {
    return this.prisma.producerProfile.create({
      data: {
        senasaId: data.senasaId,
        status: ProducerStatus.PENDING,
        user: {
          create: {
            role: UserRole.PRODUCER,
            name: data.name,
            email: data.email,
            walletAddress: data.walletAddress ?? null,
          },
        },
      },
      include: { user: true },
    });
  }

  async listProducers(): Promise<ProducerProfile[]> {
    return this.prisma.producerProfile.findMany({
      include: { user: true },
      orderBy: { user: { createdAt: "desc" } },
    });
  }

  async getProducerById(id: string): Promise<ProducerProfile> {
    const producer = await this.prisma.producerProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!producer) {
      throw new NotFoundException("Producer not found");
    }

    return producer;
  }

  async getProducerByWallet(walletAddress: string): Promise<ProducerProfile | null> {
    return this.prisma.producerProfile.findFirst({
      where: { user: { walletAddress } },
      include: { user: true },
    });
  }
}
