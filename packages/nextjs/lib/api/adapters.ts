import type { Lot, LotCategory } from "~~/app/[locale]/(investor)/_constants/mockData";
import type { LotDto } from "./schemas";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asNumber(value: unknown, fallback = 0): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asCategory(productionType: string): LotCategory {
  // Map backend production types to investor UI categories
  const mapping: Record<string, LotCategory> = {
    FEEDLOT: "Fattening",
    PASTURE: "Breeding",
    MIXED: "Fattening",
  };
  return mapping[productionType] ?? "Fattening";
}

export function mapLotToInvestorLot(lot: LotDto): Lot {
  const metadata = asRecord(lot.metadata);

  // Calculate funding progress (placeholder - would need actual invested amount)
  const fundingProgress = asNumber(metadata.fundingProgress, 0);

  // Format duration from weeks
  const duration = lot.durationWeeks
    ? `${lot.durationWeeks} weeks`
    : asString(metadata.duration, "TBD");

  return {
    id: lot.id,
    name: lot.name,
    location: lot.location,
    duration,
    expectedReturn: asString(metadata.expectedReturn, `${lot.investorPercent}%`),
    fundingProgress,
    imageUrl: asString(metadata.imageUrl, ""),
    capitalRequired: asNumber(lot.totalShares, 0),
    currentNAV: asNumber(metadata.currentNAV, 0),
    breed: asString(metadata.breed, "Mixed"),
    herdSize: lot.cattleCount,
    category: asCategory(lot.productionType),
    pricePerShare: asNumber(lot.pricePerShare, 1),
    totalShares: asNumber(lot.totalShares, 0),
    sharesAvailable: asNumber(metadata.sharesAvailable, asNumber(lot.totalShares, 0)),
    producer: {
      name: lot.farmName,
      experience: asString(metadata.producerExperience, ""),
    },
    traceabilityEvents: Array.isArray(metadata.traceabilityEvents)
      ? metadata.traceabilityEvents
          .filter((event) => event && typeof event === "object")
          .map((event) => {
            const eventData = asRecord(event);
            return {
              date: asString(eventData.date, ""),
              description: asString(eventData.description, ""),
            };
          })
      : [],
  };
}
