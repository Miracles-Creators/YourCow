import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AssetType,
  KycStatus,
  LotStatus,
  PrimaryPurchaseStatus,
  Offer,
  OfferStatus,
  Prisma,
  Trade,
  Balance,
} from "@prisma/client";
import { Decimal } from "@prisma/client-runtime-utils";

import { PrismaService } from "../../../database/prisma.service";
import { LotSharesTokenService } from "../../onchain/lot-shares-token/lot-shares-token.service";
import { CustodyService } from "../custody/custody.service";
import { LedgerService } from "../ledger/ledger.service";
import { computeLotFields } from "../lots/lots.service";
import { AcceptOfferDto, BuySharesFromLotDto, CreateOfferDto } from "./dto/dto";
import { PrivateTradeService } from "./private-trade.service";

const FEE_BPS = 100;
const BPS_BASE = 10_000;

type OfferFilters = {
  lotId?: number;
  status?: string;
  sellerId?: number;
};

type FiatAssetType = "FIAT_ARS" | "FIAT_USD";

type PortfolioFiatBalance = {
  currency: string;
  available: string;
  locked: string;
  total: string;
};

type PortfolioLotPosition = {
  lotId: number;
  lotName: string | null;
  available: string;
  locked: string;
  total: string;
  valuation: string | null;
  lastPricePerShare: number | null;
};

type PortfolioSummary = {
  accountId: number;
  fiat: PortfolioFiatBalance[];
  lots: PortfolioLotPosition[];
};

type PortfolioLotDetail = {
  accountId: number;
  lotId: number;
  lotName: string | null;
  available: string;
  locked: string;
  total: string;
  activeOffers: Array<{
    id: number;
    sharesAmount: number;
    sharesFilled: number;
    remainingShares: number;
    pricePerShare: number;
    currency: string;
    status: OfferStatus;
    createdAt: Date;
  }>;
};

