# YourCow - Contract Documentation

Last updated: 2026-01-29

## Closed decisions (2026-01-26)
- Issuer role: API only (no on-chain wallet) for MVP.
- Animal ID: composite u256 (see constants.cairo).
- Anchoring frequency: every 24h + manual trigger for critical events (off-chain).
- Payment gateways: Stripe + MercadoPago (off-chain).
- KYC: basic for MVP (email + name), full KYC later.

## Overview

YourCow is a protocol that tokenizes **cattle lots** for retail investors while maintaining **per-animal traceability** verifiable on-chain. The system is composed of 6 main contracts that work together.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           YourCow PROTOCOL                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────────┐         ┌────────────────┐  │
│   │  LotFactory  │────────▶│  LotSharesToken  │◀────────│  Settlement    │  │
│   │              │ creates │    (ERC20)       │ freezes │   Registry     │  │
│   └──────────────┘         └──────────────────┘         └────────────────┘  │
│          │                          ▲                           │           │
│          │                          │ snapshot                  │           │
│          │                          │ balances                  │           │
│          │                          │                           │           │
│          ▼                          │                           ▼           │
│   ┌──────────────┐                  │                  ┌────────────────┐  │
│   │   Animal     │                  │                  │  Traceability  │  │
│   │   Registry   │──────────────────┘                  │    Oracle      │  │
│   │  (ERC721)    │                                     └────────────────┘  │
│   └──────────────┘                                              │           │
│          │                                                      │           │
│          └──────────────────────────────────────────────────────┘           │
│                              per-animal traceability                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Note: AuditRegistry anchors off-chain ledger batches for integrity verification.
```

---

## System Roles

| Role | Description | Permissions |
|-----|-------------|-------------|
| **Protocol Admin** | Protocol administrator (owner) | Configure roles, pause, upgrades |
| **Protocol Operator** | Backend/signing service | Create lots, register animals, mint shares, change states |
| **Attestor** | Traceability oracle | Anchor traceability roots |
| **Producer/Feedlot** | Animal custodian | Assigned as custodian (no on-chain permissions) |
| **Investor** | Investor | Buy/transfer ERC20 shares |

---

## Contracts

### 1. LotFactory

**File:** `lot_factory.cairo`

**Purpose:** Create lots and manage mapping to ERC20 tokens.

#### Data Structure

```cairo
struct Lot {
    issuer: ContractAddress,          // Producer/Feedlot issuer
    status: u8,                       // State: Active(1), Paused(2), Settled(3), Funded(4)
    total_shares: u256,               // Total shares available
    initial_price_per_share: u256,    // Initial price per share (smallest unit, e.g. cents)
    metadata_hash: felt252,           // Poseidon hash of off-chain metadata
    created_at: u64,                  // Creation timestamp
    total_initial_weight_grams: u32,  // Total initial weight (grams)
    total_current_weight_grams: u32,  // Total current weight (grams)
}
```

#### Functions

| Function | Type | Description | Access |
|---------|------|-------------|--------|
| `get_lot(lot_id)` | View | Get full lot data | Public |
| `get_lot_status(lot_id)` | View | Get lot status only | Public |
| `get_initial_price_per_share(lot_id)` | View | Get initial price per share | Public |
| `get_shares_token(lot_id)` | View | Get ERC20 token address | Public |
| `get_next_lot_id()` | View | Get next available ID | Public |
| `get_protocol_operator()` | View | Get operator address | Public |
| `get_settlement_registry()` | View | Get SettlementRegistry address | Public |
| `get_shares_token_class_hash()` | View | Get token class hash for deploy | Public |
| `create_lot(issuer, total_shares, initial_price_per_share, metadata_hash, token_name, token_symbol)` | Write | Create a new lot and deploy its ERC20 token | Operator only |
| `set_lot_status(lot_id, new_status)` | Write | Change lot status | See note* |
| `set_lot_initial_weight(lot_id, weight_grams)` | Write | Set initial total lot weight (grams) | Operator only |
| `set_lot_current_weight(lot_id, weight_grams)` | Write | Set current total lot weight (grams) | Operator only |
| `set_protocol_operator(new_operator)` | Admin | Change protocol operator | Owner only |
| `set_settlement_registry(settlement_registry)` | Admin | Configure SettlementRegistry | Owner only |
| `set_shares_token_class_hash(class_hash)` | Admin | Configure class hash for token deploy | Owner only |
| `get_lot_initial_weight(lot_id)` | View | Get initial total lot weight (grams) | Public |
| `get_lot_current_weight(lot_id)` | View | Get current total lot weight (grams) | Public |
| `get_lot_weight_gain(lot_id)` | View | Get weight gain (current - initial) | Public |

**
*Permissions for `set_lot_status`:
- **Protocol Operator**: may change to any valid state
- **LotSharesToken**: may only change to FUNDED (auto when 100% minted)
- **SettlementRegistry**: may only change to SETTLED (during settlement)

#### Events

- `LotCreated`: Emitted when a lot is created (includes `shares_token` address)
- `LotStatusChanged`: Emitted when a lot status changes
- `LotWeightUpdated`: Emitted when lot weight is updated
- `ProtocolOperatorUpdated`: Emitted when operator changes
- `SettlementRegistryUpdated`: Emitted when settlement registry changes

#### Factory Pattern (Internal Deploy)

LotFactory uses `deploy_syscall` to deploy a `LotSharesToken` contract per lot. This guarantees:
- **Atomicity**: lot and token are created in the same transaction
- **Consistency**: `lot_id` is known before deploying the token
- **Determinism**: token address is predictable (salt = lot_id)

**Required configuration**: before creating lots, the Owner must set `set_shares_token_class_hash()` with the class hash for `LotSharesToken`.

#### State Transitions

```
ACTIVE ──────▶ FUNDED (auto) ──────▶ SETTLED
   │              │                      ▲
   │              └───▶ PAUSED ──────────┤
   │                                     │
   └───▶ PAUSED ─────────────────────────┘

   FUNDED: automatic when 100% of shares are minted
   SETTLED: final state, no return
   FUNDED → ACTIVE: not allowed (cannot “un-fund”)
