# Backend to Vercel: findings (2026-10-29)

> Done the same day. The runbook is `packages/backend/docs/DEPLOY.md`; this file is the historical audit.

## Current state (checked today)
- Old Railway project and its Postgres are gone. `api.yourcow.xyz` still CNAMEs to a dead Railway host.
- Frontend `app.yourcow.xyz` on Vercel is alive. It reads `NEXT_PUBLIC_API_URL`.

## What Vercel needs
1. **New Postgres.** Railway DB is dead. Provision one from the Vercel Marketplace (e.g. Neon), set `DATABASE_URL` (pooled URL), run `prisma migrate deploy` + seed.
2. **New Vercel project for `packages/backend`.** Root dir `packages/backend`, Yarn workspace install from repo root, build runs `prisma generate` then `nest build`. Vercel runs NestJS natively; confirm the entry point detection works with `src/main.ts` (it calls `app.listen`).
3. **NAV relay cannot run as-is.** `NavRelayService` uses viem `watchContractEvent` (polls every 15s forever). Serverless functions do not stay alive. Options:
   - Vercel Cron hitting a new endpoint that reads `getLogs` since the last processed block (stored in DB) and relays. Per-minute cron needs Pro; Hobby is daily only.
   - Or keep `ENABLE_NAV_RELAY=false` on Vercel and run the relay elsewhere.
   - **Decision 2026-10-29: leave it off.** Checked: nothing in the backend or frontend reads the Starknet NavOracle; the relay only writes to it. The investor NAV chart comes from the backend API (DB), not from chain. The relay is opt-in (`ENABLE_NAV_RELAY` must be `"true"`), so no code change is needed.
4. **Env vars** to copy from `packages/backend/.env`: `ENVIRONMENT=sepolia`, `STARKNET_RPC_SEPOLIA`, `SEPOLIA_OPERATOR_*`, `ATTESTOR_*`, `NAV_ORACLE_*`, `SEPOLIA_EVM_RPC_URL`, `RELAY_HMAC_SECRET`, `ORACLE_API_KEY`, `GARAGA_VERIFIER_ADDRESS`. Plus new: `DATABASE_URL`, `CORS_ORIGIN=https://app.yourcow.xyz`, `COOKIE_DOMAIN=.yourcow.xyz`, new `AUTH_SECRET`, `NODE_ENV=production`.
5. **Domain.** Point `api.yourcow.xyz` to the new Vercel project; check the frontend's `NEXT_PUBLIC_API_URL`.
6. Long requests: writes call `waitForTransaction`. Default function timeout is 300s, enough.

## Blockchain health (checked today, read-only, no transactions sent)
| Item | Result |
|---|---|
| Cartridge Starknet Sepolia RPC | alive, spec 0.9.0, starknet.js 8.5.3 connects |
| LotFactory, AnimalRegistry, TraceabilityOracle, SettlementRegistry, AuditRegistry, NavOracle (Cairo) | deployed, OK |
| Tongo contract | deployed, OK |
| Operator account | exists, ~296 STRK, fee estimate on a dummy invoke OK |
| EVM Sepolia RPC (publicnode) | alive |
| NAVOracle.sol on EVM Sepolia | code present |
| Tip estimation warning | still appears; already handled with `tip: 0` |

## Not verified
- Chainlink CRE workflow still running on the DON (not checked).
- Tongo SDK: we pin 1.3.1 (patched), latest is 2.0.0. Contract is alive; an actual Tongo read through the SDK was not run.
- starknet.js latest is 10.8.0; we are on 8.5.3. Works today with RPC 0.9; would break if Cartridge drops 0.9.
- Garaga module needs `GARAGA_VERIFIER_ADDRESS` deployed (was a stash blocker).

## Security note
Railway had a security incident (2026-10-21) and advised rotating env vars stored there. The Sepolia operator key was stored on Railway: rotate it (testnet, low value, but still).
