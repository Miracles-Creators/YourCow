import { vi } from "vitest";

// In-memory store for tests
const stores = {
  producer: new Map<string, unknown>(),
  lot: new Map<string, unknown>(),
  investor: new Map<string, unknown>(),
  animal: new Map<string, unknown>(),
  payment: new Map<string, unknown>(),
  settlement: new Map<string, unknown>(),
  traceabilityEvent: new Map<string, unknown>(),
};

function createMockModel<T>(store: Map<string, unknown>) {
  return {
    create: vi.fn(async ({ data }: { data: T }) => {
      const id = crypto.randomUUID();
      const record = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(id, record);
      return record;
    }),
    findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
      if (where.id) return store.get(where.id) || null;
      return null;
    }),
    findMany: vi.fn(async () => Array.from(store.values())),
    update: vi.fn(
      async ({ where, data }: { where: { id: string }; data: Partial<T> }) => {
        const existing = store.get(where.id);
        if (!existing) throw new Error("Record not found");
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.set(where.id, updated);
        return updated;
      }
    ),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const existing = store.get(where.id);
      store.delete(where.id);
      return existing;
    }),
  };
}

export function createPrismaMock() {
  // Clear stores before each use
  Object.values(stores).forEach((store) => store.clear());

  return {
    producer: createMockModel(stores.producer),
    lot: createMockModel(stores.lot),
    investor: createMockModel(stores.investor),
    animal: createMockModel(stores.animal),
    payment: createMockModel(stores.payment),
    settlement: createMockModel(stores.settlement),
    traceabilityEvent: createMockModel(stores.traceabilityEvent),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
