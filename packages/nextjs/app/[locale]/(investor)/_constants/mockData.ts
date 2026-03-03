/**
 * Mock data for investor screens
 * TODO: Replace with real API calls
 */

export type LotCategory = "Fattening" | "Breeding" | "Dairy";

export interface Lot {
  id: string;
  name: string;
  location: string;
  duration: string;
  expectedReturn: string;
  fundingProgress: number;
  imageUrl?: string;
  capitalRequired: number;
  currentNAV: number;
  breed: string;
  herdSize: number;
  category: LotCategory;
  pricePerShare: number;
  totalShares: number;
  sharesAvailable: number;
  producer: {
    name: string;
    experience: string;
  };
  traceabilityEvents: {
    date: string;
    description: string;
  }[];
}

export const mockPortfolio = {
  totalInvested: 125000,
  currentValue: 132450,
  gain: 7450,
  gainPercentage: 5.96,
  status: "Production ongoing" as const,
};

export const mockLots: Lot[] = [
  {
    id: "1",
    name: "Premium Angus Lot #42",
    location: "Buenos Aires, Argentina",
    duration: "18 months",
    expectedReturn: "12-15% APY",
    fundingProgress: 75,
    imageUrl: "/vaca-image-btc.png",
    capitalRequired: 50000,
    currentNAV: 52500,
    breed: "Premium Angus",
    herdSize: 120,
    category: "Fattening",
    pricePerShare: 250,
    totalShares: 200,
    sharesAvailable: 50,
    producer: {
      name: "Estancia San Pedro",
      experience: "15 years in cattle production",
    },
    traceabilityEvents: [
      { date: "2025-11-01", description: "Herd acquisition completed" },
      { date: "2025-12-15", description: "Vaccination program initiated" },
      { date: "2026-01-10", description: "First weight check (avg 450kg)" },
    ],
  },
  {
    id: "2",
    name: "Grass-Fed Hereford Lot #28",
    location: "Córdoba, Argentina",
    duration: "24 months",
    expectedReturn: "15-18% APY",
    fundingProgress: 42,
    imageUrl: "/vaca-image-btc.png",
    capitalRequired: 75000,
    currentNAV: 75000,
    breed: "Hereford",
    herdSize: 180,
    category: "Breeding",
    pricePerShare: 380,
    totalShares: 200,
    sharesAvailable: 116,
    producer: {
      name: "Campo Verde SA",
      experience: "22 years, certified organic",
    },
    traceabilityEvents: [
      { date: "2025-10-15", description: "Pasture preparation" },
      { date: "2025-11-20", description: "Herd arrival and quarantine" },
    ],
  },
  {
    id: "3",
    name: "Export-Grade Brahman Lot #15",
    location: "Santa Fe, Argentina",
    duration: "20 months",
    expectedReturn: "10-13% APY",
    fundingProgress: 90,
    imageUrl: "/vaca-image-btc.png",
    capitalRequired: 100000,
    currentNAV: 103000,
    breed: "Brahman",
    herdSize: 200,
    category: "Fattening",
    pricePerShare: 320,
    totalShares: 312,
    sharesAvailable: 31,
    producer: {
      name: "Ganadera del Norte",
      experience: "18 years, export certified",
    },
    traceabilityEvents: [
      { date: "2025-09-01", description: "Contract signed" },
      { date: "2025-10-01", description: "Herd acquisition" },
      { date: "2025-11-01", description: "Health certification" },
      { date: "2025-12-01", description: "First quarter weight gain report" },
    ],
  },
  {
    id: "4",
    name: "Sustainable Wagyu Lot #7",
    location: "Mendoza, Argentina",
    duration: "22 months",
    expectedReturn: "18-22% APY",
    fundingProgress: 15,
    imageUrl: "/vaca-image-btc.png",
    capitalRequired: 150000,
    currentNAV: 150000,
    breed: "Wagyu",
    herdSize: 50,
    category: "Fattening",
    pricePerShare: 450,
    totalShares: 333,
    sharesAvailable: 283,
    producer: {
      name: "Premium Beef Co.",
      experience: "10 years, premium Japanese genetics",
    },
    traceabilityEvents: [
      { date: "2025-12-01", description: "Initial funding phase" },
    ],
  },
  {
    id: "5",
    name: "Organic Charolais Lot #33",
    location: "Entre Ríos, Argentina",
    duration: "19 months",
    expectedReturn: "13-16% APY",
    fundingProgress: 58,
    imageUrl: "/vaca-image-btc.png",
    capitalRequired: 60000,
    currentNAV: 61200,
    breed: "Charolais",
    herdSize: 140,
    category: "Dairy",
    pricePerShare: 290,
    totalShares: 207,
    sharesAvailable: 87,
    producer: {
      name: "Eco Ganadería",
      experience: "12 years, organic certified",
    },
    traceabilityEvents: [
      { date: "2025-10-20", description: "Organic pasture verification" },
      { date: "2025-11-10", description: "Herd purchase from certified supplier" },
      { date: "2025-12-05", description: "Organic feed program started" },
    ],
  },
];

