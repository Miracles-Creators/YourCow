import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateSettlementDto } from "./dto/create-settlement.dto";
import { SettlementsService } from "./settlements.service";

@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  async createSettlement(@Body() body: CreateSettlementDto) {
    return this.settlementsService.createSettlement(body);
  }

  @Get()
  async listSettlements() {
    return this.settlementsService.listSettlements();
  }

  @Post(":id/confirm")
  async confirmSettlement(@Param("id") id: string) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId)) {
      throw new BadRequestException("id must be an integer");
    }
    return this.settlementsService.confirmSettlement(parsedId);
  }

  @Get("lot/:lotId")
  async getSettlementByLotId(@Param("lotId") lotId: string) {
    return this.settlementsService.getSettlementByLotId(Number(lotId));
  }
}
