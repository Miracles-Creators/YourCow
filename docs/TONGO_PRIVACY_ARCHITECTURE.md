# Tongo Architecture And Tu Vaca Implementation

Last updated: 2026-03-09

This document explains what Tongo is, how it works at a protocol level, and how Tu Vaca uses it for privacy-preserving secondary-market transactions.

## One-Sentence Summary

Tongo wraps ERC20 value in an encrypted balance system on Starknet, and Tu Vaca uses that encrypted balance rail to settle private STRK payments for P2P share trades while keeping share ownership and marketplace state in the app database.

## What Tongo Is

Tongo is a confidential payment system for ERC20 tokens on Starknet.

At a high level it gives you:
- encrypted balances on-chain
- encrypted transfers on-chain
- zero-knowledge proofs that those encrypted operations are valid
- optional audit and compliance hooks

In plain language:
- people can see that a payment happened
- people cannot read the amount from chain state

Official references:
- https://docs.tongo.cash/
- https://docs.tongo.cash/sdk/overview.html
- https://www.npmjs.com/package/@fatsolutions/tongo-sdk

## Why We Use Tongo In Tu Vaca

Tu Vaca has two separate privacy stories:

- Garaga/Noir hides fundraising totals
- Tongo hides payment amounts in P2P STRK trades

Tongo is the stronger choice for the hackathon than building a custom privacy payment rail because:
- the SDK already exposes account, fund, transfer, rollover, and withdraw flows
- it is natively Starknet-oriented
- it fits the user experience we need for a marketplace demo

## Core Tongo Concepts

### 1. Tongo account

A Tongo account is not the same thing as the user's visible Starknet wallet account.

In Tu Vaca:
- each user gets a Tongo keypair
- that keypair controls their encrypted Tongo balance
- the platform backend stores the encrypted Tongo private key so it can execute operations server-side

This is an important implementation decision:
- Tu Vaca currently uses a custodial/operator model for Tongo operations

### 2. Current balance

This is the encrypted spendable balance.

According to the Tongo docs, zero-knowledge proofs are checked against this current balance.

### 3. Pending balance

Incoming transfers first land in pending balance.

That prevents received transfers from directly mutating the sender-validating balance and breaking proof assumptions. The owner later rolls pending into current through a separate `rollover` operation.

### 4. Fund

Funding converts normal ERC20 tokens into encrypted Tongo balance.

### 5. Transfer

Transfer moves encrypted value from one Tongo account to another Tongo account without revealing the amount publicly.

### 6. Rollover

Rollover promotes pending balance into usable current balance.

### 7. Withdraw

Withdraw exits the encrypted system and returns normal ERC20 tokens to a Starknet address.

## What Tu Vaca Stores Off-Chain

Relevant Prisma models:
- [`packages/backend/prisma/schema.prisma`](../packages/backend/prisma/schema.prisma)

Key records:
- `TongoAccount`
- `TongoDeposit`
- `Trade`

Meaning:

### `TongoAccount`

Per user, Tu Vaca stores:
- `tongoPublicKey`
- `encryptedPrivateKey`

The private key is encrypted with AES-256-GCM and derived per user from `TONGO_MASTER_KEY` through HKDF.

This happens in:
- [`packages/backend/src/modules/onchain/tongo/tongo.service.ts`](../packages/backend/src/modules/onchain/tongo/tongo.service.ts)

### `TongoDeposit`

This is the idempotency and audit record for deposits into the private balance.

Stored fields include:
- user
- original funding `txHash`
- amount

### `Trade`

For private P2P settlement, the important fields are:
- `status`
- `strkTotalPrice`
- `tongoTxHash`

Trade statuses:
- `PENDING`
- `TONGO_SETTLED`
- `COMPLETED`
- `FAILED`

That split is critical for the architecture:
- private payment confirmation happens first
- share transfer finalization happens second

## How Tu Vaca Implements Tongo

Primary backend files:
- [`packages/backend/src/modules/onchain/tongo/tongo.service.ts`](../packages/backend/src/modules/onchain/tongo/tongo.service.ts)
- [`packages/backend/src/modules/onchain/tongo/tongo.controller.ts`](../packages/backend/src/modules/onchain/tongo/tongo.controller.ts)
- [`packages/backend/src/modules/core/marketplace/private-trade.service.ts`](../packages/backend/src/modules/core/marketplace/private-trade.service.ts)

