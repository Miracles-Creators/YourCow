# Backend Architecture

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | NestJS | 10.x |
| Language | TypeScript (strict) | 5.x |
| Database | PostgreSQL + Prisma | 7.x |
| Blockchain | starknet.js | 8.5.3 |
| EVM bridge | viem | 2.x |
| Validation | Zod (DTOs use class-based) | 3.x |
| Privacy layer | @fatsolutions/tongo-sdk | 1.3.1 |
| ZK proofs | garaga | 1.0.1 |
| Testing | Vitest + Supertest | 4.x |

---

## Folder Structure

```
packages/backend/
├── src/
│   ├── main.ts                         # Bootstrap: CORS, /api prefix, port 3001
│   ├── app.module.ts                   # Root module — imports all modules
│   ├── health.controller.ts            # GET /health (no /api prefix)
│   │
│   ├── database/
│   │   ├── prisma.module.ts            # @Global() PrismaModule
│   │   └── prisma.service.ts           # PrismaClient wrapper (PrismaPg adapter)
│   │
│   ├── starknet/
│   │   ├── core/
│   │   │   ├── starknet.module.ts      # @Global() StarknetModule
│   │   │   └── starknet.service.ts     # Provider, operator/attestor accounts, contract factory
│   │   ├── config/
│   │   │   ├── deployed-contracts.ts   # Contract addresses + ABIs per network
│   │   │   └── external-contracts.ts   # External contract configs
│   │   ├── types/
│   │   │   └── index.ts               # On-chain type definitions
│   │   └── index.ts                    # Barrel export
│   │
│   ├── utils/
│   │   ├── bigint.ts                   # toBigInt helper
│   │   └── hash.ts                     # hashObject (Poseidon/SHA256)
│   │
│   └── modules/
│       ├── core/                       # Business logic modules (DB-first)
│       │   ├── index.ts               # Barrel export for all core modules
│       │   ├── auth/                  # Authentication
│       │   ├── admins/                # Admin user management
│       │   ├── investors/             # Investor profiles
│       │   ├── producers/             # Producer (feedlot) profiles
│       │   ├── lots/                  # Investment lots
│       │   ├── animals/               # Livestock tracking
│       │   ├── payments/              # Fiat payment records
│       │   ├── settlements/           # Lot liquidations
│       │   ├── ledger/                # Double-entry accounting
│       │   ├── custody/               # Balance/account management
│       │   ├── marketplace/           # P2P trading
│       │   └── audit/                 # Audit trail anchoring
│       │
│       └── onchain/                    # Smart contract interaction modules
│           ├── index.ts               # Barrel export for all onchain modules
│           ├── lot-factory/           # Lot creation on-chain
│           ├── animal-registry/       # Animal registration on-chain
│           ├── lot-shares-token/      # ERC20 share tokens per lot
│           ├── settlement-registry/   # Settlement anchoring
│           ├── traceability-oracle/   # Traceability data anchoring
│           ├── tongo/                 # Confidential payments (Tongo SDK)
│           ├── nav-relay/             # NAV oracle relay (EVM → Starknet)
│           ├── audit-registry/        # Ledger audit anchoring
│           └── garaga/                # ZK proof generation/verification
│
├── prisma/
│   ├── schema.prisma                  # Database schema (single file)
│   └── migrations/                    # Prisma migrations
│
├── test/                              # Tests
├── scripts/                           # Utility scripts
└── package.json
```

---

## Core Patterns

### 1. Two-Tier Module Architecture

Modules are split into two categories:

```
┌──────────────────────────────────────────┐
│              REST Controllers            │
│         (all under /api prefix)          │
└────────────────┬─────────────────────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
┌──────────────┐    ┌──────────────────┐
│ Core Modules │    │ On-chain Modules  │
│ (DB first)   │◄──►│ (Contract calls)  │
│              │    │                   │
│ producers    │    │ lot-factory       │
│ lots         │    │ animal-registry   │
│ animals      │    │ lot-shares-token  │
│ payments     │    │ settlement-reg.   │
│ settlements  │    │ traceability-orc. │
│ marketplace  │    │ tongo             │
│ ledger       │    │ nav-relay         │
│ custody      │    │ audit-registry    │
│ audit        │    │ garaga            │
│ auth         │    │                   │
│ admins       │    │                   │
│ investors    │    │                   │
└──────────────┘    └──────────────────┘
       │                     │
       ▼                     ▼
  PostgreSQL            Starknet RPC
   (Prisma)            (starknet.js)
```

**Core modules** own the database and business logic. They call on-chain modules when needed.
**On-chain modules** are thin wrappers around smart contract calls. They never access the DB directly.

### 2. Module Structure (Standard Pattern)

Every module follows this exact structure:

