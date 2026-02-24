# Tu Vaca Chainlink CRE — Status & Next Steps

Last updated: 2026-02-24

## What's Done (fully working)

### CRE Workflow (packages/chainlink/cre/)
- **main.ts** — Orchestrator: fetches prices, fetches lots, calculates NAV, encodes on-chain writes
- **fetchers.ts** — 4 API fetch functions (corn, beef, ARS/USD, active lots) with dynamic dates (now - 3 days, skips weekends)
- **nav.ts** — Pure NAV calculation per lot (no I/O, no SDK deps)
- **types.ts** — Config, OracleLot, constants (FCR=7, SEPOLIA_SELECTOR, FALLBACK_ARS_USD_RATE)
- **abi/NAVOracle.json** — Generated ABI from `forge build`
- **config.staging.json / config.production.json** — Base URLs (dates are dynamic now)
- **workflow.yaml** — staging-settings + production-settings targets
- **project.yaml** — Sepolia RPC config

### Solidity Contract (packages/chainlink/contracts/)
- **NAVOracle.sol** — Stores market prices + per-lot NAV, operator access control, batch update, events

### Simulation
- `cre workflow simulate cre/ --target staging-settings` **PASSES** with real Argentine API data
- Fetches live corn (MAGyP), beef (SIOCarnes), ARS/USD (BCRA) prices
- Calculates per-lot NAV correctly
- Encodes two on-chain transactions (market prices + batch lot NAV)
- Dry-run only (no on-chain writes) — broadcast requires Sepolia deployment

### Backend Endpoint
- `GET /api/lots/oracle` — returns active lots with on-chain IDs, weights, dates, shares
- Changes in `packages/backend/src/modules/core/lots/lots.controller.ts` and `lots.service.ts`

---

## What's NOT Done — Next Steps

### Step 1: Get Sepolia ETH

You need Sepolia ETH in a wallet you control.

- Faucet: https://sepoliafaucet.com (or Google "Sepolia faucet")
- You need ~0.1 Sepolia ETH (enough for contract deploy + a few test runs)
- Save the private key — you'll need it for steps 2 and 3

### Step 2: Deploy NAVOracle.sol to Sepolia

```bash
cd packages/chainlink
./deploy.sh <YOUR_PRIVATE_KEY>
```

This runs:
```bash
forge create contracts/NAVOracle.sol:NAVOracle \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --private-key <KEY> \
  --broadcast
```

After deploy, copy the `Deployed to: 0x...` address and update BOTH config files:
```bash
# Edit cre/config.staging.json → "navContractAddress": "0x<DEPLOYED_ADDRESS>"
# Edit cre/config.production.json → "navContractAddress": "0x<DEPLOYED_ADDRESS>"
```

Verify on Etherscan: `https://sepolia.etherscan.io/address/<DEPLOYED_ADDRESS>`

### Step 3: Test broadcast simulation on Sepolia

This is the real test — it will actually write data on-chain:

```bash
cd packages/chainlink
CRE_ETH_PRIVATE_KEY=<YOUR_PRIVATE_KEY> cre workflow simulate cre/ --target staging-settings --broadcast
```

**Important:** `--broadcast` goes through Chainlink's forwarder contract on Sepolia. This is the ONLY way to test on-chain writes (local Anvil doesn't work because the forwarder doesn't exist locally).

If the operator address doesn't match, call `setOperator(address)` on the contract via cast:
```bash
cast send <CONTRACT_ADDRESS> "setOperator(address)" <CRE_FORWARDER_ADDRESS> \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --private-key <YOUR_PRIVATE_KEY>
```

### Step 4: Verify on-chain data

After the broadcast simulation runs, read the contract to confirm data was written:

```bash
# Read market prices
cast call <CONTRACT_ADDRESS> "getMarketPrices()" \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com

# Read a specific lot's NAV (e.g., lot ID 1)
cast call <CONTRACT_ADDRESS> "getLotNAV(uint256)" 1 \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com

# Read all active lot IDs
cast call <CONTRACT_ADDRESS> "getActiveLotIds()" \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

Values are scaled x100. Example: `nav = 88384` means `$883.84`.

### Step 5: Build Starknet relay

Build an off-chain relay service that:

1. **Listens** to NAVOracle events on Sepolia:
   - `MarketPricesUpdated(beefPrice, cornPrice, arsUsdRate, timestamp)`
   - `LotNAVUpdated(lotId, nav, navPerShare, weightGrams, timestamp)`
   - `WeighingProcessed(lotId, previousWeightGrams, newWeightGrams, newNAV, timestamp)`

2. **Transforms** the event data and **writes** it to the existing Starknet contract

The relay bridges CRE oracle data from Ethereum Sepolia to Starknet where the tokenized cattle lots live. It can be a simple Node.js/TypeScript service using:
- `viem` to subscribe to Sepolia contract events
- `starknet.js` to send transactions to the Starknet contract

This is the final piece that closes the loop: Argentine market data → CRE workflow → Sepolia → relay → Starknet.

---

## Known Gotchas

| Issue | Explanation |
|-------|-------------|
| `--broadcast` fails on local Anvil | CRE writes go through a forwarder contract that only exists on Sepolia. Use dry-run (`simulate` without `--broadcast`) for local testing |
| `cannot wrap null/undefined into Value` | CRE WASM rejects null. Backend nulls are sanitized to 0/"" in `fetchActiveLots` |
| `@noble/curves` TypeScript errors | Transitive dep from viem ships raw .ts files. `skipLibCheck` doesn't help (only covers .d.ts). Our code has zero errors — these are from node_modules |
| BCRA API returns fallback 1200 | The BCRA API is unreliable on certain dates/weekends. The workflow uses `FALLBACK_ARS_USD_RATE = 1200` when it fails |
| `forge create` without `--broadcast` | Dry run only — prints ABI but doesn't deploy. Always use `--broadcast` for real deploys |

---

## File Map

```
packages/chainlink/
  .gitignore                  # out/, cache/, .cre_build_tmp.js, .env
  foundry.toml                # Foundry config (src=contracts, out=out)
  deploy.sh                   # One-liner deploy script for Sepolia
  project.yaml                # CRE project settings (Sepolia RPC)
  README.md                   # Full project documentation
  NEXT_STEPS.md               # This file
  contracts/
    NAVOracle.sol             # Solidity contract
  cre/
    main.ts                   # CRE workflow entry point
    fetchers.ts               # API fetch functions (dynamic dates)
    nav.ts                    # NAV calculation (pure, testable)
    types.ts                  # Config, OracleLot, constants
    abi/NAVOracle.json        # Generated ABI
    config.staging.json       # Staging config (Anvil addr placeholder)
    config.production.json    # Production config (zero addr placeholder)
    workflow.yaml             # CRE workflow targets
    package.json              # yourcow-cre-workflow
    tsconfig.json             # TypeScript config
    bun.lock                  # Lock file
```

