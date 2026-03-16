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

**Chainlink usage (code links):**
- CRE workflow entry point (fetch + compute + on-chain writes): [packages/chainlink/cre/main.ts](https://github.com/Gianfranco99/your-cow/blob/main/packages/chainlink/cre/main.ts)
- Market-data fetchers (MAGyP, SIOCarnes, BCRA): [packages/chainlink/cre/fetchers.ts](https://github.com/Gianfranco99/your-cow/blob/main/packages/chainlink/cre/fetchers.ts)
- NAV calculation logic: [packages/chainlink/cre/nav.ts](https://github.com/Gianfranco99/your-cow/blob/main/packages/chainlink/cre/nav.ts)
- Sepolia contract written by CRE: [packages/chainlink/contracts/NAVOracle.sol](https://github.com/Gianfranco99/your-cow/blob/main/packages/chainlink/contracts/NAVOracle.sol)
- Sepolia -> Starknet relay service: [packages/backend/src/modules/onchain/nav-relay/nav-relay.service.ts](https://github.com/Gianfranco99/your-cow/blob/main/packages/backend/src/modules/onchain/nav-relay/nav-relay.service.ts)
- CRE workflow config/targets: [packages/chainlink/cre/workflow.yaml](https://github.com/Gianfranco99/your-cow/blob/main/packages/chainlink/cre/workflow.yaml), [packages/chainlink/project.yaml](https://github.com/Gianfranco99/your-cow/blob/main/packages/chainlink/project.yaml)

### 🔒 Tongo — Private P2P Transfers

Privacy-preserving secondary market using **ElGamal encryption** on Starknet. Transfer amounts are encrypted on-chain — only buyer and seller know the traded value. The platform manages custodial Tongo keys (AES-256-GCM encrypted per user) and executes private transfers server-side via an operator account.

### 🛡️ Garaga — Zero-Knowledge Proofs

ZK proof of funding threshold ("this lot raised ≥ X% of its target") without revealing investor counts or exact amounts. Built with **Noir circuits** compiled to Ultra Honk proofs, verified on-chain via a Garaga Cairo verifier.

### 🔍 ZK and Privacy in This Project

- ZK (Noir + bb + Garaga) is used on Starknet for fundraising-threshold proofs in the Garaga module.
- Tongo is used for privacy-preserving share transfers on Starknet.
- Chainlink CRE uses `ConfidentialHTTPClient` to fetch private lot/business data securely.

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

## Deployed Contracts (Sepolia)

### Starknet Sepolia

| Contract | Address |
|----------|---------|
| LotFactory | `0x171abbecb4fc412c2f8dda0eda615a451e5e31acb89d5f0c9e07defec8a98e1` |
| AnimalRegistry | `0x7fd8598f277634aee30524c6540acb1c560dcc2d630144b822dd144b65ace1c` |
| TraceabilityOracle | `0x622f73ebbe4275b61c7fed100adb5c9076443761488db022b52278cc21d2974` |
| SettlementRegistry | `0x46d47b577c35927d6cce8dc31813a1f53b9f1179417c03788fe132cf3414b1c` |
| AuditRegistry | `0x21cdc5c65f5d53d3b0c39002182ad5de2666affbaba82eb45e7d38ee738b213` |
| NavOracle | `0x13041e92b146f9d7c91897122b52473262ba4f687ee8ae49e529af0a6830b9` |
| Tongo (STRK) | `0x408163bfcfc2d76f34b444cb55e09dace5905cf84c0884e4637c2c0f06ab6ed` |

### EVM Sepolia

| Contract | Address |
|----------|---------|
| NAVOracle.sol | `0x2fE73aAa0132100C6f78e6Cb4ea101c279581286` |

> To switch between devnet and Sepolia, flip `ENVIRONMENT` in `packages/backend/.env` and `NEXT_PUBLIC_ENVIRONMENT` in `packages/nextjs/.env` to `"sepolia"`.

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
