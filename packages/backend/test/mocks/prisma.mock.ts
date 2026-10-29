import { vi } from "vitest";

type Row = Record<string, unknown> & { id: number };

function createMockModel(
  store: Map<number, Row>,
  withRelations: (row: Row) => Row = (row) => row,
  defaults: Record<string, unknown> = {},
) {
  let nextId = 1;

  return {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const record: Row = { ...defaults, ...data, id: nextId++, createdAt: new Date(), updatedAt: new Date() };
      store.set(record.id, record);
      return record;
    }),
    findUnique: vi.fn(async ({ where, include }: { where: { id: number }; include?: unknown }) => {
      const row = store.get(where.id);
      if (!row) return null;
      return include ? withRelations(row) : row;
    }),
    findMany: vi.fn(async ({ include }: { include?: unknown } = {}) =>
      Array.from(store.values()).map((row) => (include ? withRelations(row) : row)),
    ),
    update: vi.fn(
      async ({ where, data, include }: { where: { id: number }; data: Record<string, unknown>; include?: unknown }) => {
        const existing = store.get(where.id);
        if (!existing) throw new Error("Record not found");
        const updated: Row = { ...existing, ...data, updatedAt: new Date() };
        store.set(where.id, updated);
        return include ? withRelations(updated) : updated;
      },
    ),
  };
}

export function createPrismaMock() {
  const producers = new Map<number, Row>();
  const lots = new Map<number, Row>();

  const producerProfile = createMockModel(producers);
  const withProducer = (lot: Row): Row => ({ ...lot, producer: producers.get(lot.producerId as number) ?? null });

  return {
    producerProfile,
    lot: createMockModel(lots, withProducer, { status: "DRAFT" }),
    balance: {
      groupBy: vi.fn(async () => []),
      aggregate: vi.fn(async () => ({ _sum: { available: null, locked: null } })),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