```
modules/core/<domain>/
├── <domain>.module.ts         # NestJS module definition
├── <domain>.controller.ts     # REST endpoints
├── <domain>.service.ts        # Business logic
└── dto/
    └── <domain>.dto.ts        # Request DTOs (class-based with ! assertions)
```

**Module file**:
```tsx
@Module({
  imports: [LotFactoryModule],        // Import on-chain modules if needed
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService],             // Always export service for cross-module use
})
export class LotsModule {}
```

**Controller** — thin, delegates to service:
```tsx
@Controller("lots")
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  async createLot(@Body() body: CreateLotDto) {
    return this.lotsService.createLot(body);
  }

  @Get()
  async listLots() {
    return this.lotsService.listLots();
  }

  @Get(":id")
  async getLotById(@Param("id") id: string) {
    return this.lotsService.getLotById(Number(id));
  }
}
```

**Service** — all business logic, DB access, orchestration:
```tsx
@Injectable()
export class LotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lotFactoryService: LotFactoryService,
  ) {}

  async createLot(data: CreateLotDto): Promise<Lot> {
    return this.prisma.lot.create({ data: { ... } });
  }
}
```

**DTO** — class-based with `!` assertions (NestJS convention):
```tsx
export class CreateLotDto {
  producerId!: number;
  name!: string;
  description!: string;
  farmName!: string;
  location!: string;
  productionType!: ProductionType;
  cattleCount!: number;
  // Optional fields use ?
  notes?: string;
  startDate?: string;
}
```

### 3. On-chain Module Structure

```
modules/onchain/<contract>/
├── <contract>.module.ts       # NestJS module definition
├── <contract>.service.ts      # Contract interaction methods
├── <contract>.controller.ts   # REST endpoints (optional — some are service-only)
└── dto/
    └── <contract>.dto.ts      # Request DTOs
```

**On-chain service pattern**:
```tsx
@Injectable()
export class LotFactoryService {
  private contract!: Contract;

  constructor(private starknetService: StarknetService) {}

  // Lazy initialization
  private getContract(): Contract {
    if (!this.contract) {
      this.contract = this.starknetService.getContract("LotFactory");
    }
    return this.contract;
  }

  // Write operations use operator account (default)
  async createLot(params: CreateLotParams): Promise<{ transactionHash: string; lotId: bigint }> {
    const contract = this.getContract();
    const tx = await contract.create_lot(...);
    const receipt = await this.starknetService.getProvider().waitForTransaction(tx.transaction_hash);
    return { transactionHash: tx.transaction_hash, lotId: ... };
  }

  // Read operations use provider (no signing)
  async getLot(lotId: bigint): Promise<Lot> {
    const contract = this.starknetService.getContractReadOnly("LotFactory");
    return contract.get_lot(cairo.uint256(lotId));
  }
}
```

### 4. Global Modules

Two modules are `@Global()` — available everywhere without explicit import:

**PrismaModule** (`database/prisma.module.ts`):
- Provides `PrismaService` (extends `PrismaClient`)
- Uses `PrismaPg` adapter for PostgreSQL
- Auto-connects on init, auto-disconnects on destroy

**StarknetModule** (`starknet/core/starknet.module.ts`):
- Provides `StarknetService`
- Manages RPC provider, operator account, attestor account
- Network selected via `ENVIRONMENT` env var (`devnet` | `sepolia`)
- Key methods:
  - `getProvider()` — RPC provider for reads
  - `getOperatorAccount()` — signing account for writes
  - `getAttestorAccount()` — separate account for traceability
  - `getContract(name)` — returns Contract instance with operator signer
  - `getContractReadOnly(name)` — returns Contract instance with provider only
  - `getContractAtAddress(abi, address)` — for dynamic contracts (e.g., per-lot tokens)
  - `executeTransaction(txPromise)` — submit + wait pattern

### 5. DB-First Pattern

**Every state change follows this flow**:

```
1. Write to PostgreSQL (status: PENDING/DRAFT)
2. Submit on-chain transaction
3. Wait for confirmation
4. Update PostgreSQL (status: SYNCED, + txHash, onChainId, etc.)
5. If tx fails → rollback DB status (or set FAILED)
```

On-chain sync statuses: `PENDING` → `SYNCING` → `SYNCED` | `FAILED`

Example from `LotsService.approveAndDeployLot()`:
```tsx
// 1. Update DB to PENDING_DEPLOY
await this.prisma.lot.update({ data: { status: LotStatus.PENDING_DEPLOY } });

// 2. Deploy on-chain
try {
  const result = await this.lotFactoryService.createLot({ ... });
  // 3. Update DB with on-chain data
  await this.prisma.lot.update({ data: { status: LotStatus.FUNDING, onChainLotId: ..., txHash: ... } });
} catch (error) {
  // 4. Rollback on failure
  await this.prisma.lot.update({ data: { status: LotStatus.DRAFT } });
  throw error;
}
```

