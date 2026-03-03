// Lot types
export enum LotStatus {
  ACTIVE = 1,
  PAUSED = 2,
  SETTLED = 3,
}

export interface Lot {
  producer: string; 
  status: number;
  totalShares: bigint;
  initialPricePerShare: bigint;
  metadataHash: string;
  createdAt: bigint;
}

export interface CreateLotParams {
  producer: string; 
  totalShares: bigint;
  initialPricePerShare: bigint;
  metadataHash: string;
  tokenName: string;
  tokenSymbol: string;
}

// Animal types
export enum AnimalStatus {
  ALIVE = 1,
  SOLD = 2,
  DECEASED = 3,
  REMOVED = 4,
}

export interface Animal {
  custodian: string;
  status: number;
  currentLotId: bigint;
  profileHash: string;
  createdAt: bigint;
}

export interface RegisterAnimalParams {
  animalId: bigint;
  custodian: string;
  profileHash: string;
  initialWeightGrams: number;
}

export interface RegisterAnimalBatchParams {
  animalsWithWeights: { animalId: bigint; initialWeightGrams: number }[];
  custodians: string[];
  profileHashes: string[];
}

// Traceability types
export interface TraceAnchor {
  root: string;
  timestamp: bigint;
  eventCount: number;
}

export interface AnchorTraceParams {
  animalId: bigint;
  root: string;
  eventCount: number;
}

export interface AnchorTraceBatchParams {
  animalIds: bigint[];
  roots: string[];
  eventCounts: number[];
}

export interface CorrectTraceParams {
  animalId: bigint;
  newRoot: string;
  newEventCount: number;
  correctionReason: string;
}

// Settlement types
export interface Settlement {
  settledAt: bigint;
  finalReportHash: string;
  totalProceeds: bigint;
  settledBy: string;
}

export interface SettleLotParams {
  lotId: bigint;
  finalReportHash: string;
  totalProceeds: bigint;
}
