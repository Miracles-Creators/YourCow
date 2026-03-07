/**
 * main.ts — CRE workflow entry point for YourCow NAV Oracle.
 *
 * This is a Chainlink CRE (Compute-Reporting Engine) workflow that runs on a
 * Decentralized Oracle Network (DON). Every 30 seconds it:
 *
 *   1. Fetches real market data from Argentine government APIs
 *      - Corn price (USD/ton) from MAGyP
 *      - Beef price (ARS/kg) from SIOCarnes
 *      - ARS/USD exchange rate from BCRA
 *   2. Fetches active cattle lots from the YourCow backend
 *   3. Calculates NAV (Net Asset Value) for each lot
 *   4. Writes two on-chain transactions to NAVOracle.sol on Sepolia:
 *      - updateMarketPrices(beef, corn, arsUsdRate)
 *      - batchUpdateLotNAV(lotIds[], navs[], navPerShares[], weightGrams[])
 *
 * CRE constraints: no async/await, .result() on every capability call, no Node.js APIs.
 */
import {
  consensusMedianAggregation,
  cre,
  handler,
  json,
  ok,
  prepareReportRequest,
  Runner,
  type Runtime,
} from "@chainlink/cre-sdk";
import { encodeFunctionData } from "viem";
import navOracleAbi from "./abi/NAVOracle.json";
import { fetchArsUsdRate, fetchBeefPrice, fetchCornPrice } from "./fetchers";
import { calculateLotNAVs } from "./nav";
import { type Config, type OracleLot, SEPOLIA_SELECTOR } from "./types";

/**
 * Main handler — triggered by cron on each DON execution cycle.
 * Orchestrates: fetch prices -> fetch lots -> calculate NAVs -> write on-chain.
 */
const onCronTrigger = (runtime: Runtime<Config>): number => {
  const http = new cre.capabilities.HTTPClient();

  // Step 1: Fetch market prices (each node fetches independently, consensus via median)
  const cornPrice = http
    .sendRequest(runtime, fetchCornPrice, consensusMedianAggregation())(runtime.config)
    .result();

  const beefPriceArs = http
    .sendRequest(runtime, fetchBeefPrice, consensusMedianAggregation())(runtime.config)
    .result();

  const arsUsdRate = http
    .sendRequest(runtime, fetchArsUsdRate, consensusMedianAggregation())(runtime.config)
    .result();

  // Step 2: Convert beef price to USD using live exchange rate
  const beefPriceUsd = beefPriceArs / arsUsdRate;
  if (!Number.isFinite(beefPriceUsd)) {
    throw new Error(`Invalid beef USD conversion: ${beefPriceArs} / ${arsUsdRate}`);
  }

  // Step 3: Fetch active lots via ConfidentialHTTPClient (single enclave, no consensus)
  const confHttp = new cre.capabilities.ConfidentialHTTPClient();
  const lotsResponse = confHttp.sendRequest(runtime, {
    vaultDonSecrets: [
      { key: "ORACLE_API_KEY", namespace: "main" },
    ],
    request: {
      url: runtime.config.backendLotsUrl,
      method: "GET",
      multiHeaders: {
        "x-api-key": { values: ["{{.ORACLE_API_KEY}}"] },
      },
      encryptOutput: false,
    },
  }).result();

  if (!ok(lotsResponse)) {
    throw new Error(`Lots fetch failed: ${lotsResponse.statusCode}`);
  }

  const lotsRaw = json(lotsResponse) as Record<string, unknown>[];
  const lots: OracleLot[] = lotsRaw.map((lot) => ({
    onChainLotId: (lot.onChainLotId as number) ?? 0,
    totalShares: (lot.totalShares as number) ?? 0,
    currentTotalWeightGrams: (lot.currentTotalWeightGrams as number) ?? 0,
    initialTotalWeightGrams: (lot.initialTotalWeightGrams as number) ?? 0,
    startDate: (lot.startDate as string) ?? "",
    endDate: (lot.endDate as string) ?? "",
    operatingCosts: (lot.operatingCosts as number) ?? 0,
  }));

  runtime.log(`========== YOURCOW NAV ORACLE ==========`);
  runtime.log(`Query date:     ${runtime.config.queryDate ?? "auto (3 days ago)"}`);
  runtime.log(`Corn (FOB):     ${cornPrice} USD/ton`);
  runtime.log(`Beef (Novillo): ${beefPriceArs.toFixed(2)} ARS/kg -> ${beefPriceUsd.toFixed(4)} USD/kg`);
  runtime.log(`ARS/USD Rate:   ${arsUsdRate}`);
  runtime.log(`Active lots:    ${lots.length}`);
  runtime.log(`-----------------------------------------`);

  // Step 4: Calculate NAV for each valid lot
  const lotResults = calculateLotNAVs(lots, beefPriceUsd, cornPrice, (msg) =>
    runtime.log(msg),
  );

  runtime.log(`-----------------------------------------`);

  // Step 5: Write market prices on-chain (scaled x100 for 2 decimal places)
  const beefScaled = BigInt(Math.round(beefPriceUsd * 100));
  const cornScaled = BigInt(Math.round(cornPrice * 100));
  const arsUsdScaled = BigInt(Math.round(arsUsdRate * 100));

  const marketData = encodeFunctionData({
    abi: navOracleAbi,
    functionName: "updateMarketPrices",
    args: [beefScaled, cornScaled, arsUsdScaled],
  });

  const evmClient = new cre.capabilities.EVMClient(SEPOLIA_SELECTOR);

  runtime.log(`Contract address: ${runtime.config.navContractAddress}`);

  const marketReport = runtime.report(prepareReportRequest(marketData)).result();

  evmClient
    .writeReport(runtime, {
      receiver: runtime.config.navContractAddress,
      report: marketReport,
      gasConfig: { gasLimit: "300000" },
    })
    .result();

  runtime.log(`Market prices written`);

  // Step 6: Write per-lot NAVs on-chain (skip if no valid lots)
  if (lotResults.length > 0) {
    const batchData = encodeFunctionData({
      abi: navOracleAbi,
      functionName: "batchUpdateLotNAV",
      args: [
        lotResults.map((r) => r.lotId),
        lotResults.map((r) => r.nav),
        lotResults.map((r) => r.navPerShare),
        lotResults.map((r) => r.weightGrams),
      ],
    });

    const lotReport = runtime.report(prepareReportRequest(batchData)).result();

    evmClient
      .writeReport(runtime, {
        receiver: runtime.config.navContractAddress,
        report: lotReport,
        gasConfig: { gasLimit: "1000000" },
      })
      .result();

    runtime.log(`Lot NAVs written (${lotResults.length} lots)`);
  } else {
    runtime.log(`No valid lots — skipping batchUpdateLotNAV`);
  }

  runtime.log(`=========================================`);

  return lotResults.length;
};

/** Wire cron trigger to handler — CRE SDK pattern */
const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();
  return [
    handler(cron.trigger({ schedule: config.schedule }), onCronTrigger),
  ];
};

/** Entry point — CRE WASM runner bootstraps the workflow */
export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
