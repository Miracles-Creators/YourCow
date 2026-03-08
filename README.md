<div align="center">
  <h1>🐄 Your Cow</h1>
  <p><strong>Tokenized cattle-lot investment platform with privacy-preserving P2P trading,<br>
  real-time NAV oracles, and zero-knowledge proofs on Starknet.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Starknet-Cairo-blue?style=flat-square&logo=ethereum&logoColor=white" alt="Starknet">
    <img src="https://img.shields.io/badge/Chainlink-CRE-375BD2?style=flat-square&logo=chainlink&logoColor=white" alt="Chainlink">
    <img src="https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  </p>

  <p>
    <a href="./docs/ARCHITECTURE.md">Architecture</a> •
    <a href="./docs/CLIENT_BACKEND_INSTRUCTIONS.md">Client ↔ Backend Guide</a> •
    <a href="./docs/chainlink-cre-demo.md">Chainlink CRE Demo</a>
  </p>
</div>

---

## What is Your Cow?

Your Cow enables retail investors to buy tokenized shares in Argentine cattle lots — a traditionally opaque, illiquid asset class. The platform combines **DB-first off-chain accounting** with **on-chain integrity** on Starknet, privacy-preserving P2P transfers via Tongo, automated NAV calculation via Chainlink CRE, and zero-knowledge funding proofs via Garaga.

---

## Key Features

### 🐄 Starknet Smart Contracts

11 Cairo contracts managing the full lot lifecycle: share tokenization (ERC20), lot factory, animal registry with SENASA IDs, traceability oracle, settlement registry, NAV oracle, and audit registry. The database is the source of truth — every on-chain action follows a **PENDING → SYNCING → SYNCED** flow to guarantee consistency.

### 📊 Chainlink CRE — Real-time NAV Oracle

Automated Net Asset Value calculation using live Argentine market data (corn FOB prices, beef ARS/kg, USD/ARS exchange rates) via Chainlink CRE with **confidential compute** — private lot data never leaves the secure enclave. NAV flows cross-chain:

```
Chainlink CRE (DON) → NAVOracle.sol (EVM Sepolia) → NavRelayService → NavOracle.cairo (Starknet Sepolia)
```

**NAV Formula:** `revenue - feedCostIncurred - feedCostFuture - operatingCosts` (scaled ×100 for 2 decimal precision)

### 🔒 Tongo — Private P2P Transfers

Privacy-preserving secondary market using **ElGamal encryption** on Starknet. Transfer amounts are encrypted on-chain — only buyer and seller know the traded value. The platform manages custodial Tongo keys (AES-256-GCM encrypted per user) and executes private transfers server-side via an operator account.

### 🛡️ Garaga — Zero-Knowledge Proofs

ZK proof of funding threshold ("this lot raised ≥ X% of its target") without revealing investor counts or exact amounts. Built with **Noir circuits** compiled to Ultra Honk proofs, verified on-chain via a Garaga Cairo verifier.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   Next.js 15    │────▶│    NestJS API     │────▶│    Starknet   │
│   (Frontend)    │     │    (Backend)      │     │                          │
│                 │     │                   │     │  LotFactory               │
│  TanStack Query │     │  Prisma / PG      │     │  LotSharesToken (ERC20)  │
│  Zustand        │     │  Custody + Ledger │     │  AnimalRegistry           │
│  i18n (en/es)   │     │                   │     │  NavOracle                │
└─────────────────┘     │  ┌─────────────┐  │     │  TraceabilityOracle       │
                        │  │  Tongo SDK  │──│────▶│  SettlementRegistry       │
                        │  └─────────────┘  │     │  AuditRegistry            │
                        │                   │     └──────────────────────────┘
                        │  ┌─────────────┐  │
                        │  │  NavRelay   │──│────▶  EVM Sepolia
                        │  └─────────────┘  │      NAVOracle.sol
                        │                   │      ◀── Chainlink CRE
                        │  ┌─────────────┐  │
                        │  │   Garaga    │  │     ┌──────────────────────────┐
                        │  └─────────────┘  │     │  Noir Circuit             │
                        └──────────────────┘     │  (funding threshold)      │
                                                  └──────────────────────────┘
```

**Data flow:** The database is the canonical source of truth. On-chain state provides integrity and auditability. Every mutation: write to DB first (PENDING) → submit transaction (SYNCING) → confirm on-chain (SYNCED).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, Tailwind CSS v4, DaisyUI, Framer Motion, TanStack Query, Zustand |
| **Backend** | NestJS, Prisma, PostgreSQL, Zod |
| **Blockchain** | Starknet (Cairo), Ethereum (Solidity) |
| **Oracle** | Chainlink CRE + Confidential Compute |
| **Privacy** | Tongo SDK (ElGamal encryption), Garaga (ZK / Noir) |
| **Tooling** | starknet.js, Scarb, Starknet Foundry |

---

## Project Structure

```
your-cow/
├── packages/
│   ├── nextjs/          # Next.js 15 frontend (investor, producer, admin portals)
│   ├── backend/         # NestJS API (custody, ledger, on-chain modules)
│   ├── snfoundry/       # 11 Cairo smart contracts (Starknet)
│   └── chainlink/       # CRE workflow + NAVOracle.sol (EVM)
├── circuits/            # Noir ZK circuits (Garaga proofs)
└── docs/                # Architecture docs, integration guides, plans
```

**Three user roles:**
- **Investor** — Browse lots, buy shares, P2P trade, view portfolio
- **Producer** — Create lots, add traceability updates, settle
- **Admin** — Approve producers, manage lots, oversee settlements

---

## Quickstart

### Prerequisites

- [Node.js ≥ 22](https://nodejs.org/) and [Yarn](https://yarnpkg.com/)
- [Starkup](https://github.com/software-mansion/starkup) (installs Scarb, snforge, starknet-devnet)
- PostgreSQL

### Setup

```bash
yarn install
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your DATABASE_URL and Starknet operator keys
```

### Run locally

```bash
# Terminal 1 — Starknet devnet
yarn chain

# Terminal 2 — Backend API (port 3001)
yarn backend:dev

# Terminal 3 — Frontend (port 3000)
yarn start
```

### Deploy contracts (optional)

```bash
yarn deploy                      # to devnet
yarn deploy --network sepolia    # to Sepolia testnet
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | System design, data flows, DB schema |
| [Client ↔ Backend Guide](./docs/CLIENT_BACKEND_INSTRUCTIONS.md) | API integration patterns (Zod + TanStack Query) |
| [Frontend Architecture](./packages/nextjs/ARCHITECTURE.md) | Route structure, state management, design tokens |
| [Backend Architecture](./packages/backend/ARCHITECTURE.md) | Module design, custody model, on-chain sync |
| [Chainlink CRE Demo](./docs/chainlink-cre-demo.md) | NAV oracle walkthrough and deployment |
| [On-chain Spec](./packages/snfoundry/PROJECT_SPEC.MD) | Smart contract specifications |

---

## License

[MIT](./LICENSE)
