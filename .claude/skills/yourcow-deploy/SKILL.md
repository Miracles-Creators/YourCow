---
name: yourcow-deploy
description: Deploy the Your Cow backend to Vercel, run Prisma migrations on the Neon database, or seed demo data (admin, producer, lots, animals), optionally on Starknet Sepolia. Use when asked to deploy, redeploy, migrate, seed, reset demo data, or check that production is up.
---

# Your Cow deploy and seed

Read `packages/backend/docs/DEPLOY.md` first. It is the source of truth for the Vercel project,
env vars, migrations and the seed script.

## Hard rules

- `scripts/seed-demo.sh --onchain`, `POST /lots/:id/approve`, `POST /animals/approve-batch`,
  `POST /settlements/:id/confirm` and any `/api/contracts/*` POST send Starknet transactions.
  Describe them and wait for an explicit "dale" / "go ahead" before running.
- `prisma migrate reset` or any row deletion on the Neon database needs explicit confirmation.
- Never print secrets. Pull env with `vercel env pull` into the scratchpad, never into the repo.

## Checklist

1. `curl https://api.yourcow.xyz/health` returns `{"status":"ok"}`.
2. From the repo root (linked to `your-cow-api`): `vercel deploy --prod`.
3. Migrations: `npx prisma migrate deploy` from `packages/backend` with `DATABASE_URL` set to the
   pulled `DATABASE_URL_UNPOOLED`.
4. Seed: `bash scripts/seed-demo.sh` (DB only), add `--onchain` only with approval.
5. Verify: `GET /api/lots` shows each lot `FUNDING` with `onChainStatus=SYNCED`, and the lot `txHash`
   receipt on Sepolia is `SUCCEEDED`.

## Gotchas

- Use `rtk proxy curl` when you need raw JSON; the shell hook rewrites plain `curl` output into a schema.
- JSON bodies inside `"$(...)"` within an array assignment get brace-expanded by bash. Build the body
  in a variable first.
- Producer profiles have no `id`; their key is `userId`, which is also what `producerId` means on lots.
