import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Account, AccountType, AssetType, Balance, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client-runtime-utils";

import { PrismaService } from "../../../database/prisma.service";

// Type for Prisma transaction client (exported for use in other services)
export type PrismaTransaction = Prisma.TransactionClient | PrismaService;

// Balance result type
export interface BalanceResult {
  available: Decimal;
  locked: Decimal;
}

// Type aliases for fiat asset types
type FiatAssetType = "FIAT_ARS" | "FIAT_USD";

// Type alias for system account types
type SystemAccountType = "FEES_COLLECTED" | "PROTOCOL_VAULT";
//TODO:LEARN BETTER THIS, EACH FUNCTION
@Injectable()
export class CustodyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create a TRADING account for a user
   */
  async getOrCreateAccount(userId: number): Promise<Account> {
    const existing = await this.prisma.account.findUnique({
      where: {
        userId_type: {
          userId,
          type: "TRADING",
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.account.create({
      data: {
        userId,
        type: "TRADING",
      },
    });
  }

  /**
   * Get or create a TRADING account for a user within a transaction
   */
  async getOrCreateAccountTx(tx: PrismaTransaction, userId: number): Promise<Account> {
    const existing = await tx.account.findUnique({
      where: {
        userId_type: {
          userId,
          type: "TRADING",
        },
      },
    });

    if (existing) {
      return existing;
    }

    return tx.account.create({
      data: {
        userId,
        type: "TRADING",
      },
    });
  }

  /**
   * Get or create a system account (FEES_COLLECTED or PROTOCOL_VAULT)
   */
  async getOrCreateSystemAccount(type: SystemAccountType): Promise<Account> {
    const existing = await this.prisma.account.findFirst({
      where: {
        type,
        userId: null,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.account.create({
      data: {
        type,
        userId: null,
      },
    });
  }

  /**
   * Get or create a system account within a transaction
   */
  async getOrCreateSystemAccountTx(
    tx: PrismaTransaction,
    type: SystemAccountType,
  ): Promise<Account> {
    const existing = await tx.account.findFirst({
      where: {
        type,
        userId: null,
      },
    });

    if (existing) {
      return existing;
    }

    return tx.account.create({
      data: {
        type,
        userId: null,
      },
    });
  }
  /**
   * Get balance for an account. Returns {available: 0, locked: 0} if not found.
   */
  async getBalance(accountId: number, assetType: AssetType, lotId?: number | null): Promise<BalanceResult> {
    const balance = await this.prisma.balance.findFirst({
      where: {
        accountId,
        assetType,
        lotId: lotId ?? null,
      },
    });

    if (!balance) {
      return {
        available: new Decimal(0),
        locked: new Decimal(0),
      };
    }

    return {
      available: balance.available,
      locked: balance.locked,
    };
  }

  /**
   * Get or create a balance record
   */
  async getOrCreateBalance(
    tx: PrismaTransaction,
    accountId: number,
    assetType: AssetType,
    lotId: number | null,
  ): Promise<Balance> {
    const existing = await tx.balance.findFirst({
      where: {
        accountId,
        assetType,
        lotId,
      },
    });

    if (existing) {
      return existing;
    }

    return tx.balance.create({
      data: {
        accountId,
        assetType,
        lotId,
        available: new Decimal(0),
        locked: new Decimal(0),
      },
    });
  }

  /**
   * Lock shares: move from available to locked.
   * Fails if available < amount.
   */
  async lockShares(
    tx: PrismaTransaction,
    accountId: number,
    lotId: number,
    amount: Decimal,
  ): Promise<Balance> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    const balance = await this.getOrCreateBalance(tx, accountId, "LOT_SHARES", lotId);

    if (balance.available.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient available shares: have ${balance.available.toString()}, need ${amount.toString()}`,
      );
    }

    return tx.balance.update({
      where: { id: balance.id },
      data: {
        available: { decrement: amount },
        locked: { increment: amount },
      },
    });
  }

  /**
   * Unlock shares: move from locked to available.
   * Fails if locked < amount.
   */
  async unlockShares(
    tx: PrismaTransaction,
    accountId: number,
    lotId: number,
    amount: Decimal,
  ): Promise<Balance> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    const balance = await tx.balance.findUnique({
      where: {
        accountId_assetType_lotId: {
          accountId,
          assetType: "LOT_SHARES",
          lotId,
        },
      },
    });

    if (!balance) {
      throw new NotFoundException("Balance not found");
    }

    if (balance.locked.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient locked shares: have ${balance.locked.toString()}, need ${amount.toString()}`,
      );
    }

    return tx.balance.update({
      where: { id: balance.id },
      data: {
        available: { increment: amount },
        locked: { decrement: amount },
      },
    });
  }

  /**
   * Transfer shares between accounts.
   * @param fromLocked - if true, deducts from locked balance; otherwise from available
   */
  async transferShares(
    tx: PrismaTransaction,
    fromAccountId: number,
    toAccountId: number,
    lotId: number,
    amount: Decimal,
    fromLocked: boolean,
  ): Promise<{ fromBalance: Balance; toBalance: Balance }> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    // Get source balance
    const fromBalance = await tx.balance.findUnique({
      where: {
        accountId_assetType_lotId: {
          accountId: fromAccountId,
          assetType: "LOT_SHARES",
          lotId,
        },
      },
    });

    if (!fromBalance) {
      throw new NotFoundException("Source balance not found");
    }

    const sourceAmount = fromLocked ? fromBalance.locked : fromBalance.available;
    if (sourceAmount.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient ${fromLocked ? "locked" : "available"} shares: have ${sourceAmount.toString()}, need ${amount.toString()}`,
      );
    }

    // Deduct from source
    const updatedFromBalance = await tx.balance.update({
      where: { id: fromBalance.id },
      data: fromLocked
        ? { locked: { decrement: amount } }
        : { available: { decrement: amount } },
    });

    // Get or create destination balance
    const toBalance = await this.getOrCreateBalance(tx, toAccountId, "LOT_SHARES", lotId);

    // Add to destination (always to available)
    const updatedToBalance = await tx.balance.update({
      where: { id: toBalance.id },
      data: {
        available: { increment: amount },
      },
    });

    return {
      fromBalance: updatedFromBalance,
      toBalance: updatedToBalance,
    };
  }

  /**
   * Transfer fiat between accounts.
   * @param assetType - FIAT_ARS or FIAT_USD
   */
  async transferFiat(
    tx: PrismaTransaction,
    fromAccountId: number,
    toAccountId: number,
    assetType: FiatAssetType,
    amount: Decimal,
    fromLocked = false,
  ): Promise<{ fromBalance: Balance; toBalance: Balance }> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    // Get source balance
    const fromBalance = await tx.balance.findFirst({
      where: {
        accountId: fromAccountId,
        assetType,
        lotId: null,
      },
    });

    if (!fromBalance) {
      throw new NotFoundException("Source fiat balance not found");
    }

    const sourceAmount = fromLocked ? fromBalance.locked : fromBalance.available;
    if (sourceAmount.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient fiat balance: have ${sourceAmount.toString()}, need ${amount.toString()}`,
      );
    }

    // Deduct from source
    const updatedFromBalance = await tx.balance.update({
      where: { id: fromBalance.id },
      data: fromLocked
        ? { locked: { decrement: amount } }
        : { available: { decrement: amount } },
    });

    // Get or create destination balance
    const toBalance = await this.getOrCreateBalance(tx, toAccountId, assetType, null);

    // Add to destination
    const updatedToBalance = await tx.balance.update({
      where: { id: toBalance.id },
      data: {
        available: { increment: amount },
      },
    });

    return {
      fromBalance: updatedFromBalance,
      toBalance: updatedToBalance,
    };
  }

  /**
   * Lock fiat: move from available to locked.
   * Fails if available < amount.
   */
  async lockFiat(
    tx: PrismaTransaction,
    accountId: number,
    assetType: FiatAssetType,
    amount: Decimal,
  ): Promise<Balance> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    const balance = await this.getOrCreateBalance(tx, accountId, assetType, null);

    if (balance.available.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient available fiat: have ${balance.available.toString()}, need ${amount.toString()}`,
      );
    }

    return tx.balance.update({
      where: { id: balance.id },
      data: {
        available: { decrement: amount },
        locked: { increment: amount },
      },
    });
  }

  /**
   * Unlock fiat: move from locked to available.
   * Fails if locked < amount.
   */
  async unlockFiat(
    tx: PrismaTransaction,
    accountId: number,
    assetType: FiatAssetType,
    amount: Decimal,
  ): Promise<Balance> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    const balance = await tx.balance.findFirst({
      where: {
        accountId,
        assetType,
        lotId: null,
      },
    });

    if (!balance) {
      throw new NotFoundException("Fiat balance not found");
    }

    if (balance.locked.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient locked fiat: have ${balance.locked.toString()}, need ${amount.toString()}`,
      );
    }

    return tx.balance.update({
      where: { id: balance.id },
      data: {
        available: { increment: amount },
        locked: { decrement: amount },
      },
    });
  }

  /**
   * Credit shares to an account (used by admin to mint shares)
   */
  async creditShares(
    tx: PrismaTransaction,
    accountId: number,
    lotId: number,
    amount: Decimal,
  ): Promise<Balance> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    const balance = await this.getOrCreateBalance(tx, accountId, "LOT_SHARES", lotId);

    return tx.balance.update({
      where: { id: balance.id },
      data: {
        available: { increment: amount },
      },
    });
  }

  /**
   * Credit fiat to an account (used by admin to deposit fiat)
   */
  async creditFiat(
    tx: PrismaTransaction,
    accountId: number,
    assetType: FiatAssetType,
    amount: Decimal,
  ): Promise<Balance> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Amount must be positive");
    }

    const balance = await this.getOrCreateBalance(tx, accountId, assetType, null);

    return tx.balance.update({
      where: { id: balance.id },
      data: {
        available: { increment: amount },
      },
    });
  }

  /**
   * Get all balances for an account
   */
  async getAllBalances(accountId: number): Promise<Balance[]> {
    return this.prisma.balance.findMany({
      where: { accountId },
      include: { lot: true },
    });
  }

  /**
   * Get account by ID
   */
  async getAccountById(accountId: number): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { id: accountId },
    });
  }

  /**
   * Get account by user ID and type
   */
  async getAccountByUserIdAndType(userId: number, type: AccountType): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });
  }
}
