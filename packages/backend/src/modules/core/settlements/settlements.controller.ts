import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateSettlementDto } from "./dto/create-settlement.dto";
import { SettlementsService } from "./settlements.service";

@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  async createSettlement(@Body() body: CreateSettlementDto) {
    return this.settlementsService.createSettlement(body);
  }

  @Get("lot/:lotId")
  async getSettlementByLotId(@Param("lotId") lotId: string) {
    return this.settlementsService.getSettlementByLotId(lotId);
  }
}
