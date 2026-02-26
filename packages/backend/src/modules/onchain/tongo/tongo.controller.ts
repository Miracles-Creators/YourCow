import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthGuard } from "../../core/auth/auth.guard";
import type { AuthenticatedRequest } from "../../core/auth/types";
import { TongoService } from "./tongo.service";
import { DepositConfirmDto, WithdrawDto, PrefundDto } from "./dto/tongo.dto";

@Controller("tongo")
@UseGuards(AuthGuard)
export class TongoController {
  constructor(private readonly tongoService: TongoService) {}

  @Post("deposit-confirm")
  async confirmDeposit(@Req() req: AuthenticatedRequest, @Body() dto: DepositConfirmDto) {
    const userId = req.user!.id;
    if (!dto.txHash || !dto.amount) {
      throw new BadRequestException("txHash and amount are required");
    }
    if (!/^\d+$/.test(dto.amount)) {
      throw new BadRequestException("amount must be a non-negative integer string");
    }
    const tongoTxHash = await this.tongoService.confirmDeposit(
      userId,
      dto.txHash,
      dto.amount,
    );
    return { tongoTxHash };
  }

  @Post("withdraw")
  async withdraw(@Req() req: AuthenticatedRequest, @Body() dto: WithdrawDto) {
    const userId = req.user!.id;
    if (!dto.toAddress || !dto.amount) {
      throw new BadRequestException("toAddress and amount are required");
    }
    if (!/^\d+$/.test(dto.amount)) {
      throw new BadRequestException("amount must be a non-negative integer string");
    }
    const txHash = await this.tongoService.withdraw(
      userId,
      dto.toAddress,
      BigInt(dto.amount),
    );
    return { txHash };
  }

  @Post("prefund")
  async prefund(@Req() req: AuthenticatedRequest, @Body() dto: PrefundDto) {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin role required");
    }
    if (!dto.userId || !dto.amount) {
      throw new BadRequestException("userId and amount are required");
    }
    if (!/^\d+$/.test(dto.amount)) {
      throw new BadRequestException("amount must be a non-negative integer string");
    }
    await this.tongoService.createTongoAccount(dto.userId);
    const txHash = await this.tongoService.fund(dto.userId, BigInt(dto.amount));
    return { txHash };
  }

  @Get("config")
  async getConfig() {
    const operator = this.tongoService.getOperatorAddress();
    return { operatorAddress: operator };
  }

  @Get("balance")
  async getBalance(@Req() req: AuthenticatedRequest) {
    const userId = req.user!.id;

    // Ensure Tongo account exists
    await this.tongoService.createTongoAccount(userId);

    const balance = await this.tongoService.getBalance(userId);
    return {
      current: balance.current.toString(),
      pending: balance.pending.toString(),
    };
  }
}
