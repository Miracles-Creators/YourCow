# Backend Architecture

## Overview

NestJS backend for YourCow Protocol - a livestock tokenization platform on Starknet. Handles off-chain business logic and orchestrates on-chain smart contract interactions.

## Tech Stack

- **Framework:** NestJS 10.x + TypeScript
- **Database:** PostgreSQL + Prisma 7.x
- **Blockchain:** Starknet (starknet.js 8.x)
- **Validation:** Zod
- **Testing:** Vitest + Supertest

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── health.controller.ts       # Health check endpoint
│
├── database/
│   ├── prisma.module.ts       # Global Prisma module
│   └── prisma.service.ts      # Database connection
│
├── starknet/
│   ├── core/
│   │   ├── starknet.module.ts # Global Starknet module
│   │   └── starknet.service.ts# Provider, accounts, contract factory
│   ├── config/
│   │   └── deployed-contracts.ts # Contract ABIs & addresses
│   └── types/
│       └── index.ts           # On-chain type definitions
│
└── modules/
    ├── core/                  # Database-first business logic
    │   ├── producers/         # Feedlot operators
    │   ├── lots/              # Investment lots
    │   ├── animals/           # Livestock tracking
    │   ├── investors/         # Investor profiles
    │   ├── payments/          # Payment records
    │   └── settlements/       # Lot liquidations
    │
    └── onchain/               # Smart contract interactions
        ├── lot-factory/       # Lot creation & management
        ├── animal-registry/   # Animal registration
        ├── lot-shares-token/  # ERC20 share tokens
        ├── settlement-registry/
        └── traceability-oracle/
```

## Architecture Pattern

Two-tier module separation:

```
┌─────────────────────────────────────────────────────────┐
│                     API Layer                            │
│              Controllers (REST endpoints)                │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│    Core Modules      │       │   On-chain Modules   │
│   (DB operations)    │       │ (Contract calls)     │
│                      │       │                      │
│  - ProducersService  │       │  - LotFactoryService │
│  - LotsService       │◄─────►│  - AnimalRegistry    │
│  - AnimalsService    │       │  - LotSharesToken    │
│  - PaymentsService   │       │  - SettlementRegistry│
└──────────────────────┘       └──────────────────────┘
          │                               │
          ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│      PostgreSQL      │       │      Starknet        │
│      (Prisma)        │       │    (RPC Provider)    │
└──────────────────────┘       └──────────────────────┘
```

## Data Flow Example: Create & Deploy Lot

```
1. POST /api/lots
   └─► LotsService.createLot()
       └─► Prisma: Insert lot (status: DRAFT)

2. POST /api/lots/:id/approve
   └─► LotsService.approveAndDeployLot()
       ├─► Prisma: Update status → PENDING_DEPLOY
       ├─► LotFactoryService.createLot()
       │   └─► Starknet: Call contract, wait for tx
       └─► Prisma: Update with onChainLotId, tokenAddress
           status → FUNDING
```

## Key Design Decisions

1. **DB-first approach:** Records created in PostgreSQL before on-chain deployment
2. **Global modules:** PrismaModule and StarknetModule available everywhere
3. **Status machines:** Explicit state transitions (DRAFT → FUNDING → ACTIVE → COMPLETED)
4. **Dual accounts:** Protocol Operator (main signer) + Attestor (traceability only)

## Database Schema (Main Entities)

| Entity | Purpose | On-chain Reference |
|--------|---------|-------------------|
| Producer | Feedlot operator | walletAddress |
| Lot | Investment vehicle | onChainLotId, tokenAddress |
| Animal | Individual livestock | onChainId |
| Investor | Capital provider | walletAddress |
| Payment | Investment transaction | txHash |
| Settlement | Lot liquidation | onChainTxHash |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/producers | Create producer |
| GET | /api/producers | List producers |
| POST | /api/lots | Create lot (DRAFT) |
| GET | /api/lots | List lots |
| POST | /api/lots/:id/deploy | Manual deploy |
| POST | /api/lots/:id/approve | Approve & auto-deploy |
| POST | /api/animals | Register animal |
| POST | /api/investors | Create investor |
| POST | /api/payments | Record payment |
| POST | /api/settlements | Create settlement |

## Environment Variables

```env
PORT=3001
DATABASE_URL="postgresql://..."
STARKNET_NETWORK=devnet|sepolia|mainnet
STARKNET_RPC_URL="http://..."
PROTOCOL_OPERATOR_PRIVATE_KEY="0x..."
PROTOCOL_OPERATOR_ADDRESS="0x..."
ATTESTOR_PRIVATE_KEY="0x..."      # Optional
ATTESTOR_ADDRESS="0x..."          # Optional
```

## Testing

```bash
yarn test           # Run controller tests
yarn test:watch     # Watch mode
yarn test:coverage  # With coverage report
```

Test structure:
```
test/
├── setup.ts                      # Global test config
├── controller/
│   └── lots.controller-spec.ts   # Controller tests with mocks
└── mocks/
    ├── prisma.mock.ts            # In-memory Prisma mock
    └── onchain.mock.ts           # Starknet service mocks
```
