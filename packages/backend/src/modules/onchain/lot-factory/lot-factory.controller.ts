import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { LotFactoryService } from "./lot-factory.service";
import { CreateLotOnChainDto, SetLotStatusDto } from "./dto/lot-factory.dto";
import { LotStatus } from "../../../starknet/types";
import { toBigInt } from "../../../utils/bigint";

@Controller("contracts/lot-factory")
export class LotFactoryController {
  constructor(private readonly lotFactoryService: LotFactoryService) {}

  @Post("lots")
  async createLot(@Body() body: CreateLotOnChainDto) {
    return this.lotFactoryService.createLot({
      producer: body.producer,
      totalShares: toBigInt(body.totalShares),
      initialPricePerShare: toBigInt(body.initialPricePerShare),
      metadataHash: body.metadataHash,
      tokenName: body.tokenName,
      tokenSymbol: body.tokenSymbol,
    });
  }

  @Get("lots/:lotId")
  async getLot(@Param("lotId") lotId: string) {
    return this.lotFactoryService.getLot(toBigInt(lotId));
  }

  @Get("lots/:lotId/status")
  async getLotStatus(@Param("lotId") lotId: string) {
    return this.lotFactoryService.getLotStatus(toBigInt(lotId));
  }

  @Post("lots/:lotId/status")
  async setLotStatus(
    @Param("lotId") lotId: string,
    @Body() body: SetLotStatusDto
  ) {
    return this.lotFactoryService.setLotStatus(
      toBigInt(lotId),
      body.newStatus as LotStatus
    );
  }

  @Get("lots/:lotId/shares-token")
  async getSharesToken(@Param("lotId") lotId: string) {
    return this.lotFactoryService.getSharesToken(toBigInt(lotId));
  }

  @Get("next-lot-id")
  async getNextLotId() {
    return this.lotFactoryService.getNextLotId();
  }

  @Get("lots/:lotId/initial-price")
  async getInitialPricePerShare(@Param("lotId") lotId: string) {
    return this.lotFactoryService.getInitialPricePerShare(toBigInt(lotId));
  }

  @Get("protocol-operator")
  async getProtocolOperator() {
    return this.lotFactoryService.getProtocolOperator();
  }
}