```

---

### 2. LotSharesToken (ERC20)

**File:** `lot_shares_token.cairo`

**Purpose:** ERC20 token representing shares of a specific lot.

#### Characteristics

- One token per lot (individual deploy)
- 18 decimals (standard)
- Minting controlled by Protocol Operator
- Transfers allowed while lot is Active or Funded (and not frozen)

#### Standard ERC20 Functions

| Function | Type | Description |
|---------|------|-------------|
| `name()` | View | Token name |
| `symbol()` | View | Token symbol |
| `decimals()` | View | Decimals (18) |
| `total_supply()` | View | Total supply |
| `balance_of(account)` | View | Account balance |
| `allowance(owner, spender)` | View | Allowance between accounts |
| `transfer(recipient, amount)` | Write | Transfer tokens (blocked if frozen) |
| `transfer_from(sender, recipient, amount)` | Write | Transfer with allowance |
| `approve(spender, amount)` | Write | Approve allowance |

#### Custom Functions

| Function | Type | Description | Access |
|---------|------|-------------|--------|
| `lot_id()` | View | Associated lot ID | Public |
| `lot_factory()` | View | LotFactory address | Public |
| `protocol_operator()` | View | Operator address | Public |
| `settlement_registry()` | View | SettlementRegistry address | Public |
| `is_frozen()` | View | Whether transfers are frozen | Public |
| `total_shares()` | View | Max shares that can be minted | Public |
| `is_fully_funded()` | View | Whether 100% of shares were minted | Public |
| `mint(to, amount)` | Write | Mint new tokens (auto-FUNDED at 100%) | Operator only (if not frozen) |
| `freeze()` | Write | Freeze transfers | Operator or SettlementRegistry |
| `set_settlement_registry(settlement_registry)` | Admin | Configure SettlementRegistry | Operator only |

**Notes:**
- When `mint()` reaches 100% of `total_shares`, the lot status automatically changes to FUNDED in LotFactory.
- `freeze()` can be called by Protocol Operator or SettlementRegistry (during settlement).

#### Events

- `Transfer`: Standard ERC20 transfer
- `Approval`: Standard ERC20 approval
- `SharesMinted`: When new shares are minted
- `TokenFrozen`: When the token is frozen

---

### 3. AnimalRegistry (ERC721-like)

**File:** `animal_registry.cairo`

**Purpose:** Unique identity and lifecycle tracking for each animal.

#### Data Structure

```cairo
struct Animal {
    custodian: ContractAddress,   // Current custodian (producer/feedlot)
    status: u8,                   // Alive(1), Sold(2), Deceased(3), Removed(4)
    current_lot_id: u256,         // 0 if not assigned to any lot
    profile_hash: felt252,        // Poseidon hash of off-chain profile
    created_at: u64,              // Registration timestamp
    initial_weight_grams: u32,    // Initial weight at registration (grams)
}
```

#### Functions

| Function | Type | Description | Access |
|---------|------|-------------|--------|
| `get_animal(animal_id)` | View | Get full animal data | Public |
| `get_custodian(animal_id)` | View | Get current custodian | Public |
| `get_animal_status(animal_id)` | View | Get animal status | Public |
| `get_current_lot(animal_id)` | View | Get assigned lot | Public |
| `get_lot_animal_count(lot_id)` | View | Animal count in a lot | Public |
| `animal_exists(animal_id)` | View | Check if exists | Public |
| `owner_of(token_id)` | View | ERC721: token owner | Public |
| `balance_of(owner)` | View | ERC721: owner balance | Public |
| `register_animal(animal_id, custodian, profile_hash, initial_weight_grams)` | Write | Register a new animal | Operator only |
| `register_animal_batch(animals_with_weights, custodians, profile_hashes)` | Write | Register multiple animals | Operator only |
| `assign_to_lot(animal_id, lot_id)` | Write | Assign animal to lot | Operator only |
| `assign_to_lot_batch(animal_ids, lot_id)` | Write | Assign multiple animals to a lot | Operator only |
| `remove_from_lot(animal_id)` | Write | Remove animal from lot | Operator only |
| `remove_from_lot_batch(animal_ids)` | Write | Remove multiple animals from lots | Operator only |
| `set_animal_status(animal_id, new_status)` | Write | Change animal status | Operator only |
| `set_animal_status_batch(animal_ids, new_status)` | Write | Change status of multiple animals | Operator only |
| `transfer_custody(animal_id, new_custodian)` | Write | Transfer custody | Operator only |
| `set_protocol_operator(new_operator)` | Admin | Change operator | Owner only |
| `set_lot_factory(new_lot_factory)` | Admin | Set LotFactory reference | Owner only |
| `get_protocol_operator()` | View | Get operator address | Public |
| `get_lot_factory()` | View | Get LotFactory address | Public |
| `get_animal_initial_weight(animal_id)` | View | Get initial weight (grams) | Public |

#### Events

- `AnimalRegistered`: Animal registered
- `AnimalAssigned`: Animal assigned to lot
- `AnimalRemoved`: Animal removed from lot
- `AnimalStatusChanged`: Animal status changed
- `CustodyTransferred`: Custody transferred

#### Business Rules

- Only animals with status `ALIVE` can be assigned to lots
- An animal can only be in one lot at a time
- `animal_id` is a composite u256 (see constants.cairo)

---

### 4. TraceabilityOracle

**File:** `traceability_oracle.cairo`

**Purpose:** Anchor per-animal traceability roots on-chain.

#### Data Structure

```cairo
struct TraceAnchor {
    root: felt252,        // Merkle root of all traceability events
    timestamp: u64,       // When the root was anchored
    event_count: u32,     // Number of events in the tree
}
```

#### Functions

| Function | Type | Description | Access |
|---------|------|-------------|--------|
| `get_last_root(animal_id)` | View | Get last anchored root | Public |
| `get_last_timestamp(animal_id)` | View | Get last anchor timestamp | Public |
| `get_trace_anchor(animal_id)` | View | Get full TraceAnchor | Public |
| `get_attestor()` | View | Get attestor address | Public |
| `get_correction_count(animal_id)` | View | Count corrections | Public |
| `anchor_trace(animal_id, root, event_count)` | Write | Anchor new root | Attestor only |
| `anchor_trace_batch(animal_ids, roots, event_counts)` | Write | Anchor roots for multiple animals | Attestor only |
| `correct_trace(animal_id, new_root, event_count, reason)` | Write | Anchor a correction | Attestor only |
| `set_attestor(new_attestor)` | Admin | Change attestor | Owner only |

#### Events

- `AnimalTraceAnchored`: New root anchored
- `AnimalTraceCorrected`: Correction anchored
- `AttestorChanged`: Attestor changed

#### Append-Only Model

Corrections do not delete previous data. The previous root remains recorded in the `AnimalTraceCorrected` event for auditability.

---

### 5. SettlementRegistry

**File:** `settlement_registry.cairo`

**Purpose:** Record settlement parameters for audit and payouts.

#### Data Structure

```cairo
struct Settlement {
    settled_at: u64,              // Settlement timestamp
    final_report_hash: felt252,   // Final report hash
    total_proceeds: u256,         // Total fiat proceeds (record-only)
    settled_by: ContractAddress,  // Who triggered settlement
    final_total_weight_grams: u32,   // Final total weight (grams)
    final_average_weight_grams: u32, // Final avg weight per animal (grams)
    initial_total_weight_grams: u32, // Initial total weight (grams)
}
```

#### Functions

| Function | Type | Description | Access |
|---------|------|-------------|--------|
| `get_settlement(lot_id)` | View | Get settlement data | Public |
| `is_settled(lot_id)` | View | Check if settled | Public |
| `get_lot_factory()` | View | Get LotFactory address | Public |
| `get_protocol_operator()` | View | Get operator address | Public |
| `get_lot_weight_stats(lot_id)` | View | Get settlement weight stats | Public |
| `settle_lot(lot_id, report_hash, total_proceeds, final_total_weight_grams, final_average_weight_grams)` | Write | Settle a lot | Operator only |
| `set_protocol_operator(new_operator)` | Admin | Change operator | Owner only |
| `set_lot_factory(new_factory)` | Admin | Change LotFactory | Owner only |

#### Events

- `LotSettled`: Lot settled

#### Cross-Contract Interactions

When calling `settle_lot()`:
1. Verifies the lot is not already settled
2. Gets the shares token from LotFactory
3. Verifies the lot is not already SETTLED in LotFactory
4. Changes the lot status to `SETTLED` in LotFactory
5. Freezes the shares token (`freeze()`)
6. Records settlement data

**Required configuration:**
For SettlementRegistry to execute `settle_lot()` correctly, it must be configured in:
- **LotFactory**: `set_settlement_registry(address)` - allows calling `set_lot_status(SETTLED)`
- **LotSharesToken**: `set_settlement_registry(address)` - allows calling `freeze()`

---

### 6. AuditRegistry

**File:** `audit_registry.cairo`

**Purpose:** Anchor off-chain ledger audit batches on-chain for integrity verification.

#### Data Structure

```cairo
struct BatchAnchor {
    batch_hash: felt252,      // Poseidon hash of canonical JSON
    from_ledger_id: u64,      // First ledger entry ID in batch
    to_ledger_id: u64,        // Last ledger entry ID in batch
    timestamp: u64,           // Anchor timestamp
}
```

#### Functions

| Function | Type | Description | Access |
|---------|------|-------------|--------|
| `get_batch(batch_id)` | View | Get batch anchor data | Public |
| `is_anchored(batch_id)` | View | Check if batch is anchored | Public |
| `get_operator()` | View | Get operator address | Public |
| `get_batch_count()` | View | Get total batch count | Public |
| `get_latest_batch_id()` | View | Get latest batch id | Public |
| `anchor_batch(batch_id, batch_hash, from_ledger_id, to_ledger_id)` | Write | Anchor a batch hash | Operator only |
| `set_operator(new_operator)` | Admin | Change operator | Owner only |

#### Events

- `BatchAnchored`: Batch anchored
- `OperatorUpdated`: Operator updated

---

## Constants (constants.cairo)

### Animal ID Format (u256)

| Bits | Field | Description |
|------|-------|-------------|
| 255-224 | Country code | ISO 3166-1 numeric |
| 223-192 | Province code | Province code |
| 191-128 | Producer ID | SENASA RENSPA |
| 127-64 | Sequence | Sequential number |
| 63-0 | Timestamp | Unix epoch |

### Lot Status (LotStatus)

| Value | State | Description |
|-------|-------|-------------|
| 1 | ACTIVE | Minting and transfers allowed |
| 2 | PAUSED | Emergency stop (optional) |
| 3 | SETTLED | Transfers frozen, minting disabled |
| 4 | FUNDED | 100% shares minted, transfers allowed, no more minting |

#### State Transitions

```
ACTIVE ──────▶ FUNDED (automatic at 100% minted)
   │              │
   │              ├──▶ PAUSED (emergency)
   │              │
   │              └──▶ SETTLED (settlement)
   │
   ├──▶ PAUSED (emergency)
   │       │
   │       ├──▶ ACTIVE (resume)
   │       ├──▶ FUNDED (resume if funded)
   │       └──▶ SETTLED (settlement)
   │
   └──▶ SETTLED (direct settlement)

