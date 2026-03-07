/**
 * fetchers.ts — API fetch functions for the YourCow CRE workflow.
 *
 * Each function follows the CRE SDK pattern:
 *   (sendRequester: HTTPSendRequester, config: Config) => ReturnType
 *
 * The CRE runtime calls these on EACH DON node independently, then
 * aggregates results via consensus (median for prices, identical for lots).
 *
 * Data sources:
 *   - Corn price:  MAGyP (Argentine Agriculture Ministry) FOB export API
 *   - Beef price:  SIOCarnes (MAGyP cattle monitoring system)
 *   - ARS/USD:     BCRA (Argentine Central Bank) official exchange rate
 *   - Active lots: YourCow backend
 */
import { json, ok, type HTTPSendRequester } from "@chainlink/cre-sdk";
import { type Config, FALLBACK_ARS_USD_RATE, MS_PER_DAY } from "./types";

/** Parses Argentine number format: "3.142,39" (dots=thousands, comma=decimal) -> 3142.39 */
const parseArgentineNumber = (s: string): number => {
  return Number.parseFloat(s.replace(/\./g, "").replace(",", "."));
};

/** Returns the query date for API calls.
 *  If config.queryDate is set (YYYY-MM-DD), uses that directly.
 *  Otherwise falls back to ~3 days ago, skipping weekends (gov APIs have no weekend data).
 */
const getQueryDate = (override?: string): Date => {
  if (override) return new Date(override);
  const d = new Date(Date.now() - 3 * MS_PER_DAY);
  const day = d.getUTCDay();
  if (day === 0) return new Date(d.getTime() - 2 * MS_PER_DAY); // Sunday -> Friday
  if (day === 6) return new Date(d.getTime() - 1 * MS_PER_DAY); // Saturday -> Friday
  return d;
};

/** Formats date as DD/MM/YYYY (MAGyP + SIOCarnes format) */
const formatDateAr = (d: Date): string => {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/** Formats date as YYYY-MM-DD (BCRA format) */
const formatDateIso = (d: Date): string => {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Fetches corn FOB export price from MAGyP.
 * Filters by NCM code 10059010 (corn grain) and returns USD/ton.
 */
export const fetchCornPrice = (
  sendRequester: HTTPSendRequester,
  config: Config,
): number => {
  const date = formatDateAr(getQueryDate(config.queryDate));
  const url = `${config.cornApiUrl}?Fecha=${date}`;

  const response = sendRequester
    .sendRequest({ url, method: "GET" })
    .result();

  if (!ok(response)) {
    throw new Error(`Corn HTTP failed: ${response.statusCode}`);
  }

  const body = json(response) as { posts?: { posicion: string; precio: number }[] };

  if (!body.posts || body.posts.length === 0) {
    throw new Error(`No corn data for ${date}`);
  }

  const items = body.posts.filter((item) =>
    item.posicion.startsWith("10059010"),
  );

  if (items.length === 0) {
    throw new Error("No corn price found (NCM 10059010)");
  }

  return items[0].precio; // USD/ton FOB
};

/**
 * Fetches live cattle (novillo) price from SIOCarnes.
 * Returns the most recent price in ARS/kg (raw, NOT converted to USD).
 * The ARS->USD conversion happens in main.ts using the fetched exchange rate.
 */
export const fetchBeefPrice = (
  sendRequester: HTTPSendRequester,
  config: Config,
): number => {
  const date = formatDateAr(getQueryDate(config.queryDate));
  const url = `${config.beefApiUrl}&dia=${date}`;

  const response = sendRequester
    .sendRequest({ url, method: "GET" })
    .result();

  if (!ok(response)) {
    throw new Error(`Beef HTTP failed: ${response.statusCode}`);
  }

  const body = json(response) as { precios?: { precioPromedio: string }[] };

  if (!body.precios || body.precios.length === 0) {
    throw new Error("No beef price found in API response");
  }

  const latest = body.precios[body.precios.length - 1];
  const price = parseArgentineNumber(latest.precioPromedio);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid beef price: ${latest.precioPromedio}`);
  }

  return price; // ARS/kg live weight
};

type BcraResponse = { results: { detalle: { codigoMoneda: string; venta: number }[] } };

/**
 * Fetches official ARS/USD sell rate from BCRA (Argentine Central Bank).
 * Returns ARS per 1 USD. Falls back to FALLBACK_ARS_USD_RATE if the API
 * is unavailable or returns unexpected data — reliability over purity.
 */
export const fetchArsUsdRate = (
  sendRequester: HTTPSendRequester,
  config: Config,
): number => {
  const date = formatDateIso(getQueryDate(config.queryDate));
  const url = `${config.usdApiUrl}?fecha=${date}`;

  const response = sendRequester
    .sendRequest({ url, method: "GET" })
    .result();

  if (!ok(response)) {
    return FALLBACK_ARS_USD_RATE;
  }

  try {
    const body = json(response) as BcraResponse;
    const usd = body.results?.detalle?.find((d) => d.codigoMoneda === "USD");
    if (!usd || !Number.isFinite(usd.venta) || usd.venta <= 0) {
      return FALLBACK_ARS_USD_RATE;
    }
    return usd.venta; // ARS per 1 USD
  } catch {
    return FALLBACK_ARS_USD_RATE;
  }
};