### 6. Authentication Pattern

**AuthGuard** (`modules/core/auth/auth.guard.ts`):
- Implements `CanActivate`
- Extracts user from request headers via `AuthService.getUserFromRequest()`
- Sets `request.user` for downstream use
- Throws `UnauthorizedException` if not authenticated

**AuthenticatedRequest** type extends Express Request with `user` field.

**API key auth** (for oracle/external access):
```tsx
@Get("oracle")
async getActiveLotsForOracle(@Req() req: Request) {
  const apiKey = req.headers["x-api-key"];
  if (!expected || apiKey !== expected) throw new UnauthorizedException();
  return this.lotsService.getActiveLotsForOracle();
}
```

### 7. Logging

Use NestJS `Logger` — NEVER `console.log`:
```tsx
private readonly logger = new Logger(LotsService.name);
this.logger.log(`Initialized on ${this.network}`);
this.logger.warn("Operator keys not set");
```

### 8. Error Handling

Use NestJS built-in exceptions:
- `NotFoundException` — resource not found
- `BadRequestException` — invalid input or business rule violation
- `UnauthorizedException` — auth failure

```tsx
const lot = await this.prisma.lot.findUnique({ where: { id } });
if (!lot) throw new NotFoundException("Lot not found");
if (lot.status !== LotStatus.DRAFT) throw new BadRequestException("Lot is not pending approval");
```

---

## Database Schema Overview

### Schema Design Principles
1. **DB is source of truth** for business state
2. **On-chain = integrity**, off-chain = storage and business logic
3. **All on-chain references stored as strings** (felt252, u256 → string)
4. **Audit trail is append-only** (no deletions, only status changes)
5. **Write DB first**, then submit on-chain tx, then update DB with result

### Entity Groups

**Users & Roles**:
- `User` — id, role (INVESTOR/PRODUCER/ADMIN), email, walletAddress, status
- `KycProfile` — 1:1 with User, KYC provider reference
- `ProducerProfile` — 1:1 with User (PRODUCER only), senasaId, approval workflow

**Lots & Animals**:
- `Lot` — investment vehicle (herd data, financing terms, on-chain sync)
- `LotDocument` — uploaded files (ownership, insurance, video)
- `Animal` — individual livestock (EID, weight, profile, on-chain sync)
- `TraceabilityEvent` — off-chain events (weighing, vaccination, etc.)
- `TraceAnchor` — on-chain anchored roots

**Investments**:
- `Payment` — fiat payment + on-chain mint intent
- `Settlement` — lot liquidation (final proceeds, weight stats)

**P2P Marketplace** (double-entry accounting):
- `Account` — user trading account (TRADING/FEES_COLLECTED/PROTOCOL_VAULT)
- `Balance` — per-account per-asset balances (available + locked)
- `Offer` — sell offers (LOT_SHARES, priced in STRK)
- `Trade` — completed buy transactions
- `LedgerEntry` — double-entry accounting records
- `PrimaryPurchase` — direct lot share purchases

**Tongo (Privacy)**:
- `TongoAccount` — encrypted private keys per user
- `TongoDeposit` — STRK deposit records

**Audit**:
- `AuditBatch` — ledger hash anchored on-chain

### Key Enums

```
LotStatus:     DRAFT → PENDING_DEPLOY → FUNDING → ACTIVE → SETTLING → COMPLETED
OfferStatus:   OPEN → PARTIALLY_FILLED → FILLED | CANCELLED
TradeStatus:   PENDING → TONGO_SETTLED → COMPLETED | FAILED
OnChainSync:   PENDING → SYNCING → SYNCED | FAILED
UserRole:      INVESTOR | PRODUCER | ADMIN
```

---

## Adding a New Feature — Step by Step

### New Core Module (business logic + DB)

1. **Create folder**: `src/modules/core/<domain>/`
2. **Create DTO**: `dto/<domain>.dto.ts` (class-based, `!` assertions for required fields)
3. **Create service**: `<domain>.service.ts` (inject `PrismaService`, add business logic)
4. **Create controller**: `<domain>.controller.ts` (thin, delegate to service)
5. **Create module**: `<domain>.module.ts` (import dependencies, export service)
6. **Register in app.module.ts**: add to imports array
7. **Add barrel export**: add to `modules/core/index.ts`

### New On-chain Module (contract interaction)

1. **Add contract to deployed-contracts.ts**: address + ABI for each network
2. **Create folder**: `src/modules/onchain/<contract>/`
3. **Create service**: `<contract>.service.ts` (inject `StarknetService`, lazy-init contract)
4. **Create module**: `<contract>.module.ts` (export service)
5. **Create controller** (optional): only if direct API access needed
6. **Register in app.module.ts**: add to imports array
7. **Add barrel export**: add to `modules/onchain/index.ts`