Primary frontend files:
- [`packages/nextjs/lib/api/tongo.ts`](../packages/nextjs/lib/api/tongo.ts)
- [`packages/nextjs/hooks/tongo/index.ts`](../packages/nextjs/hooks/tongo/index.ts)
- [`packages/nextjs/app/[locale]/(investor)/_components/tongo/FundModal.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/tongo/FundModal.tsx)
- [`packages/nextjs/app/[locale]/(investor)/_components/tongo/WithdrawModal.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/tongo/WithdrawModal.tsx)
- [`packages/nextjs/app/[locale]/(investor)/_components/tongo/TongoBalanceCard.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/tongo/TongoBalanceCard.tsx)
- [`packages/nextjs/app/[locale]/(investor)/_components/marketplace/AcceptOfferModal.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/marketplace/AcceptOfferModal.tsx)

## The Tu Vaca Custodial Model

Tu Vaca does not ask the end user to manually manage raw Tongo keys.

Instead:
- the backend generates the Tongo private key
- the backend encrypts it before saving
- the backend reconstructs the Tongo SDK account when it needs to fund, transfer, rollover, or withdraw
- the Starknet operator account submits the actual on-chain calls

So the privacy property is:
- hidden from public chain observers
- not hidden from the platform operator

This is an honest and defensible hackathon architecture because it optimizes for:
- a working demo
- simpler UX
- server-controlled sequencing

## Flow 1: Creating A Tongo Account

In `createTongoAccount(userId)`:

- check if the user already has a Tongo account
- generate a safe Stark-curve private key
- instantiate `new TongoSdkAccount(...)`
- extract the Tongo public key
- encrypt the private key
- save the record in Prisma

That means each app user gets a private encrypted balance namespace inside the Tongo contract.

## Flow 2: Funding The Private Balance

This is the path the user sees in the app.

### Frontend sequence

