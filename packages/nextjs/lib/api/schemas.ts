import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(["INVESTOR", "PRODUCER", "ADMIN"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
  walletAddress: z.string().nullable().optional(),
});

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
  durationWeeks: z.number(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),

  // Financing terms
  totalShares: z.string(),
  pricePerShare: z.string(),
  investorPercent: z.number(),
  fundingDeadline: z.string().nullable(),
  operatingCosts: z.string().nullable(),

  // On-chain data
  onChainLotId: z.string().nullable().optional(),
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

export const AnimalSchema = z.object({
  id: z.number(),
  eid: z.string(),
  custodian: z.string(),
  status: z.enum(["ALIVE", "SOLD", "DECEASED", "REMOVED"]),
  lotId: z.number().nullable().optional(),
  onChainId: z.string().nullable().optional(),
  profile: z.unknown(),
  profileHash: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

export const ApproveLotInputSchema = z.object({
  tokenName: z.string(),
  tokenSymbol: z.string(),
  initialPricePerShare: z.string(),
  producerAddress: z.string().optional(),
});

export type UserDto = z.infer<typeof UserSchema>;
export type LotDto = z.infer<typeof LotSchema>;
export type ProductionType = z.infer<typeof ProductionTypeSchema>;
export type LotStatus = z.infer<typeof LotStatusSchema>;
export type ProducerDto = z.infer<typeof ProducerSchema>;
export type AnimalDto = z.infer<typeof AnimalSchema>;
export type ApproveLotInput = z.infer<typeof ApproveLotInputSchema>;
