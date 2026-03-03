import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/types";
import { AcceptOfferDto, BuySharesFromLotDto, CreateOfferDto } from "./dto/dto";
import { MarketplaceService } from "./marketplace.service";

@Controller("offers")
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @UseGuards(AuthGuard)
  @Post()
  async createOffer(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOfferDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.marketplaceService.createOffer(dto, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post("buy-primary")
  async buyPrimary(
    @Req() req: AuthenticatedRequest,
    @Body() dto: BuySharesFromLotDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.marketplaceService.buySharesFromLot(dto, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post(":id/accept")
  async acceptOffer(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: AcceptOfferDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.marketplaceService.acceptOffer(Number(id), dto, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post(":id/cancel")
  async cancelOffer(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.marketplaceService.cancelOffer(Number(id), req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get("trades/mine")
  async getMyTrades(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.marketplaceService.getMyTrades(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get("trades/:tradeId/status")
  async getTradeStatus(
    @Req() req: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.marketplaceService.getTradeStatus(Number(tradeId), req.user.id);
  }

  @Get()
  async getOffers(
    @Query("lotId") lotId?: string,
    @Query("status") status?: string,
    @Query("sellerId") sellerId?: string,
  ) {
    const filters: { lotId?: number; status?: string; sellerId?: number } = {};

    if (lotId) {
      const parsed = Number(lotId);
      if (Number.isNaN(parsed)) {
        throw new BadRequestException("lotId must be a number");
      }
      filters.lotId = parsed;
    }

    if (sellerId) {
      const parsed = Number(sellerId);
      if (Number.isNaN(parsed)) {
        throw new BadRequestException("sellerId must be a number");
      }
      filters.sellerId = parsed;
    }

    if (status) {
      filters.status = status;
    }

    return this.marketplaceService.getOffers(filters);
  }

  @Get(":id")
  async getOfferById(@Param("id") id: string) {
    return this.marketplaceService.getOfferById(Number(id));
  }
}
