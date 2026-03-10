import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthGuard } from "../../core/auth/auth.guard";
import type { AuthenticatedRequest } from "../../core/auth/types";
import { GaragaService } from "./garaga.service";
import { ProveThresholdDto } from "./dto/garaga.dto";

@Controller("garaga")
@UseGuards(AuthGuard)
export class GaragaController {
  constructor(private readonly garagaService: GaragaService) {}

  @Post("prove-threshold")
  async proveThreshold(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ProveThresholdDto,
  ) {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin role required");
    }
    if (!dto.lotId) {
      throw new BadRequestException("lotId is required");
    }
    const lotId = parseInt(dto.lotId, 10);
    if (isNaN(lotId)) {
      throw new BadRequestException("lotId must be a numeric string");
    }
    const threshold = dto.thresholdPercent ?? 100;
    if (threshold < 1 || threshold > 100) {
      throw new BadRequestException("thresholdPercent must be between 1 and 100");
    }
    const jobId = this.garagaService.startProveThreshold(lotId, threshold);
    return { jobId };
  }

  @Get("jobs/:jobId")
  async getJobStatus(
    @Req() req: AuthenticatedRequest,
    @Param("jobId") jobId: string,
  ) {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin role required");
    }
    const job = this.garagaService.getJobStatus(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }
}
