# YourCow Docs (Quick Index)

Last updated: 2026-02-17

## Source of Truth
- Overall architecture + E2E flows: [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)
- Frontend client/backend rules (Zod + Query + Zustand): [`docs/CLIENT_BACKEND_INSTRUCTIONS.md`](CLIENT_BACKEND_INSTRUCTIONS.md)
- Screen execution (templates and prompts): [`docs/EXAMPLE-DESIGN.md`](EXAMPLE-DESIGN.md)
- On-chain MVP specification: [`packages/snfoundry/PROJECT_SPEC.MD`](../packages/snfoundry/PROJECT_SPEC.MD)
- Frontend architecture (deep dive): [`packages/nextjs/ARCHITECTURE.md`](../packages/nextjs/ARCHITECTURE.md)
- Backend architecture (deep dive): [`packages/backend/ARCHITECTURE.md`](../packages/backend/ARCHITECTURE.md)

## Numeric types (repo-wide)

Priority rule: **DB + API + UI use `Int`/`number` for business values** (fiat amounts in smallest unit, share counts, price-per-share, settlement proceeds, etc).

- **Database source of truth:** `packages/backend/prisma/schema.prisma`
- **Backend API:** Use `number` in DTOs/responses for these fields.
- **Frontend:** Zod schemas should parse these fields as `number`.
- **On-chain:** Contracts may use `u256`, but conversion happens only at the on-chain boundary (`packages/backend/src/modules/onchain/*` and scaffold hooks).

## Recommended reading order
1. [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)
2. [`packages/snfoundry/PROJECT_SPEC.MD`](../packages/snfoundry/PROJECT_SPEC.MD)
3. [`docs/CLIENT_BACKEND_INSTRUCTIONS.md`](CLIENT_BACKEND_INSTRUCTIONS.md)
4. [`docs/EXAMPLE-DESIGN.md`](EXAMPLE-DESIGN.md)

## Working rules (for prompts and execution)
- [`docs/WORKING_RULES.md`](WORKING_RULES.md)
- [`global_rules.md`](../global_rules.md) (upstream Scaffold-Stark reference; not source of truth for YourCow)

## Notes
- If a topic appears in more than one file, follow the source of truth above.
- If something is in "Pending Decisions", treat it as undefined.