### New Prisma Model

1. **Add model to `prisma/schema.prisma`**
2. **Run migration**: `yarn db:migrate` (creates migration file)
3. **Generate client**: `yarn db:generate`
4. Use via `this.prisma.<model>.create/findMany/update/etc.`

### New Endpoint on Existing Module

1. **Add DTO** if needed (new class in `dto/` folder)
2. **Add service method** with business logic
3. **Add controller method** with decorator (`@Get`, `@Post`, etc.)
4. Controller method delegates to service — no logic in controller

### Cross-Module Communication

Core module needs another core module's service:
```tsx
// lots.module.ts
@Module({
  imports: [LotFactoryModule],   // Import the module
  providers: [LotsService],
})
```
```tsx
// lots.service.ts
constructor(
  private readonly prisma: PrismaService,          // Global — no import needed
  private readonly lotFactoryService: LotFactoryService,  // From imported module
) {}
```

No need to import `PrismaModule` or `StarknetModule` — they're `@Global()`.

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Module files | kebab-case | `lot-factory.module.ts` |
| Service files | kebab-case | `lot-factory.service.ts` |
| Controller files | kebab-case | `lots.controller.ts` |
| DTO files | kebab-case | `lots.dto.ts` |
| Class names | PascalCase | `LotsService`, `CreateLotDto` |
| Controller paths | kebab-case | `@Controller("lots")` |
| Database models | PascalCase | `model Lot { }` |
| Enums | PascalCase | `enum LotStatus { }` |
| Folders | kebab-case | `lot-factory/`, `animal-registry/` |

---

## API Conventions

- **Global prefix**: `/api` (except `/health`)
- **REST verbs**: GET (list/read), POST (create/action), PUT/PATCH (update), DELETE (remove)
- **ID params**: `@Param("id") id: string` → `Number(id)` in controller
- **Response**: return Prisma model directly (serialized as JSON)
- **Errors**: throw NestJS exceptions (NotFoundException, BadRequestException)
- **CORS**: configured in `main.ts`, origin from `CORS_ORIGIN` env var

---

## Environment Variables

```env
PORT=3001                                    # Server port
DATABASE_URL="postgresql://..."              # PostgreSQL connection
CORS_ORIGIN="http://localhost:3000"          # Frontend URL

# Starknet
ENVIRONMENT=devnet|sepolia                   # Network selector (single switch)
STARKNET_RPC_DEVNET="http://127.0.0.1:5050/rpc"
STARKNET_RPC_SEPOLIA="https://api.cartridge.gg/x/starknet/sepolia"
PROTOCOL_OPERATOR_PRIVATE_KEY="0x..."        # Devnet operator
PROTOCOL_OPERATOR_ADDRESS="0x..."
SEPOLIA_OPERATOR_PRIVATE_KEY="0x..."         # Sepolia operator
SEPOLIA_OPERATOR_ADDRESS="0x..."
ATTESTOR_PRIVATE_KEY="0x..."                 # Traceability signer (optional)
ATTESTOR_ADDRESS="0x..."

# External
ORACLE_API_KEY="..."                         # API key for oracle endpoints
```

---

## Validation Commands

```bash
yarn dev              # Dev server with --watch (nest start --watch)
yarn build            # Production build (nest build)
yarn start            # Production run (node dist/main.js)
yarn lint             # ESLint
yarn lint:fix         # ESLint with auto-fix
yarn test             # Vitest
yarn test:watch       # Vitest watch mode
yarn db:generate      # Prisma generate client
yarn db:push          # Push schema (no migration)
yarn db:migrate       # Create + apply migration
yarn db:studio        # Prisma Studio GUI
```

---

## Anti-Patterns — NEVER Do These

| Anti-Pattern | Correct Pattern |
|-------------|----------------|
| Put business logic in controllers | Controllers are thin — delegate to service |
| Access DB from on-chain modules | On-chain modules only talk to contracts |
| Use `console.log` | Use NestJS `Logger` |
| Import PrismaModule in a module | It's `@Global()` — already available |
| Import StarknetModule in a module | It's `@Global()` — already available |
| Submit on-chain tx without DB record first | DB-first: write record, then tx, then update |
| Create service without exporting it | Always `exports: [Service]` in module |
| Put multiple domains in one module | One domain per module folder |
| Use default exports | Use named exports everywhere |
| Put types in a separate `types/` folder | DTOs go in module's `dto/` folder; Prisma types auto-generated |
| Skip error handling on on-chain calls | Always try/catch with DB rollback |
| Forget to register module in app.module.ts | Every new module must be imported in AppModule |