export function getLotById(id: string): Lot | undefined {
  return mockLots.find((lot) => lot.id === id);
}

export function calculateShares(
  amount: number,
  sharePrice: number = 500,
): number {
  return Math.floor(amount / sharePrice);
}

export function calculateParticipation(
  amount: number,
  totalCapital: number = 200000,
): number {
  return parseFloat(((amount / totalCapital) * 100).toFixed(2));
}

export function calculateEstimatedReturn(
  amount: number,
  returnRangeStr: string,
): string {
  // Parse return range like "12-15% APY"
  const match = returnRangeStr.match(/(\d+)-(\d+)%/);
  if (!match) return "$0-$0";

  const lowPercent = Number(match[1]) / 100;
  const highPercent = Number(match[2]) / 100;

  const lowReturn = Math.round(amount * lowPercent);
  const highReturn = Math.round(amount * highPercent);

  return `$${lowReturn.toLocaleString()}-$${highReturn.toLocaleString()}`;
}

/**
 * Investment Position - represents an investor's active position in a lot
 */
export interface Position {
  id: string;
  lotId: string;
  lot: Lot;
  investmentAmount: number;
  shares: number;
  investmentDate: string;
  currentNAV: number;
  initialNAV: number;
  gain: number;
  gainPercentage: number;
  status: "active" | "pending_sale" | "liquidated";
  productionMetrics: {
    totalHeadCount: number;
    avgWeightKg: number;
    totalMeatKg: number;
    pricePerKg: number;
    projectedRevenue: number;
    projectedCosts: number;
  };
  navHistory: {
    date: string;
    value: number;
  }[];
}

export const mockPositions: Position[] = [
  {
    id: "POS-001",
    lotId: "1",
    lot: mockLots[0], // Premium Angus Lot #42
    investmentAmount: 12500,
    shares: 50,
    investmentDate: "2025-11-15",
    currentNAV: 13750,
    initialNAV: 12500,
    gain: 1250,
    gainPercentage: 10.0,
    status: "active",
    productionMetrics: {
      totalHeadCount: 30, // Investor's share of 120 total (25%)
      avgWeightKg: 450,
      totalMeatKg: 13500, // 30 heads × 450kg
      pricePerKg: 8.5,
      projectedRevenue: 114750, // 13500kg × $8.5
      projectedCosts: 31200,
    },
    navHistory: [
      { date: "2025-11-15", value: 12500 },
      { date: "2025-11-30", value: 12650 },
      { date: "2025-12-15", value: 12900 },
      { date: "2025-12-31", value: 13200 },
      { date: "2026-01-15", value: 13500 },
      { date: "2026-01-31", value: 13750 },
    ],
  },
  {
    id: "POS-002",
    lotId: "3",
    lot: mockLots[2], // Export-Grade Brahman Lot #15
    investmentAmount: 32000,
    shares: 100,
    investmentDate: "2025-10-01",
    currentNAV: 35200,
    initialNAV: 32000,
    gain: 3200,
    gainPercentage: 10.0,
    status: "active",
    productionMetrics: {
      totalHeadCount: 64, // 32% of 200 total
      avgWeightKg: 520,
      totalMeatKg: 33280, // 64 heads × 520kg
      pricePerKg: 9.2,
      projectedRevenue: 306176, // 33280kg × $9.2
      projectedCosts: 84500,
    },
    navHistory: [
      { date: "2025-10-01", value: 32000 },
      { date: "2025-10-31", value: 32800 },
      { date: "2025-11-30", value: 33600 },
      { date: "2025-12-31", value: 34400 },
      { date: "2026-01-31", value: 35200 },
    ],
  },
];

export function getPositionById(id: string): Position | undefined {
  return (
    mockPositions.find((position) => position.id === id) ??
    mockPositions.find((position) => position.lotId === id)
  );
}