type PrimaryPurchaseResult = {
  txHash: string;
  balance: Balance;
  sharesAmount: number;
  totalCost: number;
};

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly custodyService: CustodyService,
    private readonly ledgerService: LedgerService,
    private readonly lotSharesTokenService: LotSharesTokenService,
    private readonly privateTradeService: PrivateTradeService,
  ) {}

  async createOffer(dto: CreateOfferDto, userId: number): Promise<Offer> {
    await this.ensureKycApproved(userId);
    this.assertPositiveInt(dto.lotId, "lotId");
    this.assertPositiveInt(dto.sharesAmount, "sharesAmount");
    this.assertIdempotencyKey(dto.idempotencyKey);

    const currency = this.normalizeCurrency(dto.currency);
    if (currency === "STRK") {
      if (!dto.strkPricePerShare || !/^\d+$/.test(dto.strkPricePerShare) || BigInt(dto.strkPricePerShare) <= 0n) {
        throw new BadRequestException("strkPricePerShare must be a positive integer string for STRK offers");
      }
    } else {
      this.assertPositiveInt(dto.pricePerShare, "pricePerShare");
      this.resolveFiatAssetType(currency);
    }

    const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId } });
    if (!lot) {
      throw new NotFoundException(`Lot with id ${dto.lotId} not found`);
    }
    if (lot.status !== LotStatus.ACTIVE) {
      throw new BadRequestException(
        `Lot must be ACTIVE to sell shares (current: ${lot.status})`,
      );
    }

    const existing = await this.prisma.offer.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      throw new BadRequestException("idempotencyKey already used for another offer");
    }

    const account = await this.custodyService.getOrCreateAccount(userId);
    const balance = await this.custodyService.getBalance(
      account.id,
      AssetType.LOT_SHARES,
      dto.lotId,
    );

    if (balance.available.lessThan(new Decimal(dto.sharesAmount))) {
      throw new BadRequestException(
        `Insufficient available shares: have ${balance.available.toString()}, need ${dto.sharesAmount}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.custodyService.lockShares(
        tx,
        account.id,
        dto.lotId,
        new Decimal(dto.sharesAmount),
      );

      const offer = await tx.offer.create({
        data: {
          sellerId: userId,
          lotId: dto.lotId,
          sharesAmount: dto.sharesAmount,
          pricePerShare: dto.pricePerShare,
          strkPricePerShare: dto.strkPricePerShare ?? null,
          currency,
          idempotencyKey: dto.idempotencyKey,
          status: OfferStatus.OPEN,
        },
      });

      return offer;
    });
  }

  //TODO:REFACTOR THIS, IS TOO LARGE
  async buySharesFromLot(dto: BuySharesFromLotDto, userId: number): Promise<PrimaryPurchaseResult> {
    await this.ensureKycApproved(userId);
    this.assertPositiveInt(dto.lotId, "lotId");
    this.assertPositiveInt(dto.sharesAmount, "sharesAmount");
    this.assertIdempotencyKey(dto.idempotencyKey);

    const existingPurchase = await this.prisma.primaryPurchase.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existingPurchase) {
      if (
        existingPurchase.userId !== userId ||
        existingPurchase.lotId !== dto.lotId ||
        existingPurchase.sharesAmount !== dto.sharesAmount
      ) {
        throw new BadRequestException("idempotencyKey already used for another purchase");
      }

      if (existingPurchase.status === PrimaryPurchaseStatus.COMPLETED) {
        const account = await this.custodyService.getOrCreateAccount(userId);
        const balance = await this.prisma.balance.findFirst({
          where: {
            accountId: account.id,
            assetType: AssetType.LOT_SHARES,
            lotId: existingPurchase.lotId,
          },
        });
        if (!balance) {
          throw new NotFoundException("Balance not found");
        }
        return {
          txHash: existingPurchase.txHash ?? "",
          balance,
          sharesAmount: existingPurchase.sharesAmount,
          totalCost: existingPurchase.totalCost,
        };
      }

      if (existingPurchase.status === PrimaryPurchaseStatus.ONCHAIN_MINTED) {
        return this.finalizePrimaryPurchase(existingPurchase.id);
      }

      throw new BadRequestException("Primary purchase is already in progress");
    }

    // Get lot and verify it exists
    const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId } });
    if (!lot) {
      throw new NotFoundException(`Lot with id ${dto.lotId} not found`);
    }

    if (!lot.onChainLotId) {
      throw new BadRequestException("Lot is not deployed on-chain yet");
    }

    if (lot.status !== LotStatus.FUNDING) {
      throw new BadRequestException("Lot is not accepting investments");
    }

    // Calculate total cost
    const totalCost = lot.pricePerShare * dto.sharesAmount;
    if (!Number.isSafeInteger(totalCost)) {
      throw new BadRequestException("Total cost exceeds safe integer range");
    }

    // Get user account and verify fiat balance
    const userAccount = await this.custodyService.getOrCreateAccount(userId);
    const vaultAccount = await this.custodyService.getOrCreateSystemAccount("PROTOCOL_VAULT");

    //TODO: review this Assume lot uses ARS for now (could be made configurable)
    const currency = "ARS";
    const assetType = this.resolveFiatAssetType(currency);
    const userFiatBalance = await this.custodyService.getBalance(userAccount.id, assetType, null);

    if (userFiatBalance.available.lessThan(new Decimal(totalCost))) {
      throw new BadRequestException(
        `Insufficient fiat balance: have ${userFiatBalance.available.toString()}, need ${totalCost}`,
      );
    }

    const protocolVaultAddress = process.env.PROTOCOL_VAULT_ADDRESS;
    if (!protocolVaultAddress) {
      throw new BadRequestException("Protocol vault address not configured");
    }

    const purchase = await this.prisma.$transaction(async (tx) => {
      await this.custodyService.lockFiat(
        tx,
        userAccount.id,
        assetType,
        new Decimal(totalCost),
      );

      return tx.primaryPurchase.create({
        data: {
          userId,
          lotId: dto.lotId,
          sharesAmount: dto.sharesAmount,
          totalCost,
          currency,
          idempotencyKey: dto.idempotencyKey,
          status: PrimaryPurchaseStatus.PENDING,
        },
      });
    });

    // Mint on-chain after DB transaction succeeds
    let txHash: string;
    try {
      txHash = await this.lotSharesTokenService.mint(
        BigInt(lot.onChainLotId),
        protocolVaultAddress,
        BigInt(dto.sharesAmount),
      );
    } catch (error) {
      await this.prisma.$transaction(async (tx) => {
        await this.custodyService.unlockFiat(
          tx,
          userAccount.id,
          assetType,
          new Decimal(totalCost),
        );
        await tx.primaryPurchase.update({
          where: { id: purchase.id },
          data: { status: PrimaryPurchaseStatus.FAILED },
        });
      });
      throw error;
    }

    await this.prisma.primaryPurchase.update({
      where: { id: purchase.id },
      data: {
        status: PrimaryPurchaseStatus.ONCHAIN_MINTED,
        txHash,
      },
    });

    // TODO: Add retry/recovery path if finalizePrimaryPurchase fails after on-chain mint.
    return this.finalizePrimaryPurchase(purchase.id);
  }

  //TODO:REVIEW THIS IS TOO LARGE
  async acceptOffer(
    offerId: number,
    dto: AcceptOfferDto,
    buyerId: number,
  ): Promise<Trade> {
    await this.ensureKycApproved(buyerId);
    this.assertPositiveInt(offerId, "offerId");
    this.assertPositiveInt(dto.sharesAmount, "sharesAmount");
    this.assertIdempotencyKey(dto.idempotencyKey);

    const existingTrade = await this.prisma.trade.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existingTrade) {
      throw new BadRequestException("idempotencyKey already used for another trade");
    }

    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    // STRK offers → delegate to PrivateTradeService (Tongo confidential payments)
    if (offer.currency === "STRK") {
      return this.privateTradeService.acceptOfferStrk(offer, dto, buyerId);
    }

    // Fiat offers → original synchronous flow
    return this.acceptOfferFiat(offer, dto, buyerId);
  }

  private async acceptOfferFiat(
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

    const totalPrice = offer.pricePerShare * dto.sharesAmount;

    const buyerFee = Math.floor((totalPrice * FEE_BPS) / BPS_BASE);
    const sellerFee = Math.floor((totalPrice * FEE_BPS) / BPS_BASE);
    const totalFee = buyerFee + sellerFee;
    const sellerNet = totalPrice - sellerFee;
    const buyerTotal = totalPrice + buyerFee;
    if (sellerNet < 0) {
      throw new BadRequestException("Fee calculation exceeds total price");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const assetType = this.resolveFiatAssetType(offer.currency);
        const buyerAccount = await this.custodyService.getOrCreateAccountTx(tx, buyerId);
        const sellerAccount = await this.custodyService.getOrCreateAccountTx(tx, offer.sellerId);
        const feesAccount = await this.custodyService.getOrCreateSystemAccountTx(tx, "FEES_COLLECTED");

        const buyerFiatBalance = await tx.balance.findFirst({
          where: {
            accountId: buyerAccount.id,
            assetType,
            lotId: null,
          },
        });
        const availableFiat = buyerFiatBalance?.available ?? new Decimal(0);
        const requiredFiat = new Decimal(buyerTotal);
        if (availableFiat.lessThan(requiredFiat)) {
          throw new BadRequestException(
            `Insufficient balance: have ${availableFiat.toString()}, need ${requiredFiat.toString()}`,
          );
        }

        await this.custodyService.transferShares(
          tx,
          sellerAccount.id,
          buyerAccount.id,
          offer.lotId,
          new Decimal(dto.sharesAmount),
          true,
        );

        await this.custodyService.transferFiat(
          tx,
          buyerAccount.id,
          sellerAccount.id,
          assetType,
          new Decimal(totalPrice),
        );

        if (buyerFee > 0) {
          await this.custodyService.transferFiat(
            tx,
            buyerAccount.id,
            feesAccount.id,
            assetType,
            new Decimal(buyerFee),
          );
        }

        if (sellerFee > 0) {
          await this.custodyService.transferFiat(
            tx,
            sellerAccount.id,
            feesAccount.id,
            assetType,
            new Decimal(sellerFee),
          );
        }

        const trade = await tx.trade.create({
          data: {
            offerId: offer.id,
            buyerId,
            sharesAmount: dto.sharesAmount,
            totalPrice,
            feeAmount: totalFee,
            currency: offer.currency,
            idempotencyKey: dto.idempotencyKey,
          },
        });

        const newSharesFilled = offer.sharesFilled + dto.sharesAmount;
        const newStatus = newSharesFilled >= offer.sharesAmount
          ? OfferStatus.FILLED
          : OfferStatus.PARTIALLY_FILLED;

        await tx.offer.update({
          where: { id: offer.id },
          data: {
            sharesFilled: newSharesFilled,
            status: newStatus,
          },
        });

        const ledgerEntries: Prisma.LedgerEntryUncheckedCreateInput[] = [
          {
            eventType: "TRADE_SHARES",
            debitAccountId: sellerAccount.id,
            creditAccountId: buyerAccount.id,
            assetType: AssetType.LOT_SHARES,
            lotId: offer.lotId,
            amount: new Decimal(dto.sharesAmount),
            tradeId: trade.id,
            offerId: offer.id,
            description: `Share transfer for trade ${trade.id}`,
            metadata: {
              tradeId: trade.id,
              offerId: offer.id,
              buyerId,
              sellerId: offer.sellerId,
            },
          },
          {
            eventType: "TRADE_FIAT",
            debitAccountId: buyerAccount.id,
            creditAccountId: sellerAccount.id,
            assetType,
            lotId: null,
            amount: new Decimal(totalPrice),
            tradeId: trade.id,
            offerId: offer.id,
            description: `Fiat transfer for trade ${trade.id}`,
            metadata: {
              tradeId: trade.id,
              offerId: offer.id,
              buyerId,
              sellerId: offer.sellerId,
            },
          },
        ];

        if (buyerFee > 0) {
          ledgerEntries.push({
            eventType: "FEE_CHARGE",
            debitAccountId: buyerAccount.id,
            creditAccountId: feesAccount.id,
            assetType,
            lotId: null,
            amount: new Decimal(buyerFee),
            tradeId: trade.id,
            offerId: offer.id,
            description: `Fee charge for trade ${trade.id}`,
            metadata: {
              tradeId: trade.id,
              offerId: offer.id,
              buyerId,
              sellerId: offer.sellerId,
              side: "buyer",
            },
          });
        }

        if (sellerFee > 0) {
          ledgerEntries.push({
            eventType: "FEE_CHARGE",
            debitAccountId: sellerAccount.id,
            creditAccountId: feesAccount.id,
            assetType,
            lotId: null,
            amount: new Decimal(sellerFee),
            tradeId: trade.id,
            offerId: offer.id,
            description: `Fee charge for trade ${trade.id}`,
            metadata: {
              tradeId: trade.id,
              offerId: offer.id,
              buyerId,
              sellerId: offer.sellerId,
              side: "seller",
            },
          });
        }

        await this.ledgerService.writeEntries(tx, ledgerEntries);

        return trade;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async cancelOffer(offerId: number, userId: number): Promise<Offer> {
    this.assertPositiveInt(offerId, "offerId");

    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    if (offer.sellerId !== userId) {
      throw new BadRequestException("Only the seller can cancel this offer");
    }

    if (offer.status !== OfferStatus.OPEN && offer.status !== OfferStatus.PARTIALLY_FILLED) {
      throw new BadRequestException("Offer cannot be cancelled");
    }

    const remainingShares = offer.sharesAmount - offer.sharesFilled;
    if (remainingShares <= 0) {
      throw new BadRequestException("No remaining shares to unlock");
    }

    const account = await this.custodyService.getOrCreateAccount(userId);

    return this.prisma.$transaction(async (tx) => {
      await this.custodyService.unlockShares(
        tx,
        account.id,
        offer.lotId,
        new Decimal(remainingShares),
      );

      const updatedOffer = await tx.offer.update({
        where: { id: offer.id },
        data: { status: OfferStatus.CANCELLED },
      });

      return updatedOffer;
    });
  }

  async getOffers(filters: OfferFilters = {}): Promise<Offer[]> {
    const where: Prisma.OfferWhereInput = {};

    if (filters.lotId != null) {
      where.lotId = filters.lotId;
    }

    if (filters.sellerId != null) {
      where.sellerId = filters.sellerId;
    }

    if (filters.status) {
      const normalized = filters.status.trim().toUpperCase();
      if (!Object.values(OfferStatus).includes(normalized as OfferStatus)) {
        throw new BadRequestException("Invalid offer status");
      }
      where.status = normalized as OfferStatus;
    } else {
      where.status = OfferStatus.OPEN;
    }

    return this.prisma.offer.findMany({
      where,
      include: {
        lot: {
          select: {
            id: true,
            name: true,
            pricePerShare: true,
            status: true,
            productionType: true,
            location: true,
            durationWeeks: true,
            fundingDeadline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTradeStatus(tradeId: number, userId: number) {
    this.assertPositiveInt(tradeId, "tradeId");
    const trade = await this.prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade) {
      throw new NotFoundException("Trade not found");
    }
    if (trade.buyerId !== userId) {
      throw new BadRequestException("Not your trade");
    }
    return {
      id: trade.id,
      status: trade.status,
      tongoTxHash: trade.tongoTxHash,
      strkTotalPrice: trade.strkTotalPrice,
    };
  }

  async getMyTrades(userId: number) {
    const trades = await this.prisma.trade.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { offer: { sellerId: userId } },
        ],
      },
      include: {
        offer: { include: { lot: { select: { name: true } } } },
      },
      orderBy: { settledAt: "desc" },
    });

    return trades.map((trade) => ({
      id: trade.id,
      type: trade.buyerId === userId ? ("BUY" as const) : ("SELL" as const),
      lotName: trade.offer.lot.name,
      sharesAmount: trade.sharesAmount,
      totalPrice: trade.strkTotalPrice ?? String(trade.totalPrice),
      currency: trade.currency,
      status: trade.status,
      settledAt: trade.settledAt,
    }));
  }

  async getOfferById(id: number): Promise<Offer> {
    this.assertPositiveInt(id, "id");
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }
    return offer;
  }

  async getPortfolioSummary(userId: number) {
    const account = await this.custodyService.getOrCreateAccount(userId);

    const balances = await this.prisma.balance.findMany({
      where: { accountId: account.id, assetType: AssetType.LOT_SHARES, lotId: { not: null } },
      include: { lot: true },
    });

    const purchases = await this.prisma.primaryPurchase.findMany({
      where: { userId, status: PrimaryPurchaseStatus.COMPLETED },
    });

    const investedByLot = new Map<number, number>();
    for (const p of purchases) {
      investedByLot.set(p.lotId, (investedByLot.get(p.lotId) ?? 0) + p.totalCost);
    }

    let totalInvested = 0;
    let currentValue = 0;
    let activePositions = 0;
    let settledPositions = 0;

    const lots = balances
      .filter((b) => b.lot && b.available.plus(b.locked).greaterThan(0))
      .map((b) => {
        const lot = b.lot!;
        const totalShares = Number(b.available.plus(b.locked));
        const invested = investedByLot.get(lot.id) ?? 0;
        const value = lot.pricePerShare * totalShares;

        totalInvested += invested;
        currentValue += value;
        if (lot.status === LotStatus.ACTIVE || lot.status === LotStatus.FUNDING) activePositions++;
        if (lot.status === LotStatus.COMPLETED) settledPositions++;

        return {
          lotId: lot.id,
          lotName: lot.name,
          invested,
          currentValue: value,
          returnPercent: invested > 0 ? Number((((value - invested) / invested) * 100).toFixed(2)) : 0,
          status: lot.status,
          productionType: lot.productionType,
          ...computeLotFields(lot),
        };
      });

    const totalGain = currentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? Number(((totalGain / totalInvested) * 100).toFixed(2)) : 0;

    return { totalInvested, currentValue, totalGain, returnPercent, activePositions, settledPositions, lots };
  }

  //TODO:REVIEW THIS IS
  async getPortfolio(userId: number): Promise<PortfolioSummary> {
    const account = await this.custodyService.getOrCreateAccount(userId);

    const balances = await this.prisma.balance.findMany({
      where: { accountId: account.id },
      include: {
        lot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ assetType: "asc" }, { lotId: "asc" }],
    });

    const fiat: PortfolioFiatBalance[] = [];
    const lotMap = new Map<number, { available: Decimal; locked: Decimal; lotName: string | null }>();

    for (const balance of balances) {
      if (balance.assetType === AssetType.LOT_SHARES && balance.lotId != null) {
        const existing = lotMap.get(balance.lotId) ?? {
          available: new Decimal(0),
          locked: new Decimal(0),
          lotName: balance.lot?.name ?? null,
        };
        existing.available = existing.available.plus(balance.available);
        existing.locked = existing.locked.plus(balance.locked);
        lotMap.set(balance.lotId, existing);
      } else if (balance.assetType === AssetType.FIAT_ARS || balance.assetType === AssetType.FIAT_USD) {
        const available = this.toIntegerString(balance.available);
        const locked = this.toIntegerString(balance.locked);
        const total = this.toIntegerString(balance.available.plus(balance.locked));
        fiat.push({
          currency: this.assetTypeToCurrency(balance.assetType),
          available,
          locked,
          total,
        });
      }
    }

    const lotIds = Array.from(lotMap.keys());
    const latestOffers = lotIds.length
      ? await this.prisma.offer.findMany({
          where: {
            lotId: { in: lotIds },
            status: { in: [OfferStatus.OPEN, OfferStatus.PARTIALLY_FILLED] },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const latestPriceByLot = new Map<number, number>();
    for (const offer of latestOffers) {
      if (!latestPriceByLot.has(offer.lotId)) {
        latestPriceByLot.set(offer.lotId, offer.pricePerShare);
      }
    }

    const lots: PortfolioLotPosition[] = [];
    for (const [lotId, position] of lotMap.entries()) {
      const totalShares = position.available.plus(position.locked);
      if (totalShares.isZero()) {
        continue;
      }
      const lastPrice = latestPriceByLot.get(lotId) ?? null;
      const valuation = lastPrice == null
        ? null
        : this.toIntegerString(new Decimal(lastPrice).mul(totalShares));

      lots.push({
        lotId,
        lotName: position.lotName,
        available: this.toIntegerString(position.available),
        locked: this.toIntegerString(position.locked),
        total: this.toIntegerString(totalShares),
        valuation,
        lastPricePerShare: lastPrice,
      });
    }

    return {
      accountId: account.id,
      fiat,
      lots,
    };
  }

  async getPortfolioByLot(userId: number, lotId: number): Promise<PortfolioLotDetail> {
    this.assertPositiveInt(lotId, "lotId");

    const account = await this.custodyService.getOrCreateAccount(userId);
    const balance = await this.prisma.balance.findFirst({
      where: {
        accountId: account.id,
        assetType: AssetType.LOT_SHARES,
        lotId,
      },
      include: {
        lot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const available = balance?.available ?? new Decimal(0);
    const locked = balance?.locked ?? new Decimal(0);
    const total = available.plus(locked);

    const activeOffers = await this.prisma.offer.findMany({
      where: {
        sellerId: userId,
        lotId,
        status: { in: [OfferStatus.OPEN, OfferStatus.PARTIALLY_FILLED] },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      accountId: account.id,
      lotId,
      lotName: balance?.lot?.name ?? null,
      available: this.toIntegerString(available),
      locked: this.toIntegerString(locked),
      total: this.toIntegerString(total),
      activeOffers: activeOffers.map((offer) => ({
        id: offer.id,
        sharesAmount: offer.sharesAmount,
        sharesFilled: offer.sharesFilled,
        remainingShares: offer.sharesAmount - offer.sharesFilled,
        pricePerShare: offer.pricePerShare,
        currency: offer.currency,
        status: offer.status,
        createdAt: offer.createdAt,
      })),
    };
  }

  private async ensureKycApproved(userId: number): Promise<void> {
    // TODO: Re-enable KYC checks when the flow is ready.
    // For now, skip KYC to allow MVP end-to-end testing (ENABLE_KYC flag).
    if (process.env.ENABLE_KYC !== "true") {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { kycProfile: true },
    });

    if (!user || !user.kycProfile || user.kycProfile.status !== KycStatus.APPROVED) {
      throw new BadRequestException("KYC not approved");
    }
  }

  private normalizeCurrency(currency: string): string {
    const normalized = currency?.trim().toUpperCase();
    if (!normalized) {
      throw new BadRequestException("currency is required");
    }
    return normalized;
  }

  private resolveFiatAssetType(currency: string): FiatAssetType {
    const normalized = this.normalizeCurrency(currency);
    if (normalized === "ARS") {
      return AssetType.FIAT_ARS;
    }
    if (normalized === "USD") {
      return AssetType.FIAT_USD;
    }
    throw new BadRequestException(`Unsupported currency: ${currency}`);
  }

  private assetTypeToCurrency(assetType: AssetType): string {
    if (assetType === AssetType.FIAT_ARS) {
      return "ARS";
    }
    if (assetType === AssetType.FIAT_USD) {
      return "USD";
    }
    return assetType;
  }

  private assertPositiveInt(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
  }

  private assertIdempotencyKey(key: string): void {
    if (!key || !key.trim()) {
      throw new BadRequestException("idempotencyKey is required");
    }
  }

  private toIntegerString(value: Decimal): string {
    const raw = value.toString();
    if (!raw.includes(".")) {
      return raw;
    }
    const [whole, fraction] = raw.split(".");
    if (fraction && /^0+$/.test(fraction)) {
      return whole;
    }
    return raw;
  }

  private async finalizePrimaryPurchase(purchaseId: number): Promise<PrimaryPurchaseResult> {
    const purchase = await this.prisma.primaryPurchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new NotFoundException("Primary purchase not found");
    }

    if (purchase.status === PrimaryPurchaseStatus.COMPLETED) {
      const account = await this.custodyService.getOrCreateAccount(purchase.userId);
      const balance = await this.prisma.balance.findFirst({
        where: {
          accountId: account.id,
          assetType: AssetType.LOT_SHARES,
          lotId: purchase.lotId,
        },
      });
      if (!balance) {
        throw new NotFoundException("Balance not found");
      }
      return {
        txHash: purchase.txHash ?? "",
        balance,
        sharesAmount: purchase.sharesAmount,
        totalCost: purchase.totalCost,
      };
    }

    if (purchase.status !== PrimaryPurchaseStatus.ONCHAIN_MINTED) {
      throw new BadRequestException("Primary purchase is not ready to settle");
    }

    const userAccount = await this.custodyService.getOrCreateAccount(purchase.userId);
    const vaultAccount = await this.custodyService.getOrCreateSystemAccount("PROTOCOL_VAULT");
    const assetType = this.resolveFiatAssetType(purchase.currency);

    return this.prisma.$transaction(async (tx) => {
      await this.custodyService.transferFiat(
        tx,
        userAccount.id,
        vaultAccount.id,
        assetType,
        new Decimal(purchase.totalCost),
        true,
      );

      const balance = await this.custodyService.creditShares(
        tx,
        userAccount.id,
        purchase.lotId,
        new Decimal(purchase.sharesAmount),
      );

      await this.ledgerService.writeEntry(tx, {
        eventType: "SHARES_MINT",
        debitAccountId: vaultAccount.id,
        creditAccountId: userAccount.id,
        assetType: AssetType.LOT_SHARES,
        lotId: purchase.lotId,
        amount: new Decimal(purchase.sharesAmount),
        txHash: purchase.txHash ?? undefined,
        description: `Buy shares from primary market for lot ${purchase.lotId}`,
        metadata: {
          userId: purchase.userId,
          lotId: purchase.lotId,
          sharesAmount: purchase.sharesAmount,
          totalCost: purchase.totalCost,
          purchaseId: purchase.id,
        },
      });

      await tx.primaryPurchase.update({
        where: { id: purchase.id },
        data: { status: PrimaryPurchaseStatus.COMPLETED },
      });

      // Auto-transition FUNDING → ACTIVE when 100% shares are sold
      const lot = await tx.lot.findUnique({ where: { id: purchase.lotId } });
      if (lot && lot.status === LotStatus.FUNDING) {
        const totals = await tx.balance.aggregate({
          where: { assetType: AssetType.LOT_SHARES, lotId: purchase.lotId },
          _sum: { available: true, locked: true },
        });
        const totalSold = (totals._sum.available ?? new Decimal(0))
          .plus(totals._sum.locked ?? new Decimal(0));
        if (totalSold.greaterThanOrEqualTo(lot.totalShares)) {
          await tx.lot.update({
            where: { id: purchase.lotId },
            data: { status: LotStatus.ACTIVE },
          });
        }
      }

      return {
        txHash: purchase.txHash ?? "",
        balance,
        sharesAmount: purchase.sharesAmount,
        totalCost: purchase.totalCost,
      };
    });
  }
}
