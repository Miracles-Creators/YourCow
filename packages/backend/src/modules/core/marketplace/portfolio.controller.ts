import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/types";
import { MarketplaceService } from "./marketplace.service";


//todo:review if we want this here
@Controller("portfolio")
@UseGuards(AuthGuard)
export class PortfolioController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get("summary")
  async getPortfolioSummary(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.marketplaceService.getPortfolioSummary(req.user.id);
  }

  @Get()
  async getPortfolio(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }

    return this.marketplaceService.getPortfolio(req.user.id);
  }

  @Get(":lotId")
  async getPortfolioByLot(
    @Req() req: AuthenticatedRequest,
    @Param("lotId") lotId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }

    const parsedLotId = Number(lotId);
    if (Number.isNaN(parsedLotId)) {
      throw new BadRequestException("lotId must be a number");
    }

    return this.marketplaceService.getPortfolioByLot(req.user.id, parsedLotId);
  }
}
