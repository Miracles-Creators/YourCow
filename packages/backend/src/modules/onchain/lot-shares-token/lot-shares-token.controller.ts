import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { LotSharesTokenService } from "./lot-shares-token.service";
import { MintDto } from "./dto/mint.dto";
import { toBigInt } from "../../../utils/bigint";

@Controller("contracts/lot-shares-token")
export class LotSharesTokenController {
  constructor(private readonly lotSharesTokenService: LotSharesTokenService) {}

  @Post("lots/:lotId/mint")
  async mint(@Param("lotId") lotId: string, @Body() body: MintDto) {
    return this.lotSharesTokenService.mint(
      toBigInt(lotId),
      body.to,
      toBigInt(body.amount)
    );
  }

  @Post("lots/:lotId/freeze")
  async freeze(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.freeze(toBigInt(lotId));
  }

  @Get("lots/:lotId/name")
  async getName(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.getName(toBigInt(lotId));
  }

  @Get("lots/:lotId/symbol")
  async getSymbol(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.getSymbol(toBigInt(lotId));
  }

  @Get("lots/:lotId/decimals")
  async getDecimals(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.getDecimals(toBigInt(lotId));
  }

  @Get("lots/:lotId/total-supply")
  async getTotalSupply(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.getTotalSupply(toBigInt(lotId));
  }

  @Get("lots/:lotId/total-shares")
  async getTotalShares(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.getTotalShares(toBigInt(lotId));
  }

  @Get("lots/:lotId/balance/:account")
  async getBalanceOf(
    @Param("lotId") lotId: string,
    @Param("account") account: string
  ) {
    return this.lotSharesTokenService.getBalanceOf(toBigInt(lotId), account);
  }

  @Get("lots/:lotId/is-frozen")
  async isFrozen(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.isFrozen(toBigInt(lotId));
  }

  @Get("lots/:lotId/is-fully-funded")
  async isFullyFunded(@Param("lotId") lotId: string) {
    return this.lotSharesTokenService.isFullyFunded(toBigInt(lotId));
  }

  @Get("lots/:lotId/allowance/:owner/:spender")
  async getAllowance(
    @Param("lotId") lotId: string,
    @Param("owner") owner: string,
    @Param("spender") spender: string
  ) {
    return this.lotSharesTokenService.getAllowance(
      toBigInt(lotId),
      owner,
      spender
    );
  }
}
