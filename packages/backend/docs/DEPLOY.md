# Backend deploy and demo seed

Production backend runs on **Vercel** (project `your-cow-api`) with a **Neon** Postgres (free plan,
installed through the Vercel Marketplace). Railway is gone as of 2026-10.

## Where things live

| Piece | Value |
|---|---|
| Vercel project | `your-cow-api`, root directory `packages/backend`, NestJS preset |
| Build command | `npx prisma generate && yarn build` |
| Public URL | `https://api.yourcow.xyz` (fallback `https://your-cow-api.vercel.app`) |
| Health check | `GET /health` (no `/api` prefix) |
| Database | Neon resource `your-cow-db`; it injects `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, etc. |
| Frontend | Vercel project `your-cow-nextjs`, reads `NEXT_PUBLIC_API_URL=https://api.yourcow.xyz/api` |
| Chain | Starknet Sepolia (`ENVIRONMENT=sepolia`), contracts in `src/starknet/config/deployed-contracts.ts` |

The project is not connected to GitHub (the Vercel GitHub app has no access to the repo), so deploys
are manual from the repo root, which is linked to `your-cow-api`:

```bash
vercel deploy --prod
```

## Environment variables

Set in Vercel (production). Values come from `packages/backend/.env` unless noted.

- Chain: `ENVIRONMENT`, `STARKNET_RPC_SEPOLIA`, `SEPOLIA_OPERATOR_PRIVATE_KEY`, `SEPOLIA_OPERATOR_ADDRESS`,
  `PROTOCOL_VAULT_ADDRESS`, `TONGO_MASTER_KEY`, `GARAGA_VERIFIER_ADDRESS`.
- NAV relay: `ENABLE_NAV_RELAY=false`, `NAV_ORACLE_ADDRESS`, `NAV_ORACLE_STARKNET_ADDRESS`, `SEPOLIA_EVM_RPC_URL`.
- Web: `NODE_ENV=production`, `CORS_ORIGIN=https://app.yourcow.xyz`, `COOKIE_DOMAIN=.yourcow.xyz`,
  `AUTH_SECRET` (random, production only), `ORACLE_API_KEY`, `RELAY_HMAC_SECRET`.
- DB: injected by the Neon integration.

`COOKIE_DOMAIN=.yourcow.xyz` means login only works when the API is served from a `yourcow.xyz`
subdomain. Through `*.vercel.app` the browser drops the session cookie.

### NAV relay stays off

`NavRelayService` polls the EVM NAVOracle forever, which a serverless function cannot do. Nothing in
the backend or frontend reads the Starknet NavOracle (the investor NAV chart comes from the DB), so
the relay is disabled. Turning it on would need a cron endpoint that reads logs since the last
processed block.

## Database migrations

Run from `packages/backend` with the **unpooled** URL:

```bash
vercel env pull /tmp/prod.env --environment production --yes
DATABASE_URL="<DATABASE_URL_UNPOOLED from that file>" npx prisma migrate deploy
```

## Demo seed

`scripts/seed-demo.sh` builds the demo through the public API: an admin, an approved producer, an
investor, and two lots with three animals each.

```bash
BASE_URL=https://api.yourcow.xyz/api PRODUCER_WALLET=<starknet address> bash scripts/seed-demo.sh            # DB only
BASE_URL=https://api.yourcow.xyz/api PRODUCER_WALLET=<starknet address> bash scripts/seed-demo.sh --onchain  # + Starknet writes
```

- Admin, producer and investor are reused if they already exist; lots and animals are always new.
- `--onchain` logs in as the admin and calls `POST /lots/:id/approve` (`LotFactory.create_lot`, which
  also deploys the lot's shares token) and `POST /animals/approve-batch` (registers the animals and
  assigns them to the lot). Each lot leaves `FUNDING` with `onChainStatus=SYNCED`.
- **`--onchain` sends real Sepolia transactions from the operator account. Never run it without
  explicit approval.**
- `PRODUCER_WALLET` must be a real Starknet address; `create_lot` rejects anything else.
- Animals must be approved before a lot is fully sold: a full mint moves the on-chain lot to FUNDED
  and `approve-batch` requires ACTIVE.

## Login

Login is email only (`POST /api/auth/login`), a temporary demo setup: anyone who knows the admin
email can log in as admin. The seeded admin is `admin@yourcow.io`.

## Admin-only routes

`AdminGuard` (`src/modules/core/auth/admin.guard.ts`) protects every route that spends operator gas:
all `/api/contracts/*`, `POST /api/lots/:id/approve`, `POST /api/animals/approve-batch` and
`POST /api/settlements/:id/confirm`.
