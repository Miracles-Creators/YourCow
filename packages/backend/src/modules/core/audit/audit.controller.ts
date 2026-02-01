import {
  BadRequestException,
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
import { AuditService } from "./audit.service";

@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(AuthGuard)
  @Post("batch")
  async createBatch(@Req() req: AuthenticatedRequest, @Body() _body: unknown) {
    this.requireAdmin(req);
    return this.auditService.createAndAnchorBatch();
  }

  @Get("batch/:id/verify")
  async verifyBatch(@Param("id") id: string) {
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      throw new BadRequestException("batchId must be a number");
    }

    return this.auditService.verifyBatch(parsedId);
  }

  @Get("batch/verify-latest")
  async verifyLatestBatch() {
    return this.auditService.verifyLatestBatch();
  }

  private requireAdmin(req: AuthenticatedRequest): void {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin role required");
    }
  }
}
