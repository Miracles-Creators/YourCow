import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ProducerProfile, ProducerStatus, UserRole } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { ApproveProducerDto } from "./dto/approve-producer.dto";
import { CreateProducerDto } from "./dto/create-producer.dto";

@Injectable()
export class ProducersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProducer(data: CreateProducerDto): Promise<ProducerProfile> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { producer: true },
    });

    if (existingUser && existingUser.role !== UserRole.PRODUCER) {
      throw new BadRequestException("User role is not PRODUCER");
    }

    if (existingUser?.producer) {
      return this.prisma.producerProfile.findUniqueOrThrow({
        where: { userId: existingUser.id },
        include: { user: true },
      });
    }

    return this.prisma.producerProfile.create({
      data: {
        senasaId: data.senasaId,
        status: ProducerStatus.PENDING,
        location: data.location ?? null,
        phone: data.phone ?? null,
        yearsOperating: data.yearsOperating ?? null,
        user: existingUser
          ? { connect: { id: existingUser.id } }
          : {
              create: {
                role: UserRole.PRODUCER,
                name: data.name,
                email: normalizedEmail,
                walletAddress: data.walletAddress ?? null,
              },
            },
      },
      include: { user: true, lots: true },
    });
  }

  async listProducers(): Promise<ProducerProfile[]> {
    return this.prisma.producerProfile.findMany({
      include: { user: true, lots: true },
      orderBy: { user: { createdAt: "desc" } },
    });
  }

  async getProducerById(userId: number): Promise<ProducerProfile> {
    const producer = await this.prisma.producerProfile.findUnique({
      where: { userId },
      include: { user: true, lots: true },
    });
    if (!producer) {
      throw new NotFoundException("Producer not found");
    }
    return producer;
  }

  async approveProducer(userId: number, data: ApproveProducerDto): Promise<ProducerProfile> {
    const producer = await this.prisma.producerProfile.findUnique({
      where: { userId },
    });

    if (!producer) {
      throw new NotFoundException("Producer not found");
    }

    if (producer.status !== ProducerStatus.PENDING) {
      throw new BadRequestException("Producer is not pending approval");
    }

    return this.prisma.producerProfile.update({
      where: { userId },
      data: {
        status: ProducerStatus.ACTIVE,
        approvedById: data.approvedById,
        approvedAt: new Date(),
      },
      include: { user: true },
    });
  }

  async getProducerByWallet(walletAddress: string): Promise<ProducerProfile | null> {
    return this.prisma.producerProfile.findFirst({
      where: { user: { walletAddress } },
      include: { user: true },
    });
  }
}
