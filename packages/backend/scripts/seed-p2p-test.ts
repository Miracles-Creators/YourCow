/**
 * Seed data for P2P Private Trade e2e testing
 *
 * Simulates the state AFTER a producer created a lot, admin approved it,
 * and an investor (seller) already purchased shares. Now the seller wants
 * to sell those shares on the P2P marketplace using private STRK payments.
 *
 * Creates:
 *   - A producer (separate from buyer/seller — they're the farm owner)
 *   - Two investors: seller (has shares) and buyer (will fund Tongo)
 *   - An ACTIVE lot owned by the producer
 *   - Seller's custody balance with shares (as if they did a primary purchase)
 *
 * Usage:
 *   cd packages/backend && yarn tsx scripts/seed-p2p-test.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Decimal } from "@prisma/client-runtime-utils";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PRODUCER_EMAIL = "producer@test.com";
const SELLER_EMAIL = process.env.SELLER_EMAIL ?? "seller@test.com";
const BUYER_EMAIL = process.env.BUYER_EMAIL ?? "buyer@test.com";
const SHARES_TO_SEED = 100;

async function main() {
  console.log("Seeding P2P test data...\n");

  // 1. Producer — the farm owner who created the lot (separate from buyer/seller)
  const producer = await prisma.user.upsert({
    where: { email: PRODUCER_EMAIL },
    update: {},
    create: {
      email: PRODUCER_EMAIL,
      name: "Estancia Demo Producer",
      role: "PRODUCER",
      status: "ACTIVE",
    },
  });
  console.log(`Producer: id=${producer.id} (${PRODUCER_EMAIL})`);

  const existingProducer = await prisma.producerProfile.findUnique({
    where: { userId: producer.id },
  });
  if (!existingProducer) {
    await prisma.producerProfile.create({
      data: {
        userId: producer.id,
        senasaId: `SENASA-P2P-${producer.id}`,
        status: "ACTIVE",
        location: "Buenos Aires, Argentina",
      },
    });
    console.log("  Created producer profile");
  }

  // 2. Seller — a regular investor who already bought shares
  const seller = await prisma.user.upsert({
    where: { email: SELLER_EMAIL },
    update: {},
    create: {
      email: SELLER_EMAIL,
      name: "Test Seller",
      role: "INVESTOR",
      status: "ACTIVE",
    },
  });
  console.log(`Seller:   id=${seller.id} (${SELLER_EMAIL})`);

  // 3. Buyer — a regular investor who will fund Tongo and buy shares
  const buyer = await prisma.user.upsert({
    where: { email: BUYER_EMAIL },
    update: {},
    create: {
      email: BUYER_EMAIL,
      name: "Test Buyer",
      role: "INVESTOR",
      status: "ACTIVE",
    },
  });
  console.log(`Buyer:    id=${buyer.id} (${BUYER_EMAIL})`);

  // 4. Lot — owned by the producer, already ACTIVE (admin approved it)
  let lot = await prisma.lot.findFirst({
    where: { producerId: producer.id, status: "ACTIVE" },
  });

  if (!lot) {
    lot = await prisma.lot.create({
      data: {
        name: "Lote Demo P2P",
        description: "Feedlot lot for P2P marketplace demo",
        status: "ACTIVE",
        farmName: "Estancia Demo",
        location: "Buenos Aires, Argentina",
        productionType: "FEEDLOT",
        cattleCount: 50,
        averageWeightKg: 350,
        durationWeeks: 16,
        totalShares: 1000,
        pricePerShare: 100,
        investorPercent: 15.0,
        producerId: producer.id,
      },
    });
    console.log(`Lot:      id=${lot.id} "${lot.name}" (created)`);
  } else {
    console.log(`Lot:      id=${lot.id} "${lot.name}" (existing)`);
  }

  // 5. Seller's TRADING account + share balance (simulating a prior primary purchase)
  const sellerAccount = await prisma.account.upsert({
    where: { userId_type: { userId: seller.id, type: "TRADING" } },
    update: {},
    create: { userId: seller.id, type: "TRADING" },
  });

  const existingBalance = await prisma.balance.findFirst({
    where: {
      accountId: sellerAccount.id,
      assetType: "LOT_SHARES",
      lotId: lot.id,
    },
  });

  if (existingBalance && existingBalance.available.greaterThan(0)) {
    console.log(`Shares:   ${existingBalance.available} already in seller's account`);
  } else if (existingBalance) {
    await prisma.balance.update({
      where: { id: existingBalance.id },
      data: { available: new Decimal(SHARES_TO_SEED) },
    });
    console.log(`Shares:   updated to ${SHARES_TO_SEED}`);
  } else {
    await prisma.balance.create({
      data: {
        accountId: sellerAccount.id,
        assetType: "LOT_SHARES",
        lotId: lot.id,
        available: new Decimal(SHARES_TO_SEED),
        locked: new Decimal(0),
      },
    });
    console.log(`Shares:   ${SHARES_TO_SEED} credited to seller`);
  }

  // 6. Buyer's TRADING account (empty — they'll buy via P2P)
  await prisma.account.upsert({
    where: { userId_type: { userId: buyer.id, type: "TRADING" } },
    update: {},
    create: { userId: buyer.id, type: "TRADING" },
  });

  console.log("\n=== Ready ===");
  console.log(`Producer: id=${producer.id} — farm owner (not involved in P2P trade)`);
  console.log(`Seller:   id=${seller.id} — investor with ${SHARES_TO_SEED} shares`);
  console.log(`Buyer:    id=${buyer.id} — investor (needs to fund Tongo)`);
  console.log(`Lot:      id=${lot.id} — "${lot.name}"`);
  console.log("\nTongo accounts are created automatically when users visit /en/p2p.");
  console.log("See docs/p2p-private/P2P_TEST_GUIDE.md for the full test flow.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
