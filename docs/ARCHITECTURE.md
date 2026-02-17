# YourCow Architecture (System Overview)

Last updated: 2026-02-17

This document is the **system-wide** source of truth for:
- Repo/module boundaries
- End-to-end flows (Investor/Producer/Admin)
- Where to find the deeper, package-specific architecture docs

If something conflicts across docs, follow this order:
1) [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) (this file)
2) Package-level architecture docs (`packages/*/ARCHITECTURE.md`)
3) Feature/task plans (e.g. [`docs/EXAMPLE-DESIGN.md`](EXAMPLE-DESIGN.md))

---

## 1) What this repo is

YourCow is a cattle-lot investment platform (retail, mostly fiat) with:
- **Off-chain** custody + accounting (DB-first, ledgered)
- **On-chain** integrity + cap-table primitives on Starknet
- **Per-animal traceability** anchored on-chain (hash/roots), with data stored off-chain

The repo is a monorepo with three primary packages:
- `packages/nextjs`: UI (Investor/Producer/Admin) + client-side API integration
- `packages/backend`: NestJS API + DB-first business logic + orchestrated on-chain calls
- `packages/snfoundry`: Starknet contracts + scripts/tests (MVP spec lives here)

---

## 2) Source documents (read these first)

- Frontend architecture: [`packages/nextjs/ARCHITECTURE.md`](../packages/nextjs/ARCHITECTURE.md)
- Backend architecture: [`packages/backend/ARCHITECTURE.md`](../packages/backend/ARCHITECTURE.md)
- On-chain MVP spec + rules: [`packages/snfoundry/PROJECT_SPEC.MD`](../packages/snfoundry/PROJECT_SPEC.MD)
- Client/backend integration pattern (Zod + Query + optional Zustand): [`docs/CLIENT_BACKEND_INSTRUCTIONS.md`](CLIENT_BACKEND_INSTRUCTIONS.md)
- Implemented Investor API flow summary: see **Appendix A** in this file

---

## 3) High-level architecture (DB-first + on-chain mirror)

Principle: **the database is the source of truth** for business state.

Numeric types principle (repo-wide): **DB + API + UI use `Int`/`number` for business values** (fiat in smallest unit, share counts, price-per-share, settlement proceeds). Contracts may use `u256`; conversion happens only at the on-chain boundary.

For any action that touches Starknet:
1) Create the off-chain record first (status = PENDING)
2) Submit the on-chain transaction (status = SYNCING, store `txHash`)
3) Confirm and mark the record SYNCED/FAILED

This avoids "orphaned" on-chain state that the system cannot explain/account for.

---

## 4) Key concepts

### Custodial balances (fiat + shares)
In custodial mode:
- Users deposit fiat off-chain (Stripe/MercadoPago, etc.)
- The backend credits fiat balance and writes a ledger entry
- When the user buys shares, the backend mints on-chain shares to a protocol vault
  and reflects user ownership off-chain via balances/ledger

### Traceability anchoring
Traceability events live off-chain (DB).
Periodically (and/or manually), the system anchors integrity proofs on-chain:
- Per-animal roots/hashes anchored via the traceability oracle contract
- Ledger integrity anchored via an audit registry (batch hash)

---

## 5) End-to-end flows (current)

### 5.1 Investor: email session
Backend:
- `POST /api/auth/login` -> sets signed httpOnly cookie
- `GET /api/auth/me` -> returns current user

Client:
- Uses `credentials: "include"` (no localStorage token)
- Reads session via `useMe()`

Implementation notes: Appendix A (below)

### 5.2 Investor: fiat deposit (custody credit)
1) Payment intent created/confirmed off-chain (provider-specific)
2) Backend creates `Payment` record (PENDING)
3) Backend confirms deposit and credits fiat balance + ledger `FIAT_DEPOSIT`

### 5.3 Investor: primary market buy (shares mint + off-chain credit)
Prereq: user has available fiat balance in custody.

1) Client calls `POST /api/offers/buy-primary` with `idempotencyKey`
2) Backend locks fiat, mints on-chain shares (to vault), credits shares off-chain
3) Backend writes ledger `SHARES_MINT` with `txHash`

Implementation notes: Appendix A (below)

---

## 6) Folder boundaries (what goes where)

### Frontend (`packages/nextjs`)
- UI in `app/[locale]/(feature)/...`
- API client + Zod schemas in `lib/api/*`
- React Query hooks in `hooks/*`
- Zustand stores only for persisted/global UI state in `services/store/*`

Rules: [`docs/CLIENT_BACKEND_INSTRUCTIONS.md`](CLIENT_BACKEND_INSTRUCTIONS.md)

### Backend (`packages/backend`)
- DB-first core modules under `src/modules/core/*`
- Starknet interactions under `src/modules/onchain/*`
- Keep DTOs/Prisma/Zod aligned

Details: `packages/backend/ARCHITECTURE.md`

### Contracts (`packages/snfoundry`)
- Contract behavior must match `packages/snfoundry/PROJECT_SPEC.MD`
- Tests/scripts live alongside the contracts

---

## 7) Glossary (shared terms)

- **Lot**: a group of cattle offered as an investment product
- **Shares**: ERC20 representing ownership units of a lot
- **Animal ID**: ERC721 identity (registry) for per-animal traceability
- **Custody**: off-chain balances + ledger reflecting user holdings
- **Anchor**: on-chain commitment (hash/root) proving integrity of off-chain data

---

<details>
<summary><strong>Appendix A: Client &lt;-&gt; Backend Flow (Investor) (implemented)</strong></summary>

