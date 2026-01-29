import { Injectable } from "@nestjs/common";
import { LedgerEntry, Prisma } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";

type LedgerWriteClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async writeEntry(
    tx: LedgerWriteClient,
    data: Prisma.LedgerEntryUncheckedCreateInput
  ): Promise<LedgerEntry> {
    return tx.ledgerEntry.create({ data });
  }

  async writeEntries(
    tx: LedgerWriteClient,
    entries: Prisma.LedgerEntryUncheckedCreateInput[]
  ): Promise<LedgerEntry[]> {
    if (entries.length === 0) {
      return [];
    }

    return Promise.all(
      entries.map((entry) => tx.ledgerEntry.create({ data: entry }))
    );
  }

  async getEntriesByRange(fromId: number, toId: number): Promise<LedgerEntry[]> {
    return this.prisma.ledgerEntry.findMany({
      where: {
        id: {
          gte: fromId,
          lte: toId,
        },
      },
      orderBy: { id: "asc" },
    });
  }
}
