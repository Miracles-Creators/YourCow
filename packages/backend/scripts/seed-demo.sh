#!/usr/bin/env bash
# Seeds a database through the public API with a demo admin, producer, animals and lots.
#
# Usage:
#   BASE_URL=https://<api-host>/api PRODUCER_WALLET=0x... bash scripts/seed-demo.sh            # DB only
#   BASE_URL=https://<api-host>/api PRODUCER_WALLET=0x... bash scripts/seed-demo.sh --onchain  # + Starknet writes
#
# --onchain sends real transactions from the backend operator account (LotFactory.create_lot and
# AnimalRegistry batch register/assign). Only run it with explicit approval.
set -euo pipefail

BASE_URL=${BASE_URL:?set BASE_URL, e.g. http://localhost:3001/api}
PRODUCER_WALLET=${PRODUCER_WALLET:?set PRODUCER_WALLET to a valid Starknet address}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@yourcow.io}
ONCHAIN=false
[ "${1:-}" = "--onchain" ] && ONCHAIN=true

LOT_NAMES=("Braford One" "Braford Two")
ANIMALS_PER_LOT=3

json_get() {
  node -e 'const fs=require("fs");const key=process.argv[1];const data=JSON.parse(fs.readFileSync(0,"utf8"));const value=key.split(".").reduce((acc,k)=>acc&&acc[k],data);if(value===undefined){process.exit(1);}console.log(value);' "$1"
}

SESSION_COOKIE=""

get() {
  curl -sS --fail-with-body "$BASE_URL/$1"
}

# Prints the field of the first list item whose email (or user.email) matches, or nothing.
find_by_email() {
  node -e 'const [email,field]=process.argv.slice(1);const list=JSON.parse(require("fs").readFileSync(0,"utf8"));const hit=list.find((x)=>(x.email??x.user?.email)===email);if(hit)console.log(hit[field]);' "$2" "$3" <<< "$(get "$1")"
}

post() {
  curl -sS --fail-with-body -X POST -H "Content-Type: application/json" -H "Cookie: $SESSION_COOKIE" -d "$2" "$BASE_URL/$1"
}

# Read the cookie from the header instead of a cookie jar: COOKIE_DOMAIN may not match BASE_URL's host.
login_as() {
  SESSION_COOKIE=$(curl -sS --fail-with-body -D - -o /dev/null -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\"}" "$BASE_URL/auth/login" | grep -i '^set-cookie: yc_session=' | sed -E 's/^[^:]+: ([^;]+).*/\1/')
  [ -n "$SESSION_COOKIE" ] || { echo "Login as $1 failed" >&2; exit 1; }
}

echo "Using API base: $BASE_URL (onchain=$ONCHAIN)"

echo "Creating admin $ADMIN_EMAIL..."
admin_id=$(find_by_email "admins" "$ADMIN_EMAIL" "id")
[ -n "$admin_id" ] || admin_id=$(post "admins" "{\"email\":\"$ADMIN_EMAIL\",\"name\":\"Demo Admin\"}" | json_get "id")
login_as "$ADMIN_EMAIL"

echo "Creating and approving producer..."
producer_user_id=$(find_by_email "producers" "producer@yourcow.io" "userId")
if [ -z "$producer_user_id" ]; then
  producer_user_id=$(post "producers" "{\"name\":\"Demo Producer\",\"email\":\"producer@yourcow.io\",\"senasaId\":\"RENSPA-001\",\"location\":\"Cordoba, AR\",\"phone\":\"+54 351 555 1234\",\"yearsOperating\":12,\"walletAddress\":\"$PRODUCER_WALLET\"}" | json_get "userId")
fi
[ "$(get "producers/$producer_user_id" | json_get "status")" = "ACTIVE" ] || \
  post "producers/$producer_user_id/approve" "{\"approvedById\":$admin_id}" > /dev/null

echo "Creating investor..."
investor_wallet=$(node -e 'console.log("0x"+require("crypto").randomBytes(31).toString("hex"))')
post "investors" "{\"walletAddress\":\"$investor_wallet\",\"email\":\"investor@yourcow.io\",\"name\":\"Demo Investor\"}" > /dev/null 2>&1 \
  || echo "  investor already exists"

for lot_index in "${!LOT_NAMES[@]}"; do
  lot_name=${LOT_NAMES[$lot_index]}
  echo "Creating lot '$lot_name' (DRAFT)..."
  lot_id=$(post "lots" "{\"producerId\":$producer_user_id,\"name\":\"$lot_name\",\"description\":\"Demo feedlot lot\",\"farmName\":\"Estancia Demo\",\"location\":\"Pergamino, Buenos Aires\",\"productionType\":\"FEEDLOT\",\"cattleCount\":80,\"averageWeightKg\":420,\"initialWeightKg\":320,\"durationWeeks\":20,\"investorPercent\":15,\"operatingCosts\":45000}" | json_get "id")

  animal_ids=()
  for n in $(seq 1 "$ANIMALS_PER_LOT"); do
    animal_body="{\"eid\":\"EID-$lot_id-$n\",\"custodian\":\"$producer_user_id\",\"initialWeightGrams\":320000,\"lotId\":$lot_id,\"profile\":{\"breed\":\"Braford\",\"birthDate\":\"2025-01-01\"}}"
    animal_id=$(post "animals" "$animal_body" | json_get "id")
    animal_ids+=("$animal_id")
  done
  echo "  lot_id=$lot_id animals=${animal_ids[*]}"

  if [ "$ONCHAIN" = true ]; then
    symbol="BRF$((lot_index + 1))"
    echo "  Approving lot on-chain (LotFactory.create_lot)..."
    post "lots/$lot_id/approve" "{\"tokenName\":\"$lot_name\",\"tokenSymbol\":\"$symbol\",\"totalShares\":1000,\"pricePerShare\":100,\"producerAddress\":\"$PRODUCER_WALLET\"}" > /dev/null
    echo "  Registering animals on-chain and assigning them to the lot..."
    ids_csv=$(IFS=,; echo "${animal_ids[*]}")
    post "animals/approve-batch" "{\"lotId\":$lot_id,\"animalIds\":[$ids_csv]}" > /dev/null
  fi
done

echo ""
echo "Done. Log in to the admin panel with $ADMIN_EMAIL."
[ "$ONCHAIN" = false ] && echo "Lots are DRAFT. Approve them from the admin UI or re-run on a fresh DB with --onchain."
exit 0
