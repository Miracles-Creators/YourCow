import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(["INVESTOR", "PRODUCER", "ADMIN"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
  walletAddress: z.string().nullable().optional(),
});

const ProducerUserSchema = UserSchema.extend({
  email: z.string(),
});

export const WalletLinkTypedDataSchema = z.object({
  types: z.record(z.array(z.object({ name: z.string(), type: z.string() }))),
  primaryType: z.string(),
  domain: z.object({
    name: z.string(),
    version: z.string(),
    chainId: z.string(),
  }),
  message: z.record(z.unknown()),
});

export const WalletChallengeSchema = z.object({
  userId: z.number(),
  address: z.string(),
  nonce: z.number(),
  issuedAt: z.string(),
  expiresAt: z.string(),
  chainId: z.string(),
  typedData: WalletLinkTypedDataSchema,
});

export type WalletChallengeDto = z.infer<typeof WalletChallengeSchema>;
export type WalletLinkTypedData = z.infer<typeof WalletLinkTypedDataSchema>;

export const PaymentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REFUNDED",
]);

export const AppContextSchema = z.enum(["WEB", "MOBILE", "ADMIN", "API"]);

export const OnChainSyncStatusSchema = z.enum([
  "PENDING",
  "SYNCING",
  "SYNCED",
  "FAILED",
]);

export const SettlementSchema = z.object({
  id: z.number(),
  lotId: z.number(),
  totalProceeds: z.number(),
  currency: z.string(),
  finalReportHash: z.string(),
  finalReportUrl: z.string().nullable(),
  settledBy: z.string().nullable(),
  finalTotalWeightGrams: z.number(),
  finalAverageWeightGrams: z.number(),
  initialTotalWeightGrams: z.number(),
  onChainStatus: OnChainSyncStatusSchema,
  onChainTxHash: z.string().nullable(),
  settledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SettlementDto = z.infer<typeof SettlementSchema>;

export const AuditBatchStatusSchema = z.enum([
  "PENDING",
  "ANCHORED",
  "FAILED",
]);

export const AuditBatchSchema = z.object({
  id: z.number(),
  fromLedgerId: z.string(),
  toLedgerId: z.string(),
  batchHash: z.string(),
  txHash: z.string().nullable(),
  blockNumber: z.number().nullable(),
  status: AuditBatchStatusSchema,
  createdAt: z.string(),
});

export type AuditBatchDto = z.infer<typeof AuditBatchSchema>;

export const AuditBatchVerificationSchema = z.object({
  batchId: z.number(),
  dbHash: z.string(),
  computedHash: z.string(),
  onchainHash: z.string(),
  matches: z.object({
    dbComputed: z.boolean(),
    dbOnchain: z.boolean(),
    computedOnchain: z.boolean(),
  }),
  rangesMatch: z.boolean(),
  onchainRange: z.object({
    fromLedgerId: z.string(),
    toLedgerId: z.string(),
    timestamp: z.string(),
  }),
});

export type AuditBatchVerificationDto = z.infer<typeof AuditBatchVerificationSchema>;

export const ShareTransferKindSchema = z.enum(["MINT", "TRANSFER", "BURN"]);

export const ProductionTypeSchema = z.enum(["FEEDLOT", "PASTURE", "MIXED"]);

export const LotStatusSchema = z.enum([
  "DRAFT",
  "PENDING_DEPLOY",
  "FUNDING",
  "FUNDED",
  "ACTIVE",
  "SETTLING",
  "COMPLETED",
]);

export const LotSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  status: LotStatusSchema,

  // Location & Operation
  farmName: z.string(),
  location: z.string(),
  productionType: ProductionTypeSchema,

  // Herd data
  cattleCount: z.number(),
  averageWeightKg: z.number(),
  initialWeightKg: z.number().nullable().optional(),
  durationWeeks: z.number(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),

  // Financing terms
  totalShares: z.number(),
  pricePerShare: z.number(),
  investorPercent: z.number(),
  fundingDeadline: z.string().nullable(),
  operatingCosts: z.number().nullable(),

  // On-chain data
  onChainLotId: z.number().nullable().optional(),
  tokenAddress: z.string().nullable().optional(),
  txHash: z.string().nullable().optional(),
  metadataHash: z.string().nullable().optional(),
  onChainStatus: z.string().optional(),

  // Optional
  notes: z.string().nullable().optional(),
  metadata: z.unknown().nullable().optional(),
  fundedPercent: z.number().optional(),
  producer: z
    .object({
      userId: z.number(),
      status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]),
      user: z.object({
        name: z.string().nullable(),
      }),
    })
    .optional(),

  // Timestamps
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ProducerSchema = z.object({
  userId: z.number(),
  senasaId: z.string(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]),
  location: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  yearsOperating: z.number().nullable().optional(),
  approvedById: z.number().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  lots: LotSchema.array().optional(),
  user: ProducerUserSchema,
});

