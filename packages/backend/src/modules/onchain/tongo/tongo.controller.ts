import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { TongoService } from "./tongo.service";
import { DepositConfirmDto, WithdrawDto } from "./dto/tongo.dto";

@Controller("tongo")
export class TongoController {
  constructor(private readonly tongoService: TongoService) {}

  @Post("deposit-confirm")
  async confirmDeposit(@Req() req: any, @Body() dto: DepositConfirmDto) {
    const userId = req.userId as number;
    if (!dto.txHash || !dto.amount) {
      throw new BadRequestException("txHash and amount are required");
    }
    const tongoTxHash = await this.tongoService.confirmDeposit(
      userId,
      dto.txHash,
      dto.amount,
    );
    return { tongoTxHash };
  }

  @Post("withdraw")
  async withdraw(@Req() req: any, @Body() dto: WithdrawDto) {
    const userId = req.userId as number;
    if (!dto.toAddress || !dto.amount) {
      throw new BadRequestException("toAddress and amount are required");
    }
    const txHash = await this.tongoService.withdraw(
      userId,
      dto.toAddress,
      BigInt(dto.amount),
    );
    return { txHash };
  }

  @Get("balance")
  async getBalance(@Req() req: any) {
    const userId = req.userId as number;

    // Ensure Tongo account exists
    await this.tongoService.createTongoAccount(userId);

    const balance = await this.tongoService.getBalance(userId);
    return {
      current: balance.current.toString(),
      pending: balance.pending.toString(),
    };
  }
}
