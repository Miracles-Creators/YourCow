import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  AssetType,
  Offer,
  OfferStatus,
  Prisma,
  Trade,
  TradeStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client-runtime-utils";

import { PrismaService } from "../../../database/prisma.service";
import { TongoService } from "../../onchain/tongo/tongo.service";
import { CustodyService } from "../custody/custody.service";
import { LedgerService } from "../ledger/ledger.service";
import { AcceptOfferDto } from "./dto/dto";

@Injectable()
export class PrivateTradeService {
  private readonly logger = new Logger(PrivateTradeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tongoService: TongoService,
    private readonly custodyService: CustodyService,
    private readonly ledgerService: LedgerService,
  ) {}

  async acceptOfferStrk(
    offer: Offer,
    dto: AcceptOfferDto,
    buyerId: number,
  ): Promise<Trade> {
    if (offer.status !== OfferStatus.OPEN && offer.status !== OfferStatus.PARTIALLY_FILLED) {
      throw new BadRequestException("Offer is not open for acceptance");
    }
    if (offer.sellerId === buyerId) {
      throw new BadRequestException("Buyer cannot accept their own offer");
    }
    const remainingShares = offer.sharesAmount - offer.sharesFilled;
    if (dto.sharesAmount > remainingShares) {
      throw new BadRequestException("sharesAmount exceeds remaining offer shares");
    }

    const strkPrice = offer.strkPricePerShare;
    if (!strkPrice || !/^\d+$/.test(strkPrice)) {
      throw new BadRequestException("Offer has no valid STRK price");
    }
    const strkTotalPrice = (BigInt(strkPrice) * BigInt(dto.sharesAmount)).toString();

    const buyerBalance = await this.tongoService.getBalance(buyerId);
    if (buyerBalance.current < BigInt(strkTotalPrice)) {
      throw new BadRequestException("Insufficient Tongo balance");
    }

    // Step 1: Create pending trade + lock seller shares
    const trade = await this.prisma.$transaction(async (tx) => {
      const sellerAccount = await this.custodyService.getOrCreateAccountTx(tx, offer.sellerId);
      await this.custodyService.lockShares(
        tx,
        sellerAccount.id,
        offer.lotId,
        new Decimal(dto.sharesAmount),
      );

      return tx.trade.create({
        data: {
          offerId: offer.id,
          buyerId,
          sharesAmount: dto.sharesAmount,
          totalPrice: 0,
          strkTotalPrice,
          feeAmount: 0,
          currency: "STRK",
          status: TradeStatus.PENDING,
          idempotencyKey: dto.idempotencyKey,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Step 2+3: Process async — don't block HTTP request (M4)
    this.processTradeAsync(trade.id, buyerId, offer, strkTotalPrice).catch(
      (err) => this.logger.error(`Trade ${trade.id} async processing failed`, err),
    );

    return trade;
  }

  private async processTradeAsync(
    tradeId: number,
    buyerId: number,
    offer: Offer,
    strkTotalPrice: string,
  ) {
    // Step 2a: Execute Tongo transfer
    try {
      const txHash = await this.tongoService.transfer(
        buyerId,
        offer.sellerId,
        BigInt(strkTotalPrice),
      );

      // Step 2b: Mark TONGO_SETTLED after transfer confirms (C6)
      await this.prisma.trade.update({
        where: { id: tradeId },
        data: { status: TradeStatus.TONGO_SETTLED, tongoTxHash: txHash },
      });
    } catch (error) {
      // Transfer failed — safe to unlock shares (money never moved)
      await this.failTrade(tradeId);
      return;
    }

    // Step 2c: Rollover separately — transfer already succeeded (C5)
    try {
      await this.tongoService.rollover(offer.sellerId);
    } catch (error) {
      this.logger.warn(
        `Rollover failed for seller ${offer.sellerId}, trade ${tradeId} — pending balance`,
      );
    }

    // Step 3: Finalize — transfer shares and update status
    await this.finalizeTrade(tradeId);
  }

  private async finalizeTrade(tradeId: number) {
    await this.prisma.$transaction(async (tx) => {
      const trade = await tx.trade.findUniqueOrThrow({
        where: { id: tradeId },
        include: { offer: true },
      });

      if (trade.status !== TradeStatus.TONGO_SETTLED) {
        this.logger.warn(`finalizeTrade called on trade ${tradeId} in status ${trade.status}, skipping`);
        return;
      }

      const sellerAccount = await this.custodyService.getOrCreateAccountTx(tx, trade.offer.sellerId);
      const buyerAccount = await this.custodyService.getOrCreateAccountTx(tx, trade.buyerId);

      await this.custodyService.transferShares(
        tx,
        sellerAccount.id,
        buyerAccount.id,
        trade.offer.lotId,
        new Decimal(trade.sharesAmount),
        true,
      );

      const newSharesFilled = trade.offer.sharesFilled + trade.sharesAmount;
      const newStatus =
        newSharesFilled >= trade.offer.sharesAmount
          ? OfferStatus.FILLED
          : OfferStatus.PARTIALLY_FILLED;

      await tx.offer.update({
        where: { id: trade.offerId },
        data: { sharesFilled: newSharesFilled, status: newStatus },
      });

      await this.ledgerService.writeEntries(tx, [
        {
          eventType: "TONGO_TRANSFER",
          debitAccountId: buyerAccount.id,
          creditAccountId: sellerAccount.id,
          assetType: AssetType.LOT_SHARES,
          lotId: trade.offer.lotId,
          amount: new Decimal(trade.sharesAmount),
          tradeId: trade.id,
          offerId: trade.offerId,
          description: `Tongo transfer for trade ${trade.id}`,
          metadata: {
            tradeId: trade.id,
            offerId: trade.offerId,
            buyerId: trade.buyerId,
            sellerId: trade.offer.sellerId,
            strkAmount: trade.strkTotalPrice,
          },
        },
        {
          eventType: "TRADE_SHARES",
          debitAccountId: sellerAccount.id,
          creditAccountId: buyerAccount.id,
          assetType: AssetType.LOT_SHARES,
          lotId: trade.offer.lotId,
          amount: new Decimal(trade.sharesAmount),
          tradeId: trade.id,
          offerId: trade.offerId,
          description: `Share transfer for trade ${trade.id}`,
          metadata: {
            tradeId: trade.id,
            offerId: trade.offerId,
            buyerId: trade.buyerId,
            sellerId: trade.offer.sellerId,
          },
        },
      ]);

      await tx.trade.update({
        where: { id: tradeId },
        data: { status: TradeStatus.COMPLETED },
      });
    });
  }

  private async failTrade(tradeId: number) {
    await this.prisma.$transaction(async (tx) => {
      const trade = await tx.trade.findUniqueOrThrow({
        where: { id: tradeId },
        include: { offer: true },
      });

      if (trade.status !== TradeStatus.PENDING) {
        this.logger.warn(`failTrade called on trade ${tradeId} in status ${trade.status}, skipping`);
        return;
      }

      const sellerAccount = await this.custodyService.getOrCreateAccountTx(tx, trade.offer.sellerId);
      await this.custodyService.unlockShares(
        tx,
        sellerAccount.id,
        trade.offer.lotId,
        new Decimal(trade.sharesAmount),
      );
      await tx.trade.update({
        where: { id: tradeId },
        data: { status: TradeStatus.FAILED },
      });
    });
  }
}