export const AnimalApprovalStatusSchema = z.enum([
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
]);

export const AnimalSchema = z.object({
  id: z.number(),
  eid: z.string(),
  custodian: z.string(),
  status: z.enum(["ALIVE", "SOLD", "DECEASED", "REMOVED"]),
  approvalStatus: AnimalApprovalStatusSchema.optional().default("PENDING_APPROVAL"),
  initialWeightGrams: z.number(),
  currentWeightGrams: z.number().nullable().optional(),
  lotId: z.number().nullable().optional(),
  onChainId: z.number().nullable().optional(),
  onChainStatus: OnChainSyncStatusSchema.optional(),
  profile: z.unknown(),
  profileHash: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

export const ApproveLotInputSchema = z.object({
  tokenName: z.string(),
  tokenSymbol: z.string(),
  totalShares: z.number(),
  pricePerShare: z.number(),
  producerAddress: z.string().optional(),
});

export const ApproveAnimalsInputSchema = z.object({
  animalIds: z.array(z.number()).min(1),
  lotId: z.number(),
});

export const PaymentSchema = z.object({
  id: z.number(),
  paymentIntentId: z.string(),
  userId: z.number(),
  lotId: z.number(),
  amountFiat: z.number(),
  currency: z.string(),
  status: PaymentStatusSchema,
  sourceApp: AppContextSchema,
  txHash: z.string().nullable().optional(),
  onChainStatus: OnChainSyncStatusSchema,
  createdAt: z.string(),
  confirmedAt: z.string().nullable().optional(),
});

export const ShareTransferSchema = z.object({
  id: z.number(),
  lotId: z.number(),
  fromUserId: z.number().nullable(),
  toUserId: z.number(),
  amount: z.number(),
  kind: ShareTransferKindSchema,
  txHash: z.string(),
  onChainStatus: OnChainSyncStatusSchema,
  createdAt: z.string(),
});

export type UserDto = z.infer<typeof UserSchema>;
export type LotDto = z.infer<typeof LotSchema>;
export type ProductionType = z.infer<typeof ProductionTypeSchema>;
export type LotStatus = z.infer<typeof LotStatusSchema>;
export type ProducerDto = z.infer<typeof ProducerSchema>;
export type AnimalDto = z.infer<typeof AnimalSchema>;
export type AnimalApprovalStatus = z.infer<typeof AnimalApprovalStatusSchema>;
export type ApproveLotInput = z.infer<typeof ApproveLotInputSchema>;
export type ApproveAnimalsInput = z.infer<typeof ApproveAnimalsInputSchema>;
export type PaymentDto = z.infer<typeof PaymentSchema>;
export type ShareTransferDto = z.infer<typeof ShareTransferSchema>;

// ============================================
// P2P MARKETPLACE SCHEMAS
// ============================================

export const OfferStatusSchema = z.enum([
  "OPEN",
  "PARTIALLY_FILLED",
  "FILLED",
  "CANCELLED",
]);

export const AssetTypeSchema = z.enum(["LOT_SHARES", "FIAT_ARS", "FIAT_USD"]);

export const AccountTypeSchema = z.enum([
  "TRADING",
  "FEES_COLLECTED",
  "PROTOCOL_VAULT",
]);

// Offer schema (sell offers in the marketplace)
export const OfferSchema = z.object({
  id: z.number(),
  sellerId: z.number(),
  lotId: z.number(),
  sharesAmount: z.number(),
  pricePerShare: z.number(),
  strkPricePerShare: z.string().nullable().optional(),
  currency: z.string(),
  sharesFilled: z.number(),
  status: OfferStatusSchema,
  idempotencyKey: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Optional relations
  seller: UserSchema.optional(),
  lot: LotSchema.optional(),
});

export const TradeStatusSchema = z.enum([
  "PENDING",
  "TONGO_SETTLED",
  "COMPLETED",
  "FAILED",
]);

// Trade schema (completed transactions)
export const TradeSchema = z.object({
  id: z.number(),
  offerId: z.number(),
  buyerId: z.number(),
  sharesAmount: z.number(),
  totalPrice: z.number(),
  strkTotalPrice: z.string().nullable().optional(),
  feeAmount: z.number(),
  currency: z.string(),
  status: TradeStatusSchema.optional(),
  tongoTxHash: z.string().nullable().optional(),
  idempotencyKey: z.string(),
  settledAt: z.string(),
  // Optional relations
  buyer: UserSchema.optional(),
  offer: OfferSchema.optional(),
});

// Trade status polling response
export const TradeStatusResponseSchema = z.object({
  id: z.number(),
  status: TradeStatusSchema,
  tongoTxHash: z.string().nullable().optional(),
  strkTotalPrice: z.string().nullable().optional(),
});

// Tongo balance response
export const TongoBalanceSchema = z.object({
  current: z.string(),
  pending: z.string(),
});

// Balance schema (user balances in the custody system)
export const MarketplaceBalanceSchema = z.object({
  id: z.number(),
  accountId: z.number(),
  assetType: AssetTypeSchema,
  lotId: z.number().nullable(),
  available: z.string(), // Decimal as string
  locked: z.string(), // Decimal as string
  updatedAt: z.string(),
  // Optional relations
  lot: LotSchema.optional(),
});

// Portfolio fiat balance summary
export const PortfolioFiatBalanceSchema = z.object({
  currency: z.string(),
  available: z.string(),
  locked: z.string(),
  total: z.string(),
});

// Portfolio item for lot shares (summary)
export const PortfolioLotPositionSchema = z.object({
  lotId: z.number(),
  lotName: z.string().nullable(),
  available: z.string(),
  locked: z.string(),
  total: z.string(),
  valuation: z.string().nullable(),
  lastPricePerShare: z.number().nullable(),
});

export const PortfolioActiveOfferSchema = z.object({
  id: z.number(),
  sharesAmount: z.number(),
  sharesFilled: z.number(),
  remainingShares: z.number(),
  pricePerShare: z.number(),
  currency: z.string(),
  status: OfferStatusSchema,
  createdAt: z.string(),
});

// Portfolio detail for a specific lot
export const PortfolioLotItemSchema = z.object({
  accountId: z.number(),
  lotId: z.number(),
  lotName: z.string().nullable(),
  available: z.string(),
  locked: z.string(),
  total: z.string(),
  activeOffers: z.array(PortfolioActiveOfferSchema),
});

// Full portfolio response
export const PortfolioSchema = z.object({
  accountId: z.number(),
  fiat: z.array(PortfolioFiatBalanceSchema),
  lots: z.array(PortfolioLotPositionSchema),
});

// Input schemas for mutations
export const CreateOfferInputSchema = z.object({
  lotId: z.number(),
  sharesAmount: z.number().positive(),
  pricePerShare: z.number().nonnegative(),
  strkPricePerShare: z.string().optional(),
  currency: z.string().default("STRK"),
  idempotencyKey: z.string(),
});

export const AcceptOfferInputSchema = z.object({
  sharesAmount: z.number().positive(),
  idempotencyKey: z.string(),
});

export const BuyPrimaryInputSchema = z.object({
  lotId: z.number(),
  sharesAmount: z.number().positive(),
  idempotencyKey: z.string(),
});

export const BuyPrimaryResultSchema = z.object({
  txHash: z.string(),
  balance: MarketplaceBalanceSchema,
  sharesAmount: z.number(),
  totalCost: z.number(),
});

// Query filters
export const OfferFiltersSchema = z.object({
  lotId: z.number().optional(),
  sellerId: z.number().optional(),
  status: OfferStatusSchema.optional(),
});

// Type exports
export type OfferStatus = z.infer<typeof OfferStatusSchema>;
export type AssetType = z.infer<typeof AssetTypeSchema>;
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type OfferDto = z.infer<typeof OfferSchema>;
export type TradeDto = z.infer<typeof TradeSchema>;
export type MarketplaceBalanceDto = z.infer<typeof MarketplaceBalanceSchema>;
export type PortfolioFiatBalanceDto = z.infer<typeof PortfolioFiatBalanceSchema>;
export type PortfolioLotPositionDto = z.infer<typeof PortfolioLotPositionSchema>;
export type PortfolioActiveOfferDto = z.infer<typeof PortfolioActiveOfferSchema>;
export type PortfolioLotItemDto = z.infer<typeof PortfolioLotItemSchema>;
export type PortfolioDto = z.infer<typeof PortfolioSchema>;
export type CreateOfferInput = z.infer<typeof CreateOfferInputSchema>;
export type AcceptOfferInput = z.infer<typeof AcceptOfferInputSchema>;
export type BuyPrimaryInput = z.infer<typeof BuyPrimaryInputSchema>;
export type BuyPrimaryResult = z.infer<typeof BuyPrimaryResultSchema>;
export type OfferFilters = z.infer<typeof OfferFiltersSchema>;
export type TradeStatus = z.infer<typeof TradeStatusSchema>;
export type TradeStatusResponse = z.infer<typeof TradeStatusResponseSchema>;
export type TongoBalanceDto = z.infer<typeof TongoBalanceSchema>;
