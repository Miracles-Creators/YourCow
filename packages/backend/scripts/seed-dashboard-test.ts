/**
 * Full seed script — creates all data needed to test every investor screen.
 *
 * Creates:
 *   - A producer with an active profile
 *   - An investor (the main test user) with 3 lot positions
 *   - A second investor (counterparty for P2P trades)
 *   - 3 ACTIVE lots with varying production types and weights
 *   - Primary purchases + share balances for the main investor
 *   - Open sell offers from both users
 *   - Completed trades between users
 *   - Trading accounts for both users
 *
 * Usage:
 *   cd packages/backend && yarn tsx scripts/seed-dashboard-test.ts
 *
 * Env vars (optional):
 *   INVESTOR_EMAIL — main test user (default: seller@test.com)
 *   COUNTERPARTY_EMAIL — second user (default: buyer@test.com)
 */

import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Decimal } from "@prisma/client-runtime-utils";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const INVESTOR_EMAIL = process.env.INVESTOR_EMAIL ?? process.env.SELLER_EMAIL ?? "seller@test.com";
const COUNTERPARTY_EMAIL = process.env.COUNTERPARTY_EMAIL ?? process.env.BUYER_EMAIL ?? "buyer@test.com";

const LOTS = [
  {
    name: "Angus Premium Feedlot",
    description: "High-quality Angus cattle in Buenos Aires feedlot",
    farmName: "Estancia Los Alamos",
    location: "Pergamino, Buenos Aires",
    productionType: "FEEDLOT" as const,
    cattleCount: 80,
    averageWeightKg: 420,
    initialWeightKg: 320,
    durationWeeks: 20,
    totalShares: 1000,
    pricePerShare: 150,
    investorPercent: 15.0,
    operatingCosts: 45000,
    startDate: new Date("2026-01-15"),
    initialTotalWeightGrams: 320 * 80 * 1000,
    currentTotalWeightGrams: 395 * 80 * 1000,
    investorShares: 25,
    counterpartyShares: 10,
  },
  {
    name: "Brahman Pasture Herd",
    description: "Brahman crossbreed on natural pasture in Entre Ríos",
    farmName: "Campo El Ombú",
    location: "Gualeguaychú, Entre Ríos",
    productionType: "PASTURE" as const,
    cattleCount: 120,
    averageWeightKg: 380,
    initialWeightKg: 290,
    durationWeeks: 24,
    totalShares: 2000,
    pricePerShare: 80,
    investorPercent: 12.0,
    operatingCosts: 60000,
    startDate: new Date("2025-12-01"),
    initialTotalWeightGrams: 290 * 120 * 1000,
    currentTotalWeightGrams: 355 * 120 * 1000,
    investorShares: 50,
    counterpartyShares: 20,
  },
  {
    name: "Hereford Mixed Operation",
    description: "Hereford cattle with mixed feedlot/pasture rotation",
    farmName: "Estancia Santa Rosa",
    location: "Venado Tuerto, Santa Fe",
    productionType: "MIXED" as const,
    cattleCount: 60,
    averageWeightKg: 400,
    initialWeightKg: 310,
    durationWeeks: 18,
    totalShares: 800,
    pricePerShare: 120,
    investorPercent: 14.0,
    operatingCosts: 35000,
    startDate: new Date("2026-02-01"),
    initialTotalWeightGrams: 310 * 60 * 1000,
    currentTotalWeightGrams: 370 * 60 * 1000,
    investorShares: 15,
    counterpartyShares: 8,
  },
];

async function upsertUser(email: string, name: string, role: "INVESTOR" | "PRODUCER") {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, status: "ACTIVE" },
  });
}

async function ensureAccount(userId: number) {
  return prisma.account.upsert({
    where: { userId_type: { userId, type: "TRADING" } },
    update: {},
    create: { userId, type: "TRADING" },
  });
}

async function ensureBalance(accountId: number, lotId: number, shares: number) {
  const existing = await prisma.balance.findFirst({
    where: { accountId, assetType: "LOT_SHARES", lotId },
  });
  if (existing) {
    if (existing.available.lessThan(shares)) {
      await prisma.balance.update({
        where: { id: existing.id },
        data: { available: new Decimal(shares) },
      });
    }
    return existing;
  }
  return prisma.balance.create({
    data: {
      accountId,
      assetType: "LOT_SHARES",
      lotId,
      available: new Decimal(shares),
      locked: new Decimal(0),
    },
  });
}

async function ensurePurchase(userId: number, lotId: number, shares: number, pricePerShare: number) {
  const existing = await prisma.primaryPurchase.findFirst({
    where: { userId, lotId },
  });
  if (existing) return existing;
  return prisma.primaryPurchase.create({
    data: {
      userId,
      lotId,
      sharesAmount: shares,
      totalCost: shares * pricePerShare,
      currency: "USD",
      idempotencyKey: randomUUID(),
      status: "COMPLETED",
    },
  });
}

