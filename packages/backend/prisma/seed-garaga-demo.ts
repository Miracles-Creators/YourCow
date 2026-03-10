/**
 * seed-garaga-demo.ts
 *
 * Seeds a demo lot with a pre-generated ZK fundraising proof for the hackathon demo.
 *
 * Usage:
 *   npx ts-node -e "$(cat prisma/seed-garaga-demo.ts)"
 *   OR
 *   npx ts-node prisma/seed-garaga-demo.ts
 *
 * BEFORE RUNNING:
 *  1. Complete Phase 1 (nargo build + bb prove + garaga gen) on the local circuit
 *  2. Complete Phase 2 (deploy verifier, get txHash from garaga verify-onchain)
 *  3. Replace the placeholder values below with real values from those steps
 */

import { PrismaClient, LotStatus, ProductionType, OnChainSyncStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ─── REPLACE THESE with real values from your local proof run ───────────────
const DEMO_TX_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000"; // real Sepolia txHash
const DEMO_LOT_COMMITMENT =
  "0x0000000000000000000000000000000000000000000000000000000000000000"; // real poseidon commitment
const DEMO_PROVED_AT = new Date().toISOString();
// ────────────────────────────────────────────────────────────────────────────

const TOTAL_SHARES = 100;
const FUNDED_SHARES = 100; // exactly 100% — 100 of 100 sold

async function main() {
  console.log("Seeding Garaga demo lot...");

  // Find or create a demo producer
  let producer = await prisma.producer.findFirst();
  if (!producer) {
    throw new Error("No producer found — run the main seed first");
  }

  // Create the demo lot
  const lot = await prisma.lot.create({
    data: {
      producerId: producer.id,
      name: "Lote Demo — ZK Verified",
      description:
        "Demo lot with ZK fundraising proof. The exact share counts are hidden — only the threshold is proven on Starknet.",
      farmName: "Estancia Demo",
      location: "Buenos Aires, Argentina",
      productionType: ProductionType.FEEDLOT,
      cattleCount: 50,
      averageWeightKg: 380,
      initialWeightKg: 300,
      durationWeeks: 16,
      totalShares: TOTAL_SHARES,
      pricePerShare: 10_000_000, // in smallest unit
      investorPercent: 70,
      status: LotStatus.ACTIVE,
      onChainStatus: OnChainSyncStatus.SYNCED,
      metadata: {
        imageUrl: "/images/cattle-angus.jpg",
        riskLevel: "low",
        producerExperience: "15 years",
        fundraisingProof: {
          thresholdPercent: 100,
          verified: true,
          txHash: DEMO_TX_HASH,
          lotCommitment: DEMO_LOT_COMMITMENT,
          provedAt: DEMO_PROVED_AT,
        },
      },
    },
  });

  console.log(`Created lot id=${lot.id} — "${lot.name}"`);

  // Create investor accounts + balances to represent FUNDED_SHARES sold
  // We'll create a single investor account holding all shares for simplicity
  let investor = await prisma.investor.findFirst();
  if (!investor) {
    throw new Error("No investor found — run the main seed first");
  }

  // Ensure the investor has an account
  const account = await prisma.account.upsert({
    where: { userId_type: { userId: investor.userId, type: "LOT_SHARES" } },
    create: { userId: investor.userId, type: "LOT_SHARES" },
    update: {},
  });

  // Create balance record representing all funded shares
  await prisma.balance.create({
    data: {
      accountId: account.id,
      assetType: "LOT_SHARES",
      lotId: lot.id,
      available: FUNDED_SHARES,
      locked: 0,
    },
  });

  console.log(`Created balance: ${FUNDED_SHARES} shares for investor userId=${investor.userId}`);
  console.log(`\nDemo proof data:`);
  console.log(`  thresholdPercent: 100`);
  console.log(`  txHash: ${DEMO_TX_HASH}`);
  console.log(`  lotCommitment: ${DEMO_LOT_COMMITMENT}`);
  console.log(`\nOpen: http://localhost:3000/lot/${lot.id}`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
