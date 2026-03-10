# Neuer (Noir) + Garaga Architecture

Last updated: 2026-03-09

This document explains the zero-knowledge proof architecture currently used in Tu Vaca for the Garaga flow.

Important clarification:
- In the current codebase, the implemented circuit is a Noir circuit, so this doc uses "Neuer (Noir)" to match the request and the actual stack.
- The shipped implementation is the fundraising-threshold proof.
- A second proof for investor-position privacy exists in planning docs, but it is not wired in the running backend yet.

## One-Sentence Summary

Tu Vaca uses a Noir circuit to prove that a lot reached a funding threshold, generates an Ultra Honk proof with Barretenberg tooling, transforms that proof into Starknet calldata with Garaga, and verifies it on-chain with a Garaga-generated Cairo verifier.

## What Problem This Solves

We want to prove:

- "This lot raised at least X% of its target"

Without revealing:

- exact funded shares
- exact total shares
- investor-level funding distribution

That gives the demo a clean privacy claim:

- the outcome is public
- the sensitive numbers stay private

## Current Implementation Scope

Implemented now:
- fundraising-threshold Noir circuit
- local proof generation in the backend
- on-chain verification through a Garaga verifier contract
- proof result stored in `lot.metadata.fundraisingProof`
- UI badge with Voyager link

Planned but not implemented in runtime:
- investor-position proof
- second verifier contract for that second circuit

Primary repo files:
- [`circuits/fundraising_threshold/src/main.nr`](../circuits/fundraising_threshold/src/main.nr)
- [`packages/backend/src/modules/onchain/garaga/garaga.service.ts`](../packages/backend/src/modules/onchain/garaga/garaga.service.ts)
- [`packages/backend/src/modules/onchain/garaga/garaga.controller.ts`](../packages/backend/src/modules/onchain/garaga/garaga.controller.ts)
- [`packages/nextjs/app/[locale]/(investor)/_components/garaga/FundraisingProofBadge.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/garaga/FundraisingProofBadge.tsx)
- [`docs/plans/garaga-status.md`](./plans/garaga-status.md)
- [`docs/plans/2026-03-04-feat-garaga-zk-privacy-two-proofs-plan.md`](./plans/2026-03-04-feat-garaga-zk-privacy-two-proofs-plan.md)

## The Circuit

The current circuit is intentionally small.

Public inputs:
- `threshold_percent`
- `lot_id`

Private inputs:
- `funded_shares`
- `total_shares`

Core assertion:

```text
funded_shares * 100 >= threshold_percent * total_shares
```

That logic lives in:
- [`circuits/fundraising_threshold/src/main.nr`](../circuits/fundraising_threshold/src/main.nr)

What the circuit does:
- checks `total_shares > 0`
- checks threshold is between 1 and 100
- proves threshold satisfaction using integer arithmetic

What the circuit does not do:
- it does not hide that a proof exists
- it does not hide the target threshold percent
- it does not currently bind to a cryptographic commitment of off-chain data beyond `lot_id`

## End-to-End Architecture

```text
Prisma / Postgres
  -> aggregate funded shares for a lot
  -> read lot.totalShares

NestJS GaragaService
  -> build Prover.toml
  -> run nargo execute witness
  -> run bb prove (Ultra Honk)
  -> read proof + public_inputs
  -> convert proof to Starknet calldata with garaga
  -> call Garaga verifier on Starknet
  -> wait for tx success
  -> persist fundraisingProof metadata in the lot record

Next.js UI
  -> reads lot metadata
  -> renders "ZK Verified" badge
  -> links to Voyager verification tx
```

## Backend Flow In Detail

### 1. Admin triggers proof generation

Endpoint:
- `POST /garaga/prove-threshold`

Controller:
- [`packages/backend/src/modules/onchain/garaga/garaga.controller.ts`](../packages/backend/src/modules/onchain/garaga/garaga.controller.ts)

Rules:
- authenticated
- admin-only
- `lotId` required
- `thresholdPercent` defaults to `100`

### 2. Backend computes the hidden inputs

In [`packages/backend/src/modules/onchain/garaga/garaga.service.ts`](../packages/backend/src/modules/onchain/garaga/garaga.service.ts), `runProofJob()`:

- fetches the lot from Prisma
- aggregates lot-share balances from `Balance`
- computes `fundedShares`
- reads `lot.totalShares`
- rejects if the threshold is not actually met

This is important for the architecture story:

- the backend knows the real numbers
- the chain only sees the public proof inputs plus the proof

So the privacy claim is:

- hidden from the verifier contract and public chain observers
- not hidden from the platform backend

### 3. Backend materializes `Prover.toml`

`buildProverToml()` creates:

- `threshold_percent`
- `lot_id`
- `funded_shares`
- `total_shares`

This file is written into a temporary working copy of the circuit directory.

### 4. Noir generates the witness

The service runs:

```bash
nargo execute witness
```

This executes the compiled circuit with the private inputs and produces the witness required for proving.

### 5. Barretenberg generates the proof

The service then runs:

```bash
bb prove -s ultra_honk --oracle_hash keccak ...
```

Outputs read by the backend:
- `target/proof`
- `target/public_inputs`

In other words:
- Noir defines the computation
- `nargo` executes it
- `bb` turns it into an Ultra Honk proof

### 6. Garaga converts the proof for Starknet verification

The backend loads:

- the proof bytes
- the public inputs
- the verification key from `target/vk/vk`

Then it calls Garaga's calldata helper:

```ts
getZKHonkCallData(proof, publicInputs, vk)
```

This transforms proof artifacts into calldata compatible with the generated Cairo verifier.

### 7. Starknet verifies the proof on-chain

The backend operator account executes:

- contract: `GARAGA_VERIFIER_ADDRESS`
- entrypoint: `verify_ultra_keccak_zk_honk_proof`

If the transaction succeeds, the proof is treated as verified.

### 8. Result is written back to the lot

The backend stores:

- `thresholdPercent`
- `lotId`
- `verified`
- `txHash`
- `provedAt`

Inside:

- `lot.metadata.fundraisingProof`

That choice is pragmatic for the hackathon:
- no separate proof table
- frontend can read the proof state directly from the lot payload

## What Is Public vs Hidden

Public:
- a proof exists
- the lot identifier
- the threshold percent
- the verification transaction hash
- the verification timestamp

Hidden:
- funded shares
- total shares
- exact gap above threshold
- investor-by-investor funding composition

This is the most honest way to explain the feature in the video:

- "We prove the threshold outcome, not the underlying numbers."

## UI Surface

Frontend component:
- [`packages/nextjs/app/[locale]/(investor)/_components/garaga/FundraisingProofBadge.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/garaga/FundraisingProofBadge.tsx)

