import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(["INVESTOR", "PRODUCER", "ADMIN"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
  walletAddress: z.string().nullable().optional(),
});

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
  user: UserSchema,
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
  sharesAmount: z.number(),
  status: PaymentStatusSchema,
  sourceApp: AppContextSchema,
  txHash: z.string().nullable().optional(),
  onChainStatus: OnChainSyncStatusSchema,
  createdAt: z.string(),
  confirmedAt: z.string().nullable().optional(),
});

export const ShareBalanceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  lotId: z.number(),
  amount: z.number(),
  lastSyncedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
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
export type ShareBalanceDto = z.infer<typeof ShareBalanceSchema>;
export type ShareTransferDto = z.infer<typeof ShareTransferSchema>;
