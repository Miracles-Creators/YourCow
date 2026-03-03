#!/usr/bin/env bash
# seed-test.sh — Create all test data needed for the full investor flow
#
# Creates:
#   - 1 admin (for approvals)
#   - 1 producer (with wallet, approved)
#   - 1 seller investor
#   - 1 buyer investor
#   - 1 lot with full data (DRAFT → approved → deployed on-chain)
#
# Usage:
#   cd packages/backend && bash scripts/seed-test.sh
#
# Env vars:
#   BASE_URL         — default: http://localhost:3001/api
#   PRODUCER_WALLET  — StarkNet address for the producer (required for on-chain deploy)
#   SELLER_WALLET    — StarkNet address for the seller
#   BUYER_WALLET     — StarkNet address for the buyer
#
# If emails already exist, reset the DB first:
#   yarn prisma migrate reset

set -uo pipefail
# Note: intentionally NOT using `set -e` — we handle errors explicitly via `die`
# because `set -e` does NOT catch failures inside $() command substitutions.

BASE_URL=${BASE_URL:-http://localhost:3001/api}
PRODUCER_WALLET=${PRODUCER_WALLET:-0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7}
SELLER_WALLET=${SELLER_WALLET:-0x02dd1b492765c064eac4039e3841aa5f382773b598097a40073bd8d48a3fc54b}
BUYER_WALLET=${BUYER_WALLET:-0x078662e7352d062084b0010068b99288486c2d8b914f6e2a55ce945f8792c8b}

# ─── helpers ────────────────────────────────────────────────────────────────

die() {
  echo
  echo "ERROR: $*" >&2
  echo "Tip: if emails already exist in the DB, run: yarn prisma migrate reset" >&2
  exit 1
}

# post <path> <body> — fails loudly on HTTP 4xx/5xx via curl -f
post() {
  local path="$1"
  local body="$2"
  local resp
  # curl -f returns exit code 22 on HTTP errors (4xx/5xx)
  resp=$(curl -sS -f -X POST -H "Content-Type: application/json" -d "$body" "$BASE_URL/$path") \
    || die "POST $path failed — HTTP error. Response:\n$(curl -sS -X POST -H 'Content-Type: application/json' -d "$body" "$BASE_URL/$path" 2>&1)"
  echo "$resp"
}

# post_no_fail <path> <body> — like post but swallows HTTP errors (for optional steps)
post_no_fail() {
  local path="$1"
  local body="$2"
  curl -sS -X POST -H "Content-Type: application/json" -d "$body" "$BASE_URL/$path" 2>/dev/null || true
}

json_get() {
  local resp="$1"
  local key="$2"
  local val
  val=$(printf '%s' "$resp" | node -e '
    const key = process.argv[1];
    const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const val = key.split(".").reduce((a, k) => a && a[k], data);
    if (val === undefined || val === null) { process.exit(1); }
    console.log(val);
  ' "$key") || die "Could not extract '$key' from response: $resp"
  echo "$val"
}

step() { echo; echo "── $* ──"; }

# ─── start ──────────────────────────────────────────────────────────────────

echo "Base URL : $BASE_URL"
echo "Producer : $PRODUCER_WALLET"
echo "Seller   : $SELLER_WALLET"
echo "Buyer    : $BUYER_WALLET"

# ─── 1. Admin ───────────────────────────────────────────────────────────────
step "Creating admin"
admin_json=$(post "admins" '{"email":"admin@test.com","name":"Test Admin"}') \
  || die "Admin creation failed"
admin_id=$(json_get "$admin_json" "id")
echo "  admin_id=$admin_id  role=$(json_get "$admin_json" "role")"

# ─── 2. Producer ────────────────────────────────────────────────────────────
step "Creating producer"
producer_json=$(post "producers" "{
  \"name\":\"Estancia Demo\",
  \"email\":\"producer@test.com\",
  \"senasaId\":\"RENSPA-TEST-001\",
  \"location\":\"Pergamino, Buenos Aires\",
  \"phone\":\"+54 11 5555 1234\",
  \"yearsOperating\":10,
  \"walletAddress\":\"$PRODUCER_WALLET\"
}") || die "Producer creation failed"
producer_id=$(json_get "$producer_json" "userId")
echo "  producer_id=$producer_id"

step "Approving producer"
approve_producer_json=$(post "producers/$producer_id/approve" "{\"approvedById\":$admin_id}") \
  || die "Producer approval failed"
echo "  status=$(json_get "$approve_producer_json" "status")"

# ─── 3. Seller investor ─────────────────────────────────────────────────────
step "Creating seller investor"
seller_json=$(post "investors" "{
  \"walletAddress\":\"$SELLER_WALLET\",
  \"email\":\"seller@test.com\",
  \"name\":\"Test Seller\"
}") || die "Seller creation failed"
seller_id=$(json_get "$seller_json" "id")
echo "  seller_id=$seller_id"

# ─── 4. Buyer investor ──────────────────────────────────────────────────────
step "Creating buyer investor"
buyer_json=$(post "investors" "{
  \"walletAddress\":\"$BUYER_WALLET\",
  \"email\":\"buyer@test.com\",
  \"name\":\"Test Buyer\"
}") || die "Buyer creation failed"
buyer_id=$(json_get "$buyer_json" "id")
echo "  buyer_id=$buyer_id"

# ─── 5. Lot (DRAFT) ─────────────────────────────────────────────────────────
step "Creating lot"
lot_json=$(post "lots" "{
  \"producerId\":$producer_id,
  \"name\":\"Angus Premium Feedlot Q1-2026\",
  \"description\":\"High-quality Angus cattle fattening operation in Buenos Aires province. Target weight: 480kg. Export-grade beef.\",
  \"farmName\":\"Estancia Demo\",
  \"location\":\"Pergamino, Buenos Aires\",
  \"productionType\":\"FEEDLOT\",
  \"cattleCount\":80,
  \"averageWeightKg\":420,
  \"initialWeightKg\":320,
  \"durationWeeks\":20,
  \"startDate\":\"2026-01-15\",
  \"investorPercent\":15,
  \"operatingCosts\":45000,
  \"notes\":\"Demo lot for full integration test\"
}") || die "Lot creation failed"
lot_id=$(json_get "$lot_json" "id")
echo "  lot_id=$lot_id  status=$(json_get "$lot_json" "status")"

# ─── Summary ────────────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════"
echo " Seed complete"
echo "════════════════════════════════════"
echo "  admin_id    = $admin_id   (admin@test.com)"
echo "  producer_id = $producer_id  (producer@test.com)"
echo "  seller_id   = $seller_id   (seller@test.com)"
echo "  buyer_id    = $buyer_id   (buyer@test.com)"
echo "  lot_id      = $lot_id     (status: DRAFT)"
echo
echo "Next steps:"
echo "  1. Start devnet (if not running)"
echo "  2. Approve & deploy the lot on-chain:"
echo "     curl -X POST -H 'Content-Type: application/json' -d '{\"tokenName\":\"Angus Premium Q1 2026\",\"tokenSymbol\":\"APQ1\",\"totalShares\":1000,\"pricePerShare\":150,\"producerAddress\":\"$PRODUCER_WALLET\"}' $BASE_URL/lots/$lot_id/approve"
echo "  3. Log in as seller@test.com → buy shares"
echo "  4. Sell shares from position detail"
echo "  5. Log in as buyer@test.com → buy on /p2p"