The badge communicates three things:
- the threshold was proven
- Starknet verified it
- the user can inspect the tx on Voyager

Displayed product line:
- `ZK Verified: Above X% funded`

That is a good demo line because it is outcome-first.

## Why Garaga Matters In This Stack

Garaga is the Starknet bridge from a generic proof artifact to an actual Cairo verifier.

In this project Garaga provides two critical roles:
- generating the verifier contract from the verification key
- converting proof artifacts into calldata the verifier contract can consume

Without Garaga, the Noir proof would exist off-chain but would not be naturally usable by the Starknet app.

## Architectural Tradeoffs

### Strengths

- Simple circuit, easy to explain live
- Real on-chain verification, not just off-chain proof generation
- Clear privacy claim with minimal math overhead in the demo
- Good separation between off-chain business state and on-chain integrity proof

### Limits

- Proof job is backend-driven and admin-triggered
- Exact numbers are still visible to the backend
- Only one shipped circuit today
- `lot_id` is currently the DB lot id in the running code, while the planning doc recommends binding to the on-chain lot id for stronger semantics

That last point is worth mentioning if judges ask about rigor:
- the design direction is sound
- one binding detail is still stronger in the plan than in the current code

## Current State vs Planned State

Current code:
- one circuit directory: `circuits/fundraising_threshold`
- one verifier address: `GARAGA_VERIFIER_ADDRESS`
- one proof type stored in lot metadata

Planned architecture from the active design doc:
- second circuit for investor-position privacy
- separate verifier contract per circuit
- more explicit circuit parameterization in the backend

This distinction matters for the demo:
- do not claim both proofs are fully implemented unless the second circuit is actually wired before recording

## Best 30-Second Explanation For The Video

"We use a Noir circuit to prove that a lot passed a fundraising threshold without revealing the exact totals. The backend computes the private values, Barretenberg generates an Ultra Honk proof, Garaga turns that proof into Starknet-compatible calldata, and a Garaga verifier contract checks it on-chain. The UI then shows a verifiable ZK badge linked to the real Starknet transaction."

## Suggested Visual Sequence For Remotion

1. Show the lot card or lot detail screen.
2. Highlight the `ZK Verified` badge.
3. Overlay the hidden rule: `funded_shares * 100 >= threshold * total_shares`.
4. Animate the flow:
   DB numbers -> Noir circuit -> Ultra Honk proof -> Garaga calldata -> Starknet verifier.
5. End on the Voyager transaction link.

## External References

These helped align the explanation with the underlying tools:

- Tongo is unrelated to Garaga, but it completes the privacy narrative in the app: https://docs.tongo.cash/
- Noir tutorial showing witness generation and `UltraHonkBackend` via `@aztec/bb.js`: https://noir-lang.org/docs/tutorials/noirjs_app
- Garaga repository and Starknet verifier workflow: https://github.com/keep-starknet-strange/garaga

