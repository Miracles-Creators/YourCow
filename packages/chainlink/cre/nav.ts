/**
 * nav.ts — Per-lot NAV (Net Asset Value) calculation.
 *
 * Pure function: takes market prices + lots -> returns computed NAV per lot.
 * No I/O, no SDK imports, no side effects. Independently testable.
 *
 * NAV Formula:
 *   revenue      = currentWeightKg * beefPriceUsd
 *   feedCosts    = (weightGain * FCR * cornPricePerKg) + projected future feed
 *   lotNAV       = revenue - feedCosts - operatingCosts
 *   navPerShare  = lotNAV / totalShares
 *
 * All output values are scaled x100 for on-chain storage (2 decimal places as integers).
 */
import { type OracleLot, FCR, MS_PER_DAY } from "./types";

/** Result for a single lot — ready for on-chain encoding */
export type LotResult = {
  lotId: bigint;       // On-chain lot identifier
  nav: bigint;         // Total lot NAV in USD, scaled x100
  navPerShare: bigint; // NAV per share in USD, scaled x100
  weightGrams: number; // Current weight passed through to contract (uint32)
};

/**
 * Calculates NAV for each valid lot.
 * Skips lots missing required data (weight, dates, shares) with a log message.
 * Returns only valid lots with their scaled NAV values.
 */
export function calculateLotNAVs(
  lots: OracleLot[],
  beefPriceUsd: number,
  cornPrice: number,
  log: (msg: string) => void,
): LotResult[] {
  const now = Date.now();
  const cornPricePerKg = cornPrice / 1000; // USD/ton -> USD/kg
  const results: LotResult[] = [];

  for (const lot of lots) {
    // Validate required fields — skip with reason if missing
    if (!lot.currentTotalWeightGrams) {
      log(`Lot #${lot.onChainLotId}: SKIPPED — no current weight`);
      continue;
    }
    if (!lot.initialTotalWeightGrams) {
      log(`Lot #${lot.onChainLotId}: SKIPPED — no initial weight`);
      continue;
    }
    if (!lot.totalShares) {
      log(`Lot #${lot.onChainLotId}: SKIPPED — zero shares`);
      continue;
    }
    if (!lot.startDate) {
      log(`Lot #${lot.onChainLotId}: SKIPPED — no start date`);
      continue;
    }

    // Weight calculations (grams -> kg)
    const currentWeightKg = lot.currentTotalWeightGrams / 1_000;
    const initialWeightKg = lot.initialTotalWeightGrams / 1_000;
    const weightGainKg = currentWeightKg - initialWeightKg;

    // Time calculations
    const startMs = new Date(lot.startDate).getTime();
    const daysElapsed = Math.max(1, Math.floor((now - startMs) / MS_PER_DAY));
    const daysRemaining = lot.endDate
      ? Math.max(0, Math.floor((new Date(lot.endDate).getTime() - now) / MS_PER_DAY))
      : 0;

    // Feed costs: historical (incurred) + projected (future)
    const dailyGainKg = weightGainKg / daysElapsed;
    const feedCostIncurred = weightGainKg * FCR * cornPricePerKg;
    const feedCostFuture = dailyGainKg * daysRemaining * FCR * cornPricePerKg;

    // Operating costs (stored as USD cents in backend -> convert to USD)
    const operatingCostsUsd = (lot.operatingCosts ?? 0) / 100;

    // NAV = potential revenue - all costs
    const revenuePotential = currentWeightKg * beefPriceUsd;
    const lotNav = revenuePotential - feedCostIncurred - feedCostFuture - operatingCostsUsd;
    const navPerShare = lotNav / lot.totalShares;

    log(
      `Lot #${lot.onChainLotId}: weight=${currentWeightKg}kg gain=${weightGainKg.toFixed(1)}kg NAV=$${lotNav.toFixed(2)} NAV/share=$${navPerShare.toFixed(2)}`,
    );

    // Scale x100 for on-chain storage (2 decimal places as integers)
    results.push({
      lotId: BigInt(lot.onChainLotId),
      nav: BigInt(Math.round(lotNav * 100)),
      navPerShare: BigInt(Math.round(navPerShare * 100)),
      weightGrams: lot.currentTotalWeightGrams,
    });
  }

  return results;
}
