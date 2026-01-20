import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/types";
import { ProducersService } from "../producers/producers.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { AdminsService } from "./admins.service";

@Controller("admins")
export class AdminsController {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly producersService: ProducersService,
  ) {}

  @Post()
  async createAdmin(@Body() body: CreateAdminDto) {
    return this.adminsService.createAdmin(body);
  }

  @Get()
  async listAdmins() {
    return this.adminsService.listAdmins();
  }

  @Get(":id")
  async getAdminById(@Param("id") id: string) {
    return this.adminsService.getAdminById(Number(id));
  }

  @UseGuards(AuthGuard)
  @Post("producers/:producerId/approve")
  async approveProducer(
    @Req() req: AuthenticatedRequest,
    @Param("producerId") producerId: string,
  ) {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin role required");
    }

    return this.producersService.approveProducer(Number(producerId), {
      approvedById: req.user.id,
    });
  }

  @Get("wallet/:walletAddress")
  async getAdminByWallet(@Param("walletAddress") walletAddress: string) {
    return this.adminsService.getAdminByWallet(walletAddress);
  }
}
