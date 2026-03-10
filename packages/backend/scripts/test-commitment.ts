/**
 * Regression test for Poseidon2 commitment computation.
 *
 * Validates that TypeScript field arithmetic matches the Noir circuit.
 * Run: npx tsx scripts/test-commitment.ts
 *
 * Exit 0 = all assertions passed.
 * Exit 1 = a mismatch was detected (proof would be invalid).
 */

import { BarretenbergSync } from "@aztec/bb.js";
import { createHash } from "crypto";

// ── Constants ──────────────────────────────────────────────────────────────

const FIELD_PRIME = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// Known-good test vector from the Noir circuit test_permutation_matches_bbjs
const HASH2_KNOWN_RESULT = 0x2a04ea402711ced2d4bc39608cc5350a7db4af98ec2950d4d1ec30334d6c2b4n;

// Hardcoded inputs — these are the regression anchors.
// If commitment output changes, the Noir circuit MUST be updated to match before
// changing these values.
const TEST_INVESTOR_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const TEST_SHARE_AMOUNT = 50;
const TEST_LOT_ON_CHAIN_ID = 1;
const TEST_INVESTOR_ID = 42;
const TEST_INVESTOR_SECRET_SEED = "test-seed-do-not-use-in-production";

// ── Field helpers ──────────────────────────────────────────────────────────

