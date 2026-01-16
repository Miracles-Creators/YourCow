import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateAdminDto } from "./dto/create-admin.dto";
import { AdminsService } from "./admins.service";

@Controller("admins")
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

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
    return this.adminsService.getAdminById(id);
  }

  @Get("wallet/:walletAddress")
  async getAdminByWallet(@Param("walletAddress") walletAddress: string) {
    return this.adminsService.getAdminByWallet(walletAddress);
  }
}