This section summarizes what was implemented to connect the client (Next.js) with the backend (NestJS) using TanStack Query + Zod.

### A.1 Goal
- Leave the base architecture ready to consume real DB data.
- Keep mocks as a fallback until all backend endpoints are real.
- Email authentication to identify the user.

### A.2 Backend: Auth + `/auth/me`

Endpoints:
- `POST /api/auth/login`
  - Input: `{ email, name?, role? }`
  - Creates the user if it does not exist (role INVESTOR).
  - Returns the user and sets an httpOnly cookie.
- `GET /api/auth/me`
  - Requires a valid cookie.
  - Returns the logged-in user.
- `POST /api/auth/logout` clears the cookie.
- `POST /api/auth/wallet/challenge` input `{ address }` returns typed-data challenge.
- `POST /api/auth/wallet/link` input `{ address, signature }` links wallet to current user.

Session:
- Signed cookie (HMAC) with `AUTH_SECRET`.
- Cookie name: `yc_session`.
- The frontend does not store a token in localStorage.

CORS:
- `packages/backend/src/main.ts` enables `credentials: true` and `origin` from `CORS_ORIGIN` (default `http://localhost:3000`).

Key files (backend):
- `packages/backend/src/modules/core/auth/auth.controller.ts`
- `packages/backend/src/modules/core/auth/auth.service.ts`
- `packages/backend/src/modules/core/auth/auth.guard.ts`
- `packages/backend/src/modules/core/auth/auth.module.ts`
- `packages/backend/.env.example`

### A.3 Backend: Payments (fiat deposit)

Endpoints:
- `POST /api/payments` input `{ paymentIntentId, investorId, lotId, amountFiat, currency, txHash? }` creates pending payment record.
- `POST /api/payments/:id/confirm` input `{ txHash? }` marks payment confirmed.
- `POST /api/payments/:id/fiat-deposit` finalizes fiat deposit and writes ledger entry (replaces old `.../mint`).

Notes:
- Payments are fiat-only. Shares are not minted here.
- After a successful fiat deposit, the user has fiat balance in custody.

### A.4 Backend: Primary Market (buy shares)

Endpoint:
- `POST /api/offers/buy-primary` input `{ lotId, sharesAmount, idempotencyKey }`
  - Locks user fiat, mints on-chain (to protocol vault in custodial mode), and credits shares off-chain.
  - Writes a `SHARES_MINT` ledger entry with `txHash`.

Custodial summary:
1) `payments/:id/fiat-deposit` → credits fiat balance + ledger `FIAT_DEPOSIT`
2) `offers/buy-primary` → locks fiat, mints on-chain to vault, credits shares off-chain, ledger `SHARES_MINT`

Important requirement:
- User must deposit fiat first to have available custody balance.

### A.5 Backend: Portfolio

Endpoints:
- `GET /api/portfolio` returns authenticated user's full portfolio (fiat + positions).
- `GET /api/portfolio/:lotId` returns authenticated user's position for a specific lot.

### A.6 Client: API layer + Zod + TanStack Query

API layer:
- Base URL from `NEXT_PUBLIC_API_URL`
- `credentials: "include"` to send cookies
- Simple error handling

Key file: `packages/nextjs/lib/api/client.ts`

Zod:
- Schemas live in `packages/nextjs/lib/api/schemas.ts`

Auth on the client:
- `packages/nextjs/lib/api/auth.ts`
- `packages/nextjs/hooks/auth/useLogin.ts`
- `packages/nextjs/hooks/auth/useMe.ts`

Lots:
- `packages/nextjs/lib/api/lots.ts`
- `packages/nextjs/hooks/lots/useLots.ts`
- `packages/nextjs/hooks/lots/useLot.ts`

Adapters (DB → investor UI):
- `packages/nextjs/lib/api/adapters.ts`
- `mapLotToInvestorLot()` maps backend `Lot.metadata` to the investor UI shape.

### A.7 Investor screens connected (with mock fallback)
- Marketplace: `packages/nextjs/app/[locale]/(investor)/_components/screens/MarketplaceScreen.tsx`
- Lot detail: `packages/nextjs/app/[locale]/(investor)/_components/screens/LotDetailScreen.tsx`
- Invest amount: `packages/nextjs/app/[locale]/(investor)/_components/screens/InvestAmountScreen.tsx`
- Portfolio: `packages/nextjs/app/[locale]/(investor)/_components/screens/PortfolioScreen.tsx`
- Real login: `packages/nextjs/app/[locale]/(investor)/_components/screens/LoginScreen.tsx`

### A.8 Environment variables

Frontend (`packages/nextjs/.env.example`):
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

Backend (`packages/backend/.env.example`):
- `PORT=3001`
- `AUTH_SECRET=replace-with-strong-secret`
- `CORS_ORIGIN=http://localhost:3000`

### A.9 Full flow (summary)
1) User opens `/login` and submits email.
2) Client calls `POST /api/auth/login`.
3) Backend creates/validates user and sets cookie.
4) Client redirects to `/dashboard`.
5) Hooks (`useMe`, `useLots`, etc) query the backend.
6) If real data is missing, UI falls back to mock data without breaking.

### A.10 What is missing for fully real data
- Portfolio endpoints exist, but UI still needs complete data to drop mocks.
- Ensure `Lot.metadata` includes the fields the UI uses (location, duration, expectedReturn, breed, herdSize, fundingProgress, imageUrl, producer info, traceability events).

</details>
