import { Controller, Get, Param } from "@nestjs/common";

import { ShareTransfersService } from "./share-transfers.service";

@Controller("share-transfers")
export class ShareTransfersController {
  constructor(private readonly shareTransfersService: ShareTransfersService) {}

  @Get()
  async listAll() {
    return this.shareTransfersService.listAll();
  }

  @Get("lot/:lotId")
  async listByLot(@Param("lotId") lotId: string) {
    return this.shareTransfersService.listByLot(Number(lotId));
  }

  @Get("investor/:investorId")
  async listByInvestor(@Param("investorId") investorId: string) {
    return this.shareTransfersService.listByInvestor(Number(investorId));
  }
}
