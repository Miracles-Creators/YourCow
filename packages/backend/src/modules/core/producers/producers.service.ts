import { Injectable, NotFoundException } from "@nestjs/common";
import { Producer } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { CreateProducerDto } from "./dto/create-producer.dto";

@Injectable()
export class ProducersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProducer(data: CreateProducerDto): Promise<Producer> {
    return this.prisma.producer.create({
      data: {
        name: data.name,
        email: data.email,
        senasaId: data.senasaId,
        walletAddress: data.walletAddress ?? null,
      },
    });
  }

  async listProducers(): Promise<Producer[]> {
    return this.prisma.producer.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getProducerById(id: string): Promise<Producer> {
    const producer = await this.prisma.producer.findUnique({ where: { id } });
    if (!producer) {
      throw new NotFoundException("Producer not found");
    }

    return producer;
  }

  async getProducerByWallet(walletAddress: string): Promise<Producer | null> {
    return this.prisma.producer.findUnique({ where: { walletAddress } });
  }
}
