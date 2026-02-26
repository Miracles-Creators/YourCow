# Tu Vaca — Chainlink CRE Oracle

Chainlink CRE workflow that calculates **per-lot NAV** (Net Asset Value) for tokenized cattle lots using real Argentine market data, and writes the results on-chain to Ethereum Sepolia.

## Architecture

```
Argentine Gov APIs (beef, corn, ARS/USD)
        |
        v
CRE Workflow (fetches prices, calculates NAV per lot)
        |
        v
NAVOracle.sol on Sepolia (stores market prices + per-lot NAV)
        |                         emits events:
        |                         - MarketPricesUpdated
        |                         - LotNAVUpdated
        v
Off-chain Relay (listens to Sepolia events)
        |
        v
Starknet contract (receives NAV data for tokenized lots)
```

## Data Sources

| Source | API | Returns |
|--------|-----|---------|
| Corn price | MAGyP FOB (`precios_fob.php`) | USD/ton FOB |
| Beef price | SIOCarnes (`GetDatosMonitor`) | ARS/kg live weight |
| ARS/USD rate | BCRA (`Cotizaciones`) | ARS per USD (sell rate) |
| Active lots | Backend (`/api/lots/oracle`) | Lot data (weights, shares, dates) |

## NAV Formula (per lot)

```
beefPriceUsd      = beefPriceArs / arsUsdRate
currentWeightKg   = currentTotalWeightGrams / 1000
weightGainKg      = currentWeightKg - initialWeightKg
dailyGainKg       = weightGainKg / daysElapsed
cornPricePerKg    = cornPrice / 1000

feedCostIncurred  = weightGainKg * FCR * cornPricePerKg
feedCostFuture    = dailyGainKg * daysRemaining * FCR * cornPricePerKg
operatingCostsUsd = operatingCosts / 100

revenuePotential  = currentWeightKg * beefPriceUsd
lotNAV            = revenuePotential - feedCostIncurred - feedCostFuture - operatingCostsUsd
navPerShare       = lotNAV / totalShares
```

FCR (Feed Conversion Ratio) = 7 kg corn per kg weight gain (feedlot standard).

## On-chain Writes

Two transactions per CRE run:

1. **`updateMarketPrices(beefPrice, cornPrice, arsUsdRate)`** — global market data (always)
2. **`batchUpdateLotNAV(lotIds[], navs[], navPerShares[], weightGrams[])`** — per-lot NAV (only if valid lots exist)

All values are scaled x100 (2 decimal places as integers). Example: `2.15 USD/kg` -> `215`.

## Project Structure

```
packages/chainlink/
  contracts/
    NAVOracle.sol         # Solidity contract (market prices + per-lot NAV)
  cre/
    main.ts               # CRE workflow entry point (orchestrator)
    fetchers.ts           # API fetch functions (corn, beef, USD, lots)
    nav.ts                # NAV calculation (pure function, no I/O)
    types.ts              # Config, OracleLot, constants
    abi/NAVOracle.json    # Generated ABI (from forge build)
    config.staging.json   # Staging config
    config.production.json
    workflow.yaml         # CRE workflow targets
  project.yaml            # CRE project settings (RPCs)
  deploy.sh               # Deploy script for NAVOracle
  foundry.toml            # Foundry config
```

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge)
- [Bun](https://bun.sh) >= 1.2.21
- [Chainlink CRE CLI](https://docs.chain.link/chainlink-functions/resources/command-line) (`cre`)
- A wallet with Sepolia ETH ([faucet](https://sepoliafaucet.com))
- Backend running at `localhost:3001` (for the lots endpoint)

## Setup

### 1. Install CRE dependencies

```bash
cd packages/chainlink/cre
bun install
```

### 2. Build the Solidity contract

```bash
cd packages/chainlink
forge build
```

This generates `out/NAVOracle.sol/NAVOracle.json`. The ABI is already extracted to `cre/abi/NAVOracle.json`.

### 3. Deploy NAVOracle to Sepolia

```bash
cd packages/chainlink
chmod +x deploy.sh
./deploy.sh <YOUR_PRIVATE_KEY>
```

Copy the deployed contract address and update both config files:

```bash
# Edit cre/config.staging.json and cre/config.production.json
# Replace "navContractAddress": "0x000..." with the deployed address
```

### 4. Set the CRE operator

After deploying, the contract's `operator` is the deployer wallet. If the CRE workflow uses a different address to write on-chain, call `setOperator(address)` on the contract to authorize it.

### 5. Start the backend

The CRE workflow fetches active lots from `http://localhost:3001/api/lots/oracle`. Make sure the backend is running:

```bash
cd packages/backend
bun run start:dev
```

## Running

### Simulate locally (no on-chain writes)

```bash
cd packages/chainlink
cre workflow simulate cre/ --target staging-settings
```

### Simulate with real on-chain writes

```bash
CRE_ETH_PRIVATE_KEY=<YOUR_KEY> cre workflow simulate cre/ --target staging-settings --broadcast
```

### Starknet Relay

An off-chain relay service listens to `LotNAVUpdated` and `MarketPricesUpdated` events emitted by NAVOracle on Sepolia, and pushes the data to the existing Starknet contract. This bridges the CRE oracle data from Ethereum to Starknet where the tokenized lots live.

## Configuration

Both `config.staging.json` and `config.production.json` share the same structure:

| Field | Description |
|-------|-------------|
| `schedule` | Cron expression for how often the workflow runs |
| `cornApiUrl` | MAGyP FOB API base URL (date appended dynamically) |
| `beefApiUrl` | SIOCarnes API base URL with category filters (date appended dynamically) |
| `usdApiUrl` | BCRA exchange rate API base URL (date appended dynamically) |
| `backendLotsUrl` | Backend endpoint for active lots |
| `navContractAddress` | Deployed NAVOracle address on Sepolia |

API dates are computed at runtime: `Date.now() - 3 days`, adjusted to skip weekends (Argentine gov APIs have no weekend data).

## Updating the ABI

If you modify `NAVOracle.sol`, regenerate the ABI:

```bash
cd packages/chainlink
forge build
# Extract just the ABI array:
cat out/NAVOracle.sol/NAVOracle.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['abi'], indent=2))" > cre/abi/NAVOracle.json
```
