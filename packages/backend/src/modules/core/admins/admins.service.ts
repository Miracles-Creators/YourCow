import { Injectable, NotFoundException } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { CreateAdminDto } from "./dto/create-admin.dto";

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAdmin(data: CreateAdminDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        role: UserRole.ADMIN,
        email: data.email,
        name: data.name ?? null,
        walletAddress: data.walletAddress ?? null,
      },
    });
  }

  async listAdmins(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAdminById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new NotFoundException("Admin not found");
    }

    return user;
  }

  async getAdminByWallet(walletAddress: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new NotFoundException("Admin not found");
    }

    return user;
  }
}
