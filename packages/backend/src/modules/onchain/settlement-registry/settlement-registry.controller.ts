import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { SettlementRegistryService } from "./settlement-registry.service";
import { SettleLotDto } from "./dto/settle-lot.dto";
import { toBigInt } from "../../../utils/bigint";

@Controller("contracts/settlement-registry")
export class SettlementRegistryController {
  constructor(
    private readonly settlementRegistryService: SettlementRegistryService
  ) {}

  @Post("settle")
  async settleLot(@Body() body: SettleLotDto) {
    return this.settlementRegistryService.settleLot({
      lotId: toBigInt(body.lotId),
      finalReportHash: body.finalReportHash,
      totalProceeds: toBigInt(body.totalProceeds),
    });
  }

  @Get("lots/:lotId/settlement")
  async getSettlement(@Param("lotId") lotId: string) {
    return this.settlementRegistryService.getSettlement(toBigInt(lotId));
  }

  @Get("lots/:lotId/is-settled")
  async isSettled(@Param("lotId") lotId: string) {
    return this.settlementRegistryService.isSettled(toBigInt(lotId));
  }

  @Get("lot-factory")
  async getLotFactory() {
    return this.settlementRegistryService.getLotFactory();
  }

  @Get("protocol-operator")
  async getProtocolOperator() {
    return this.settlementRegistryService.getProtocolOperator();
  }
}
