#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3001/api}
PRODUCER_ID=${1:-1}

json_get() {
  local key="$1"
  node -e 'const fs=require("fs");const key=process.argv[1];const data=JSON.parse(fs.readFileSync(0,"utf8"));const value=key.split(".").reduce((acc,k)=>acc&&acc[k],data);if(value===undefined){process.exit(1);}console.log(value);' "$key"
}

post() {
  local path="$1"
  local body="$2"
  curl -sS -X POST -H "Content-Type: application/json" -d "$body" "$BASE_URL/$path"
}

echo "Using API base: $BASE_URL"
echo "Using producer_id: $PRODUCER_ID"

echo "Creating lot (DRAFT state)..."
lot_json=$(post "lots" "{
  \"producerId\":$PRODUCER_ID,
  \"name\":\"Demo Lot\",
  \"description\":\"Initial test lot for cattle fattening\",
  \"farmName\":\"Estancia La Demo\",
  \"location\":\"Córdoba, Argentina\",
  \"productionType\":\"FEEDLOT\",
  \"cattleCount\":50,
  \"averageWeightKg\":350,
  \"initialWeightKg\":300,
  \"durationWeeks\":16,
  \"investorPercent\":70,
  \"operatingCosts\":5000,
  \"notes\":\"Demo lot for testing\"
}")

echo "Response: $lot_json"

lot_id=$(printf '%s' "$lot_json" | json_get "id")

echo ""
echo "Lot created successfully!"
echo "  lot_id=$lot_id"
echo ""
echo "To approve, run:"
echo "  curl -X POST -H 'Content-Type: application/json' -d '{\"tokenName\":\"Demo Token\",\"tokenSymbol\":\"DLT\",\"totalShares\":100000,\"pricePerShare\":100}' $BASE_URL/lots/$lot_id/approve"