async function main() {
  console.log("=== Full Investor Seed ===\n");

  // ── Users ──
  const producer = await upsertUser("producer@test.com", "Estancia Demo Producer", "PRODUCER");
  const investor = await upsertUser(INVESTOR_EMAIL, "Test Investor", "INVESTOR");
  const counterparty = await upsertUser(COUNTERPARTY_EMAIL, "Test Counterparty", "INVESTOR");

  console.log(`Producer:     id=${producer.id}`);
  console.log(`Investor:     id=${investor.id} (${INVESTOR_EMAIL})`);
  console.log(`Counterparty: id=${counterparty.id} (${COUNTERPARTY_EMAIL})`);

  // ── Producer profile ──
  const existingProfile = await prisma.producerProfile.findUnique({ where: { userId: producer.id } });
  if (!existingProfile) {
    await prisma.producerProfile.create({
      data: {
        userId: producer.id,
        senasaId: `SENASA-FULL-${producer.id}`,
        status: "ACTIVE",
        location: "Buenos Aires, Argentina",
      },
    });
  }

  // ── Accounts ──
  const investorAccount = await ensureAccount(investor.id);
  const counterpartyAccount = await ensureAccount(counterparty.id);

  // ── Fees account (protocol) ──
  await prisma.account.upsert({
    where: { userId_type: { userId: null as unknown as number, type: "FEES_COLLECTED" } },
    update: {},
    create: { type: "FEES_COLLECTED" },
  }).catch(() => {
    // Ignore if fees account already exists (userId null constraint)
  });

  // ── Lots + Balances + Purchases ──
  const createdLots: { id: number; name: string; pricePerShare: number }[] = [];

  for (const data of LOTS) {
    let lot = await prisma.lot.findFirst({
      where: { name: data.name, producerId: producer.id },
    });

    if (!lot) {
      lot = await prisma.lot.create({
        data: {
          name: data.name,
          description: data.description,
          status: "ACTIVE",
          farmName: data.farmName,
          location: data.location,
          productionType: data.productionType,
          cattleCount: data.cattleCount,
          averageWeightKg: data.averageWeightKg,
          initialWeightKg: data.initialWeightKg,
          durationWeeks: data.durationWeeks,
          totalShares: data.totalShares,
          pricePerShare: data.pricePerShare,
          investorPercent: data.investorPercent,
          operatingCosts: data.operatingCosts,
          producerId: producer.id,
          startDate: data.startDate,
          initialTotalWeightGrams: data.initialTotalWeightGrams,
          currentTotalWeightGrams: data.currentTotalWeightGrams,
        },
      });
      console.log(`\nLot created: id=${lot.id} "${lot.name}"`);
    } else {
      console.log(`\nLot exists:  id=${lot.id} "${lot.name}"`);
    }

    createdLots.push({ id: lot.id, name: lot.name, pricePerShare: lot.pricePerShare });

    // Investor shares + purchase
    await ensureBalance(investorAccount.id, lot.id, data.investorShares);
    await ensurePurchase(investor.id, lot.id, data.investorShares, data.pricePerShare);
    console.log(`  Investor:     ${data.investorShares} shares ($${data.investorShares * data.pricePerShare})`);

    // Counterparty shares + purchase
    await ensureBalance(counterpartyAccount.id, lot.id, data.counterpartyShares);
    await ensurePurchase(counterparty.id, lot.id, data.counterpartyShares, data.pricePerShare);
    console.log(`  Counterparty: ${data.counterpartyShares} shares ($${data.counterpartyShares * data.pricePerShare})`);
  }

  // ── Offers (one open sell offer per lot from counterparty) ──
  for (const lot of createdLots) {
    const existingOffer = await prisma.offer.findFirst({
      where: { sellerId: counterparty.id, lotId: lot.id, status: "OPEN" },
    });
    if (!existingOffer) {
      const offer = await prisma.offer.create({
        data: {
          sellerId: counterparty.id,
          lotId: lot.id,
          sharesAmount: 5,
          pricePerShare: lot.pricePerShare,
          strkPricePerShare: String(BigInt(lot.pricePerShare) * BigInt(10 ** 18)),
          currency: "STRK",
          status: "OPEN",
          idempotencyKey: randomUUID(),
        },
      });
      console.log(`\nOffer created: id=${offer.id} (${lot.name}, 5 shares @ $${lot.pricePerShare})`);
    }
  }

  // ── One completed trade (investor bought 3 shares of lot 1 from counterparty) ──
  const firstLot = createdLots[0];
  const existingTrade = await prisma.trade.findFirst({
    where: { buyerId: investor.id },
  });
  if (!existingTrade && firstLot) {
    // Find or create an offer from counterparty on lot 1 to attach the trade to
    let tradeOffer = await prisma.offer.findFirst({
      where: { sellerId: counterparty.id, lotId: firstLot.id },
    });
    if (!tradeOffer) {
      tradeOffer = await prisma.offer.create({
        data: {
          sellerId: counterparty.id,
          lotId: firstLot.id,
          sharesAmount: 3,
          pricePerShare: firstLot.pricePerShare,
          strkPricePerShare: String(BigInt(firstLot.pricePerShare) * BigInt(10 ** 18)),
          currency: "STRK",
          sharesFilled: 3,
          status: "FILLED",
          idempotencyKey: randomUUID(),
        },
      });
    }

    const trade = await prisma.trade.create({
      data: {
        offerId: tradeOffer.id,
        buyerId: investor.id,
        sharesAmount: 3,
        totalPrice: 3 * firstLot.pricePerShare,
        strkTotalPrice: String(BigInt(3 * firstLot.pricePerShare) * BigInt(10 ** 18)),
        feeAmount: 0,
        currency: "STRK",
        status: "COMPLETED",
        idempotencyKey: randomUUID(),
      },
    });
    console.log(`\nTrade created: id=${trade.id} (investor bought 3 shares of "${firstLot.name}")`);
  }

  // ── Summary ──
  console.log("\n=== Seed Complete ===");
  console.log(`\nInvestor (id=${investor.id}, ${INVESTOR_EMAIL}):`);
  console.log("  Dashboard  → /dashboard  (portfolio summary with 3 lots)");
  console.log("  Invest     → /marketplace (3 active lots to browse)");
  console.log("  Trade      → /p2p        (open offers + trade history)");
  console.log("  Portfolio  → /portfolio  (positions + lot details)");
  console.log(`\nCounterparty (id=${counterparty.id}, ${COUNTERPARTY_EMAIL}):`);
  console.log("  Has open sell offers on all 3 lots");
  console.log("\nLog in as either user to test all screens.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
