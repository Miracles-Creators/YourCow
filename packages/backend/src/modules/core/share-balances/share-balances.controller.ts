import { Controller, Get, Param } from "@nestjs/common";

import { ShareBalancesService } from "./share-balances.service";

@Controller("share-balances")
export class ShareBalancesController {
  constructor(private readonly shareBalancesService: ShareBalancesService) {}

  @Get()
  async listAll() {
    return this.shareBalancesService.listAll();
  }

  @Get("lot/:lotId")
  async listByLot(@Param("lotId") lotId: string) {
    return this.shareBalancesService.listByLot(Number(lotId));
  }

  @Get("investor/:investorId")
  async listByInvestor(@Param("investorId") investorId: string) {
    return this.shareBalancesService.listByInvestor(Number(investorId));
  }

  @Get("investor/:investorId/lot/:lotId")
  async getByInvestorLot(
    @Param("investorId") investorId: string,
    @Param("lotId") lotId: string,
  ) {
    return this.shareBalancesService.getByInvestorLot(
      Number(investorId),
      Number(lotId),
    );
  }
}