SETTLED is terminal, no return.
FUNDED cannot go back to ACTIVE (cannot "un-fund").
```

### Animal Status (AnimalStatus)

| Value | State | Description |
|-------|-------|-------------|
| 1 | ALIVE | Alive, can be assigned to lots |
| 2 | SOLD | Sold |
| 3 | DECEASED | Deceased |
| 4 | REMOVED | Removed from the system |

### Traceability Event Types

- `WEIGHING`: Weighing
- `VACCINATION`: Vaccination
- `MOVEMENT`: Movement
- `HEALTH_CHECK`: Health check
- `FEEDING`: Feeding
- `TREATMENT`: Treatment

---

## End-to-End Flow (MVP)

```
1. CREATE LOT
   └─▶ LotFactory.create_lot(issuer, shares, price, hash, name, symbol)
       └─▶ LotSharesToken deployed automatically via deploy_syscall

2. REGISTER ANIMALS
   └─▶ AnimalRegistry.register_animal() → NFT minted

3. ASSIGN ANIMALS TO LOT
   └─▶ AnimalRegistry.assign_to_lot()

4. MINT SHARES (after fiat confirmation)
   └─▶ LotSharesToken.mint()

5. ANCHOR TRACE ROOTS
   └─▶ TraceabilityOracle.anchor_trace()