In [`packages/nextjs/app/[locale]/(investor)/_components/tongo/FundModal.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/tongo/FundModal.tsx):

1. User enters a STRK amount.
2. The frontend asks the regular wallet to transfer STRK to the operator address.
3. The frontend sends `txHash` and `amount` to `POST /tongo/deposit-confirm`.

### Backend sequence

In `confirmDeposit()`:

1. Check idempotency through `TongoDeposit`.
2. Wait for the wallet transfer tx to succeed on Starknet.
3. Persist the deposit record.
4. Ensure the user has a Tongo account.
5. Call `fund(userId, amount)`.

### On-chain Tongo sequence

In `fund()`:

1. Rebuild the user's `TongoSdkAccount`.
2. Convert ERC20 units to Tongo units with `erc20ToTongo`.
3. Build the fund operation via the SDK.
4. If needed, include the SDK-generated approval call.
5. Execute the transaction through the operator Starknet account.
6. Wait for confirmation.

This lines up with the official Tongo funding model:
- ERC20 is pulled into the Tongo contract
- encrypted balance is credited to the Tongo account

## Flow 3: Private P2P Payment For Share Trades

This is the core hackathon privacy flow.

Main service:
- [`packages/backend/src/modules/core/marketplace/private-trade.service.ts`](../packages/backend/src/modules/core/marketplace/private-trade.service.ts)

### Step 1. Validate the offer and compute STRK total

The backend:
- checks the offer is open
- prevents seller self-buy
- checks requested share amount
- calculates `strkTotalPrice`

### Step 2. Ensure both sides have Tongo accounts

The backend calls:
- `createTongoAccount(buyerId)`
- `createTongoAccount(sellerId)`

### Step 3. Check buyer encrypted balance

The backend reads `getBalance(buyerId)` and compares the current Tongo balance to the required STRK total.

### Step 4. Create the trade record first

The backend writes a `Trade` row with:
- `status = PENDING`
- `currency = STRK`
- `strkTotalPrice`

This follows the repo-wide DB-first architecture.

### Step 5. Execute encrypted Tongo transfer asynchronously

`processTradeAsync()` calls:

```ts
tongoService.transfer(buyerId, sellerId, amount)
```

Inside `transfer()`:
- buyer Tongo account is reconstructed
- seller public key is loaded from Prisma
- amount is converted to Tongo units
- the SDK creates the confidential transfer operation
- the operator submits the call on Starknet
- backend waits for tx success

If that succeeds:
- trade status becomes `TONGO_SETTLED`
- `tongoTxHash` is stored

If it fails:
- trade status becomes `FAILED`

### Step 6. Rollover seller pending balance

After transfer, the backend separately calls:

```ts
tongoService.rollover(sellerId)
```

This matches Tongo's storage model:
- received funds land in `pending`
- rollover moves them into spendable `current`

The code treats rollover as a separate step because the private payment already succeeded even if rollover has not yet completed.

### Step 7. Finalize the business trade off-chain

Once Tongo payment is settled, Tu Vaca finalizes the marketplace trade in its own accounting system:

- transfer lot shares from seller custody account to buyer custody account
- update offer fill counts
- write ledger entries
- mark trade `COMPLETED`

This is a key architectural point:
- Tongo settles money privacy
- Tu Vaca still owns the marketplace and custody state machine

## Flow 4: Withdraw

Frontend:
- [`packages/nextjs/app/[locale]/(investor)/_components/tongo/WithdrawModal.tsx`](../packages/nextjs/app/%5Blocale%5D/%28investor%29/_components/tongo/WithdrawModal.tsx)

Backend endpoint:
- `POST /tongo/withdraw`

Backend service:
- rebuild user's Tongo account
- create withdraw operation
- operator submits it
- Tongo releases ERC20 value back to the requested Starknet address

## API Surface Used By The Frontend

Implemented endpoints:
- `GET /tongo/config`
- `GET /tongo/balance`
- `POST /tongo/deposit-confirm`
- `POST /tongo/withdraw`
- `POST /tongo/prefund` for admin seeding

The frontend wraps these in:
- [`packages/nextjs/lib/api/tongo.ts`](../packages/nextjs/lib/api/tongo.ts)
- [`packages/nextjs/hooks/tongo/index.ts`](../packages/nextjs/hooks/tongo/index.ts)

## Concurrency And Safety Measures In The Backend

The Tongo service uses:
- `withUserLock()` to serialize operations per user
- `withNonceLock()` to serialize Starknet nonce usage globally

Why this matters:
- concurrent confidential operations can race badly if the same user state or operator nonce is reused incorrectly
- these locks keep the hackathon implementation stable

## What Is Private vs What Is Still Visible

Private on-chain:
- encrypted balances
- encrypted payment amounts
- transfer values in Tongo operations

Public or platform-visible:
- that a Tongo transaction happened
- sender/operator activity
- marketplace trade existence
- the exact amount to the Tu Vaca backend
- off-chain trade state in the database

The clean demo line is:

- "The chain sees the transfer happened, but not how much was paid."

Do not claim:

- "The platform cannot see the amount."

That would be false in the current implementation.

## Why Tongo Fits The Tu Vaca Architecture

Tongo solves only the private payment rail.

Tu Vaca still needs:
- auth
- portfolio state
- lot ownership ledger
- offer lifecycle
- trade finalization
- compliance and UX

That separation is actually good architecture:
- Tongo does confidential settlement
- Tu Vaca does marketplace orchestration

## Strengths Of The Current Tongo Integration

- Real encrypted settlement path on Starknet
- Clear UX: fund, trade, withdraw
- Strong demo story when paired with Garaga
- DB-first trade lifecycle reduces inconsistent business state
- Explicit `tongoTxHash` makes explorer-based verification easy

## Current Limits

- Operator/custodial model, not user-self-custodial privacy
- Tongo contract address is hardcoded in the service
- current implementation uses one wrapped STRK instance
- no direct user-managed Tongo viewing/auditing flows in the app UI

These are acceptable hackathon tradeoffs, but they are still tradeoffs.

## Best 30-Second Explanation For The Video

"Tongo gives us encrypted balances and encrypted transfers on Starknet. In Tu Vaca, users first fund a private STRK balance, then P2P trades settle through Tongo so the payment amount is hidden on-chain. After the private payment succeeds, our backend finalizes the share transfer in the marketplace ledger. So judges can see a real Starknet transaction, but they cannot read the transferred amount from the public chain data."

## Suggested Visual Sequence For Remotion

1. Show the private balance card.
2. Show the fund modal and the wallet-to-operator transfer.
3. Animate the path:
   wallet STRK -> operator -> Tongo fund -> encrypted balance.
4. Show a P2P buy in the offer modal.
5. Animate:
   buyer encrypted balance -> Tongo transfer -> seller pending -> rollover.
6. Show the Voyager transaction link.
7. End with the contrast card:
   public: trade happened
   hidden: payment amount

## External References

- Tongo overview: https://docs.tongo.cash/
- Tongo SDK overview: https://docs.tongo.cash/sdk/overview.html
- Tongo fund operation: https://docs.tongo.cash/sdk/operations/fund.html
- Tongo transfer operation: https://docs.tongo.cash/sdk/operations/transfer.html
- Tongo rollover operation: https://docs.tongo.cash/sdk/operations/rollover.html
- Tongo withdraw operation: https://docs.tongo.cash/sdk/operations/withdraw.html
- Tongo storage architecture: https://docs.tongo.cash/protocol/storage.html
- Tongo auditing and compliance: https://docs.tongo.cash/protocol/auditor.html

