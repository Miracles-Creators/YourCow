import { vi } from "vitest";

export function createLotFactoryServiceMock() {
  let lotIdCounter = 1n;

  return {
    createLot: vi.fn(async () => ({
      transactionHash: "0xmocktxhash" + lotIdCounter,
      lotId: lotIdCounter++,
    })),
    getLot: vi.fn(async (lotId: bigint) => ({
      producer: "0xmockproducer",
      status: 1,
      totalShares: 1000n,
      initialPricePerShare: 100n,
      metadataHash: "0xmockhash",
      createdAt: BigInt(Date.now()),
    })),
    getLotStatus: vi.fn(async () => 1),
    setLotStatus: vi.fn(async () => "0xmocktxhash"),
    getSharesToken: vi.fn(async () => "0xmocktokenaddress"),
    getNextLotId: vi.fn(async () => lotIdCounter),
    getInitialPricePerShare: vi.fn(async () => 100n),
    getProtocolOperator: vi.fn(async () => "0xmockoperator"),
  };
}

export function createAnimalRegistryServiceMock() {
  let animalIdCounter = 1n;

  return {
    registerAnimal: vi.fn(async () => ({
      transactionHash: "0xmocktxhash",
      animalId: animalIdCounter++,
    })),
    registerAnimalBatch: vi.fn(async () => "0xmocktxhash"),
    getAnimal: vi.fn(async () => ({
      eid: "AR123456789",
      custodian: "0xmockcustodian",
      status: 0,
      lotId: 1n,
      profileHash: "0xmockhash",
      registeredAt: BigInt(Date.now()),
    })),
    assignToLot: vi.fn(async () => "0xmocktxhash"),
    setAnimalStatus: vi.fn(async () => "0xmocktxhash"),
    transferCustody: vi.fn(async () => "0xmocktxhash"),
  };
}

export function createSettlementRegistryServiceMock() {
  return {
    settleLot: vi.fn(async () => "0xmocktxhash"),
    getSettlement: vi.fn(async () => ({
      lotId: 1n,
      totalProceeds: 100000n,
      finalReportHash: "0xmockhash",
      settledAt: BigInt(Date.now()),
    })),
  };
}