6. TRANSFER SHARES (while Active or Funded)
   └─▶ LotSharesToken.transfer()

7. SETTLE LOT
   └─▶ SettlementRegistry.settle_lot()
       ├─▶ LotFactory.set_lot_status(SETTLED)
       └─▶ LotSharesToken.freeze()

8. ANCHOR AUDIT BATCHES (off-chain ledger)
   └─▶ AuditRegistry.anchor_batch()

9. EXPORT BALANCES (for fiat payout)
   └─▶ LotSharesToken.balance_of() (read-only)
```

---

## Dependency Diagram

```
                    ┌─────────────────┐
                    │  Protocol Admin │
                    │     (Owner)     │
                    └────────┬────────┘
                             │ set_protocol_operator
                             │ set_attestor
                             │ set_settlement_registry
                             │ set_shares_token_class_hash
                             ▼
        ┌────────────────────────────────────────────┐
        │              Protocol Operator              │
        │  (Backend service with mint privileges)     │
        └────────────────────┬───────────────────────┘
                             │
           ┌─────────────────┼─────────────────┼─────────────────┐
           │                 │                 │                 │
           ▼                 ▼                 ▼                 ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │ LotFactory │    │  Animal    │    │ Settlement │    │   Audit    │
    │            │◀───│  Registry  │    │  Registry  │    │  Registry  │
    └─────┬──────┘    └────────────┘    └──────┬─────┘    └────────────┘
          │                                    │
          │ deploy_syscall        set_lot_status(SETTLED)
          │ (creates token)                   │
          ▼                                    │
    ┌────────────┐◀────────────────────────────┘
    │ LotShares  │         freeze()
    │   Token    │───────────────────────────▶ LotFactory
    └────────────┘     set_lot_status(FUNDED)
          │
          └───▶ LotFactory.set_lot_status(FUNDED)
                (automatic when 100% minted)

                    ┌─────────────────┐
                    │    Attestor     │
                    │    (Oracle)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Traceability   │
                    │     Oracle      │
                    └─────────────────┘
```

---

## Security Considerations

1. **Access Control**: Each contract uses OpenZeppelin Ownable + operator role.
2. **Validations**: All functions validate inputs (zero address, valid states).
3. **State Machine**: State transitions are validated (cannot revert from Settled).
4. **Append-Only**: Trace corrections are append-only, no history deletion.
5. **Freeze**: Shares are frozen at settlement, cap table becomes immutable.
