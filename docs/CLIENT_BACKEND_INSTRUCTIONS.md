# Client <-> Backend Integration Guide (TanStack Query + Zustand + Zod)

Last updated: 2026-02-17

Purpose: This file defines the mandatory pattern for connecting the frontend to the backend.
Use it as the single source of truth for new integrations without inventing architecture.

## Principles
- Zod is the source of truth for types and response validation.
- TanStack Query handles all fetch/mutations and caching.
- Zustand is used for UI/persistent client-side state (only when needed).
- UI must not use mocks for key data; use real API unless explicitly allowed.
- Follow the existing structure in `packages/nextjs/lib/api`, `packages/nextjs/hooks`, `packages/nextjs/services/store`.
- Numeric types: business values are `number` off-chain (DB/API/UI). Convert to on-chain types (e.g. `u256`) only at the on-chain boundary.

## When NOT to use Zustand
- For API data already cached by TanStack Query.
- For screen-local UI state (use React state).
- When no persistence or cross-screen sharing is required.

## Mandatory structure
1) **API layer** in `packages/nextjs/lib/api/*`
2) **Zod schemas** in `packages/nextjs/lib/api/schemas.ts`
3) **TanStack Query hooks** in `packages/nextjs/hooks/*`
4) **Zustand stores** in `packages/nextjs/services/store/*` (only if persistence or global UI state is required)
5) **Adapters** in `packages/nextjs/lib/api/adapters.ts` (for mapping backend DTOs to UI-specific types)
6) **Screens/Components** consume hooks, never fetch directly

## Real examples in this repo
- API client: `packages/nextjs/lib/api/client.ts`
- Zod schemas: `packages/nextjs/lib/api/schemas.ts`
- Lots API: `packages/nextjs/lib/api/lots.ts`
- TanStack Query hooks: `packages/nextjs/hooks/lots/useLot.ts`, `packages/nextjs/hooks/lots/useLots.ts`, `packages/nextjs/hooks/lots/useCreateLot.ts`
- Zustand persist: `packages/nextjs/services/store/lotDraft.ts`
- Adapters: `packages/nextjs/lib/api/adapters.ts`

---

## Pattern: API + Zod + Hook

### 1) Zod schema
Add/update in `packages/nextjs/lib/api/schemas.ts`:
```ts
export const ExampleSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type ExampleDto = z.infer<typeof ExampleSchema>;
```

### 2) API function
Create in `packages/nextjs/lib/api/example.ts`:
```ts
import { apiFetch } from "./client";
import { ExampleSchema, type ExampleDto } from "./schemas";

export async function getExample(id: string): Promise<ExampleDto> {
  const response = await apiFetch<ExampleDto>(`/examples/${id}`);
  return ExampleSchema.parse(response);
}
```

### 3) TanStack Query hook
Create in `packages/nextjs/hooks/example/useExample.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { getExample } from "~~/lib/api/example";

export function useExample(id: string) {
  return useQuery({
    queryKey: ["examples", id],
    queryFn: () => getExample(id),
    enabled: Boolean(id),
  });
}
```

---

## Pattern: Mutation
Real example: `packages/nextjs/hooks/lots/useCreateLot.ts`
```ts
import { useMutation } from "@tanstack/react-query";
import { createLot } from "~~/lib/api/lots";

export function useCreateLot() {
  return useMutation({
    mutationFn: createLot,
  });
}
```

---

## Pattern: Persistent Zustand + Zod
Real example: `packages/nextjs/services/store/lotDraft.ts`

Rules:
- Define a Zod schema for the persisted state.
- Use `persist` + `createJSONStorage`.
- Validate persisted state with Zod inside `merge`.

```ts
export const DraftSchema = z.object({
  name: z.string(),
});
export type Draft = z.infer<typeof DraftSchema>;

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({ draft: DEFAULT, updateDraft: (u) => set(...) }),
    {
      name: "draft_key",
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const parsed = DraftSchema.safeParse((persisted as any)?.state?.draft);
        return { ...current, draft: parsed.success ? parsed.data : current.draft };
      },
    },
  ),
);
```

---

## UI -> API mapping (mandatory)
When a screen sends data:
1) Read from store or form.
2) Validate with Zod if applicable.
3) **Transform data to match backend DTO format** (e.g., convert strings to numbers, map enums).
4) Call mutation hook.
5) Handle loading/error from the hook.

Real example: `packages/nextjs/app/[locale]/(producer)/_components/screens/CreateLotReviewSubmitScreen.tsx`

---

## Schema Design: Columns vs Metadata

### Use structured columns for:
- **Queryable data** - Fields you need to filter/sort by
- **Validatable data** - Fields with strict business rules
- **Auditable data** - Legally relevant information
- **Relational data** - Fields that connect to other models

Examples: `cattleCount`, `averageWeightKg`, `investorPercent`, `fundingDeadline`, `location`

### Use JSON metadata for:
- UI preferences (e.g., `timelineMode`)
- Optional/variable fields that differ per record
- Non-queryable supplemental data
- References to external files (before dedicated `Document` model)

### Backend Prisma example:
```prisma
model Lot {
  // Structured columns (queryable, auditable)
  cattleCount      Int
  averageWeightKg  Int
  investorPercent  Float
  fundingDeadline  DateTime?

  // Flexible metadata (non-critical)
  notes    String?
  metadata Json?
}
```

---

## Checklist: When changing a model

When you modify a Prisma model, update ALL of these:

### Backend
- [ ] `packages/backend/prisma/schema.prisma` - Update model
- [ ] `packages/backend/src/modules/core/<entity>/dto/*.dto.ts` - Update DTOs
- [ ] `packages/backend/src/modules/core/<entity>/*.service.ts` - Update service methods
- [ ] Run `npx prisma migrate dev --name <description>`

### Frontend
- [ ] `packages/nextjs/lib/api/schemas.ts` - Update Zod schema to match backend response
- [ ] `packages/nextjs/lib/api/<entity>.ts` - Update `CreateInput` type if mutation exists
- [ ] `packages/nextjs/lib/api/adapters.ts` - Update adapter if UI uses different shape
- [ ] `packages/nextjs/services/store/*.ts` - Usually NO change (stores form data, not API data)
- [ ] Screen components - Update payload mapping before calling mutation

### Identity fields
- `ProducerProfile` uses `userId` as primary key (not separate `id`)
- When referencing a producer, use `userId` everywhere
- Frontend: `producerMe.data.userId` (not `.id`)

---

## Pre-merge checklist
- [ ] Zod schema exists and validates response.
- [ ] API layer uses `apiFetch` and parses with Zod.
- [ ] TanStack Query hook exists and is used in UI.
- [ ] Zustand store only if persistence/UI state is required.
- [ ] No mocks in key data for this flow.
- [ ] Adapter updated if backend DTO differs from UI type.
- [ ] All identity fields use correct property (e.g., `userId` not `id` for producers).

---

## Endpoint note
Use existing backend endpoints (see Appendix A in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) and [`packages/backend/ARCHITECTURE.md`](../packages/backend/ARCHITECTURE.md)).
If an endpoint is missing, add it in backend following the core/onchain pattern.
