#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3001/api}
PRODUCER_ID=${1:-${PRODUCER_ID:-3}}
LOT_NAME=${LOT_NAME:-"UI Pending Lot $(date +%Y%m%d-%H%M%S)"}
DESCRIPTION=${DESCRIPTION:-"Pending lot created for client-side deploy testing"}
FARM_NAME=${FARM_NAME:-"Estancia UI Demo"}
LOCATION=${LOCATION:-"Pergamino, Buenos Aires"}
PRODUCTION_TYPE=${PRODUCTION_TYPE:-FEEDLOT}
CATTLE_COUNT=${CATTLE_COUNT:-80}
AVERAGE_WEIGHT_KG=${AVERAGE_WEIGHT_KG:-420}
INITIAL_WEIGHT_KG=${INITIAL_WEIGHT_KG:-320}
DURATION_WEEKS=${DURATION_WEEKS:-20}
START_DATE=${START_DATE:-"2026-03-17"}
END_DATE=${END_DATE:-""}
INVESTOR_PERCENT=${INVESTOR_PERCENT:-15}
FUNDING_DEADLINE=${FUNDING_DEADLINE:-""}
OPERATING_COSTS=${OPERATING_COSTS:-45000}
NOTES=${NOTES:-"Created in DRAFT so the UI can handle approval/deploy."}

json_get() {
  local key="$1"
  node -e 'const fs=require("fs");const key=process.argv[1];const data=JSON.parse(fs.readFileSync(0,"utf8"));const value=key.split(".").reduce((acc,k)=>acc&&acc[k],data);if(value===undefined){process.exit(1);}console.log(value);' "$key"
}

post() {
  local path="$1"
  local body="$2"
  curl -fsS -X POST -H "Content-Type: application/json" -d "$body" "$BASE_URL/$path"
}

echo "Using API base: $BASE_URL"
echo "Using producer_id: $PRODUCER_ID"
echo "Lot name: $LOT_NAME"

body=$(PRODUCER_ID="$PRODUCER_ID" \
LOT_NAME="$LOT_NAME" \
DESCRIPTION="$DESCRIPTION" \
FARM_NAME="$FARM_NAME" \
LOCATION="$LOCATION" \
PRODUCTION_TYPE="$PRODUCTION_TYPE" \
CATTLE_COUNT="$CATTLE_COUNT" \
AVERAGE_WEIGHT_KG="$AVERAGE_WEIGHT_KG" \
INITIAL_WEIGHT_KG="$INITIAL_WEIGHT_KG" \
DURATION_WEEKS="$DURATION_WEEKS" \
START_DATE="$START_DATE" \
END_DATE="$END_DATE" \
INVESTOR_PERCENT="$INVESTOR_PERCENT" \
FUNDING_DEADLINE="$FUNDING_DEADLINE" \
OPERATING_COSTS="$OPERATING_COSTS" \
NOTES="$NOTES" \
node -e '
  const body = {
    producerId: Number(process.env.PRODUCER_ID),
    name: process.env.LOT_NAME,
    description: process.env.DESCRIPTION,
    farmName: process.env.FARM_NAME,
    location: process.env.LOCATION,
    productionType: process.env.PRODUCTION_TYPE,
    cattleCount: Number(process.env.CATTLE_COUNT),
    averageWeightKg: Number(process.env.AVERAGE_WEIGHT_KG),
    initialWeightKg: Number(process.env.INITIAL_WEIGHT_KG),
    durationWeeks: Number(process.env.DURATION_WEEKS),
    startDate: process.env.START_DATE,
    investorPercent: Number(process.env.INVESTOR_PERCENT),
    operatingCosts: Number(process.env.OPERATING_COSTS),
    notes: process.env.NOTES,
  };

  if (process.env.END_DATE) body.endDate = process.env.END_DATE;
  if (process.env.FUNDING_DEADLINE) body.fundingDeadline = process.env.FUNDING_DEADLINE;

  process.stdout.write(JSON.stringify(body));
')

echo "Creating lot in DRAFT state (this is the pending pre-deploy state in the backend)..."
lot_json=$(post "lots" "$body")

echo "Response: $lot_json"

lot_id=$(printf '%s' "$lot_json" | json_get "id")
lot_status=$(printf '%s' "$lot_json" | json_get "status")

echo ""
echo "Lot created successfully!"
echo "  lot_id=$lot_id"
echo "  status=$lot_status"
echo ""
echo "DRAFT is the backend state you want before deploying from the UI."
echo "If you want to approve and deploy manually, run:"
echo "  curl -X POST -H 'Content-Type: application/json' -d '{\"tokenName\":\"Demo Token\",\"tokenSymbol\":\"DLT\",\"totalShares\":100000,\"pricePerShare\":100}' $BASE_URL/lots/$lot_id/approve"
