import { AuditBatchStatus } from "@prisma/client";

export type CanonicalLedgerEntry = {
  id: string;
  eventType: string;
  debitAccountId: string;
  creditAccountId: string;
  assetType: string;
  lotId: string | null;
  amount: string;
  tradeId: string | null;
  offerId: string | null;
  txHash: string | null;
  description: string | null;
  metadata: unknown;
  createdAt: string;
};

export type CanonicalTrade = {
  id: string;
  offerId: string;
  buyerId: string;
  sharesAmount: string;
  totalPrice: string;
  feeAmount: string;
  currency: string;
  idempotencyKey: string;
  settledAt: string;
};

export type AuditBatchResponse = {
  id: number;
  fromLedgerId: string;
  toLedgerId: string;
  batchHash: string;
  txHash: string | null;
  blockNumber: number | null;
  status: AuditBatchStatus;
  createdAt: Date;
};

export type AuditVerificationResult = {
  batchId: number;
  dbHash: string;
  computedHash: string;
  onchainHash: string;
  matches: {
    dbComputed: boolean;
    dbOnchain: boolean;
    computedOnchain: boolean;
  };
  rangesMatch: boolean;
  onchainRange: {
    fromLedgerId: string;
    toLedgerId: string;
    timestamp: string;
  };
};
