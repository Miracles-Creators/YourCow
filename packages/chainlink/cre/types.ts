/**
 * types.ts — Shared types and constants for the YourCow CRE workflow.
 *
 * This file defines the configuration shape (matching the JSON config files),
 * the lot data structure returned by the backend, and domain constants
 * used across fetchers and NAV calculation.
 */

/** Workflow configuration — maps 1:1 to config.staging.json / config.production.json */
export type Config = {
  schedule: string;           // Cron expression (e.g. "*/30 * * * * *" = every 30s)
  cornApiUrl: string;         // MAGyP FOB export price API
  beefApiUrl: string;         // SIOCarnes live cattle price API
  usdApiUrl: string;          // BCRA official exchange rate API
  backendLotsUrl: string;     // YourCow backend — GET /api/lots/oracle
  navContractAddress: string; // NAVOracle.sol deployed address on Sepolia
  queryDate?: string;         // Optional date override for API queries (YYYY-MM-DD). Falls back to 3 days ago.
};

/**
 * Lot data from the backend GET /api/lots/oracle endpoint.
 *
 * NOTE: Fields are typed as non-nullable to satisfy CRE's CreSerializable constraint
 * (the WASM runtime rejects types containing `null`). The backend CAN return null
 * for optional fields — runtime null-checks in nav.ts handle that safely.
 */
export type OracleLot = {
  onChainLotId: number;           // Lot ID registered on-chain
  totalShares: number;            // Total ERC20 shares issued for this lot
  currentTotalWeightGrams: number; // Latest weighed total weight (grams)
  initialTotalWeightGrams: number; // Weight at lot creation (grams)
  startDate: string;              // ISO date — when the fattening cycle began
  endDate: string;                // ISO date — expected end of cycle
  operatingCosts: number;         // Accumulated costs in USD cents
};

/** Ethereum Sepolia chain selector for Chainlink CRE EVM writes */
export const SEPOLIA_SELECTOR = 16015286601757825753n;

/** Feed Conversion Ratio — kg of corn feed per kg of liveweight gain (feedlot standard) */
export const FCR = 7;

/** Fallback ARS/USD rate if BCRA API is unavailable (conservative estimate) */
export const FALLBACK_ARS_USD_RATE = 1200;

/** Milliseconds in one day — used for date arithmetic in NAV calculation */
export const MS_PER_DAY = 86_400_000;
