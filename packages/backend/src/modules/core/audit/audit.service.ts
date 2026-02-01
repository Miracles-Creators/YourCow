import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditBatch, LedgerEntry, Trade } from "@prisma/client";
import { Decimal } from "@prisma/client-runtime-utils";
import { PrismaService } from "../../../database/prisma.service";
import { canonicalJson, hashCanonicalJson, normalizeHash } from "../../../utils/hash";
import { AuditRegistryService } from "../../onchain/audit-registry/audit-registry.service";
import { LedgerService } from "../ledger/ledger.service";
import type {
  AuditBatchResponse,
  AuditVerificationResult,
  CanonicalLedgerEntry,
  CanonicalTrade,
} from "./audit.types";
import { AuditBatchStatus } from "@prisma/client";

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly auditRegistryService: AuditRegistryService,
  ) {}

  async buildCanonicalBatch(fromLedgerId: number, toLedgerId: number): Promise<string> {
    if (fromLedgerId > toLedgerId) {
      throw new BadRequestException("fromLedgerId must be <= toLedgerId");
    }

    const entries = await this.ledgerService.getEntriesByRange(
      fromLedgerId,
      toLedgerId,
    );

    if (entries.length === 0) {
      throw new BadRequestException("No ledger entries found in range");
    }

    const tradeIds = Array.from(
      new Set(entries.map((entry) => entry.tradeId).filter((id): id is number => id != null)),
    );

    const trades = tradeIds.length
      ? await this.prisma.trade.findMany({
          where: { id: { in: tradeIds } },
          orderBy: { id: "asc" },
        })
      : [];

    const payload = {
      fromLedgerId: fromLedgerId.toString(),
      toLedgerId: toLedgerId.toString(),
      ledgerEntries: entries.map((entry) => this.mapLedgerEntry(entry)),
      trades: trades.map((trade) => this.mapTrade(trade)),
    };

    return canonicalJson(payload);
  }

  computeHash(canonical: string): string {
    return hashCanonicalJson(canonical);
  }

  async createAndAnchorBatch(): Promise<AuditBatchResponse> {
    const lastEntry = await this.prisma.ledgerEntry.findFirst({
      orderBy: { id: "desc" },
    });

    if (!lastEntry) {
      throw new BadRequestException("No ledger entries to batch");
    }

    const firstEntry = await this.prisma.ledgerEntry.findFirst({
      orderBy: { id: "asc" },
    });

    if (!firstEntry) {
      throw new BadRequestException("No ledger entries to batch");
    }

    const lastBatch = await this.prisma.auditBatch.findFirst({
      where: { status: AuditBatchStatus.ANCHORED },
      orderBy: { toLedgerId: "desc" },
    });

    const fromLedgerId = lastBatch
      ? lastBatch.toLedgerId + 1
      : firstEntry.id;

    if (fromLedgerId > lastEntry.id) {
      throw new BadRequestException("No new ledger entries to batch");
    }

    const canonicalJson = await this.buildCanonicalBatch(
      fromLedgerId,
      lastEntry.id,
    );
    const batchHash = this.computeHash(canonicalJson);

    const batch = await this.prisma.auditBatch.create({
      data: {
        fromLedgerId,
        toLedgerId: lastEntry.id,
        batchHash,
        status: AuditBatchStatus.PENDING,
      },
    });

    try {
      const transactionHash = await this.auditRegistryService.anchorBatch(
        batch.id,
        batchHash,
        BigInt(fromLedgerId),
        BigInt(lastEntry.id),
      );

      const updated = await this.prisma.auditBatch.update({
        where: { id: batch.id },
        data: {
          txHash: transactionHash,
          status: AuditBatchStatus.ANCHORED,
        },
      });

      return this.serializeBatch(updated);
    } catch (error) {
      await this.prisma.auditBatch.update({
        where: { id: batch.id },
        data: { status: AuditBatchStatus.FAILED },
      });
      throw error;
    }
  }

  async verifyBatch(batchId: number): Promise<AuditVerificationResult> {
    if (!Number.isInteger(batchId) || batchId <= 0) {
      throw new BadRequestException("batchId must be a positive integer");
    }

    const batch = await this.prisma.auditBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException("Audit batch not found");
    }

    const canonicalJson = await this.buildCanonicalBatch(
      batch.fromLedgerId,
      batch.toLedgerId,
    );
    const computedHash = this.computeHash(canonicalJson);

    const onchain = await this.auditRegistryService.getBatch(batch.id);

    const dbHash = normalizeHash(batch.batchHash);
    const computed = normalizeHash(computedHash);
    const onchainHash = normalizeHash(onchain.batchHash);

    return {
      batchId: batch.id,
      dbHash,
      computedHash: computed,
      onchainHash,
      matches: {
        dbComputed: dbHash === computed,
        dbOnchain: dbHash === onchainHash,
        computedOnchain: computed === onchainHash,
      },
      rangesMatch:
        batch.fromLedgerId === Number(onchain.fromLedgerId) &&
        batch.toLedgerId === Number(onchain.toLedgerId),
      onchainRange: {
        fromLedgerId: onchain.fromLedgerId.toString(),
        toLedgerId: onchain.toLedgerId.toString(),
        timestamp: onchain.timestamp.toString(),
      },
    };
  }

  async verifyLatestBatch(): Promise<AuditVerificationResult> {
    const latestBatch = await this.prisma.auditBatch.findFirst({
      where: { status: AuditBatchStatus.ANCHORED },
      orderBy: { toLedgerId: "desc" },
    });

    if (!latestBatch) {
      throw new NotFoundException("No anchored audit batches found");
    }

    return this.verifyBatch(latestBatch.id);
  }

  private mapLedgerEntry(entry: LedgerEntry): CanonicalLedgerEntry {
    return {
      id: entry.id.toString(),
      eventType: entry.eventType,
      debitAccountId: entry.debitAccountId.toString(),
      creditAccountId: entry.creditAccountId.toString(),
      assetType: entry.assetType,
      lotId: entry.lotId == null ? null : entry.lotId.toString(),
      amount: this.normalizeDecimal(entry.amount),
      tradeId: entry.tradeId == null ? null : entry.tradeId.toString(),
      offerId: entry.offerId == null ? null : entry.offerId.toString(),
      txHash: entry.txHash ?? null,
      description: entry.description ?? null,
      metadata: entry.metadata ?? null,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  private mapTrade(trade: Trade): CanonicalTrade {
    return {
      id: trade.id.toString(),
      offerId: trade.offerId.toString(),
      buyerId: trade.buyerId.toString(),
      sharesAmount: trade.sharesAmount.toString(),
      totalPrice: trade.totalPrice.toString(),
      feeAmount: trade.feeAmount.toString(),
      currency: trade.currency,
      idempotencyKey: trade.idempotencyKey,
      settledAt: trade.settledAt.toISOString(),
    };
  }

  private normalizeDecimal(value: Decimal): string {
    return value.toString();
  }

  private serializeBatch(batch: AuditBatch): AuditBatchResponse {
    return {
      id: batch.id,
      fromLedgerId: batch.fromLedgerId.toString(),
      toLedgerId: batch.toLedgerId.toString(),
      batchHash: normalizeHash(batch.batchHash),
      txHash: batch.txHash ?? null,
      blockNumber: batch.blockNumber ?? null,
      status: batch.status,
      createdAt: batch.createdAt,
    };
  }
}
