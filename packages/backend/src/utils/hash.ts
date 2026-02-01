import { hash as starknetHash } from "starknet";

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeys(item));
  }
  if (value && typeof value === "object") {
    const withJson = value as { toJSON?: () => unknown };
    if (typeof withJson.toJSON === "function") {
      return sortKeys(withJson.toJSON());
    }

    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return value;
};

export const canonicalJson = (value: unknown): string => {
  return JSON.stringify(sortKeys(value));
};

export const hashCanonicalJson = (canonical: string): string => {
  const keccak = starknetHash.starknetKeccak(canonical);
  return starknetHash.computePoseidonHashOnElements([keccak]).toString();
};

export const hashObject = (value: unknown): string => {
  return hashCanonicalJson(canonicalJson(value));
};

export const normalizeHash = (hash: string): string => {
  const normalized = hash.trim().toLowerCase();
  return normalized.startsWith("0x") ? normalized.slice(2) : normalized;
};