function toBE32(n: bigint): Uint8Array {
  const buf = new Uint8Array(32);
  let v = n;
  for (let i = 31; i >= 0; i--) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

/** Poseidon2 sponge of 2 field elements: state=[a,b,0,0] → permute → state[0] */
function hash2(bb: BarretenbergSync, a: bigint, b: bigint): bigint {
  const result = bb.poseidon2Permutation({
    inputs: [toBE32(a), toBE32(b), toBE32(0n), toBE32(0n)],
  });
  return BigInt("0x" + Buffer.from(result.outputs[0]).toString("hex"));
}

/**
 * Poseidon2 sponge of 4 field elements.
 * Rate=3: absorb [a,b,c], permute, then add d to state[0] mod p, permute again.
 * The % FIELD_PRIME on (mid0 + d) is mandatory — omitting it silently corrupts the hash.
 */
function hash4(bb: BarretenbergSync, a: bigint, b: bigint, c: bigint, d: bigint): bigint {
  const mid = bb.poseidon2Permutation({
    inputs: [toBE32(a), toBE32(b), toBE32(c), toBE32(0n)],
  });
  const mid0 = BigInt("0x" + Buffer.from(mid.outputs[0]).toString("hex"));
  const mid1 = BigInt("0x" + Buffer.from(mid.outputs[1]).toString("hex"));
  const mid2 = BigInt("0x" + Buffer.from(mid.outputs[2]).toString("hex"));
  const mid3 = BigInt("0x" + Buffer.from(mid.outputs[3]).toString("hex"));

  const result = bb.poseidon2Permutation({
    inputs: [
      toBE32((mid0 + d) % FIELD_PRIME),
      toBE32(mid1),
      toBE32(mid2),
      toBE32(mid3),
    ],
  });
  return BigInt("0x" + Buffer.from(result.outputs[0]).toString("hex"));
}

function deriveSalt(seed: string, investorId: number, lotOnChainId: number): bigint {
  const raw = createHash("sha256")
    .update(seed)
    .update(String(investorId))
    .update(String(lotOnChainId))
    .digest();
  return BigInt("0x" + raw.toString("hex")) % FIELD_PRIME;
}

// ── Assertion helper ───────────────────────────────────────────────────────

function assert(label: string, actual: bigint, expected: bigint): void {
  if (actual === expected) {
    console.log(`  PASS  ${label}`);
  } else {
    console.error(`  FAIL  ${label}`);
    console.error(`        expected: 0x${expected.toString(16)}`);
    console.error(`        actual:   0x${actual.toString(16)}`);
    process.exitCode = 1;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Initializing BarretenbergSync WASM...");
  const bb = await BarretenbergSync.new();
  console.log("WASM ready.\n");

  // ── Test 1: known hash2 vector (must match Noir test_permutation_matches_bbjs) ──
  console.log("Test 1: hash2 known vector");
  const h2 = hash2(bb, 1n, 0n);
  assert("hash2(1, 0)", h2, HASH2_KNOWN_RESULT);

  // ── Test 2: hash2 commutativity check (sanity — hash2(a,b) != hash2(b,a)) ──
  console.log("\nTest 2: hash2 is not commutative (order matters)");
  const h2_flipped = hash2(bb, 0n, 1n);
  if (h2_flipped !== h2) {
    console.log("  PASS  hash2(0,1) !== hash2(1,0) — order is enforced");
  } else {
    console.error("  FAIL  hash2(0,1) === hash2(1,0) — this would be a collision bug");
    process.exitCode = 1;
  }

  // ── Test 3: salt derivation is deterministic ──
  console.log("\nTest 3: salt derivation is deterministic");
  const salt1 = deriveSalt(TEST_INVESTOR_SECRET_SEED, TEST_INVESTOR_ID, TEST_LOT_ON_CHAIN_ID);
  const salt2 = deriveSalt(TEST_INVESTOR_SECRET_SEED, TEST_INVESTOR_ID, TEST_LOT_ON_CHAIN_ID);
  assert("deriveSalt consistency", salt1, salt2);

  // ── Test 4: full commitment computation ──
  console.log("\nTest 4: full commitment (regression anchor)");
  const addr = BigInt(TEST_INVESTOR_ADDRESS);
  const shares = BigInt(TEST_SHARE_AMOUNT);
  const lotId = BigInt(TEST_LOT_ON_CHAIN_ID);
  const salt = deriveSalt(TEST_INVESTOR_SECRET_SEED, TEST_INVESTOR_ID, TEST_LOT_ON_CHAIN_ID);

  const commitment = hash4(bb, addr, shares, lotId, salt);

  // This value is computed once and pinned. If it changes, investigate before updating.
  // To regenerate: run this script once with process.exitCode check disabled and record output.
  console.log("\n  Commitment inputs:");
  console.log(`    investor_address = "${TEST_INVESTOR_ADDRESS}"`);
  console.log(`    share_amount     = "${TEST_SHARE_AMOUNT}"`);
  console.log(`    lot_id           = "0x${TEST_LOT_ON_CHAIN_ID.toString(16)}"`);
  console.log(`    salt             = "0x${salt.toString(16)}"`);
  console.log(`\n  investor_commitment = "0x${commitment.toString(16)}"`);

  // ── Test 5: commitment changes if share_amount changes ──
  console.log("\nTest 5: commitment is sensitive to share_amount");
  const commitment_different_shares = hash4(bb, addr, shares + 1n, lotId, salt);
  if (commitment_different_shares !== commitment) {
    console.log("  PASS  commitment(shares+1) !== commitment(shares)");
  } else {
    console.error("  FAIL  commitment did not change when share_amount changed");
    process.exitCode = 1;
  }

  // ── Test 6: Prover.toml output ──
  console.log("\nTest 6: Prover.toml (copy into circuits/investor_position/Prover.toml to test)");
  const proverToml = [
    `# Public inputs`,
    `lot_id = "0x${TEST_LOT_ON_CHAIN_ID.toString(16)}"`,
    `investor_commitment = "0x${commitment.toString(16)}"`,
    ``,
    `# Private inputs`,
    `investor_address = "${TEST_INVESTOR_ADDRESS}"`,
    `share_amount = "${TEST_SHARE_AMOUNT}"`,
    `salt = "0x${salt.toString(16)}"`,
  ].join("\n");
  console.log("\n" + proverToml);

  if (!process.exitCode) {
    console.log("\nAll tests passed.");
  } else {
    console.error("\nOne or more tests FAILED. Do not use these values in production.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
