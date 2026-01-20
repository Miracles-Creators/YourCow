#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3001/api}

json_get() {
  local key="$1"
  node -e 'const fs=require("fs");const key=process.argv[1];const data=JSON.parse(fs.readFileSync(0,"utf8"));const value=key.split(".").reduce((acc,k)=>acc&&acc[k],data);if(value===undefined){process.exit(1);}console.log(value);' "$key"
}

post() {
  local path="$1"
  local body="$2"
  curl -sS -X POST -H "Content-Type: application/json" -d "$body" "$BASE_URL/$path"
}

get() {
  local path="$1"
  curl -sS "$BASE_URL/$path"
}

echo "Using API base: $BASE_URL"

echo "Creating admin..."
admin_json=$(post "admins" '{"email":"admin+demo@yourcow.io","name":"Demo Admin"}')
admin_id=$(printf '%s' "$admin_json" | json_get "id")


echo "Creating investor..."
investor_json=$(post "investors" '{"walletAddress":"0xINVESTOR1","email":"investor+demo@yourcow.io","name":"Demo Investor"}')
investor_id=$(printf '%s' "$investor_json" | json_get "id")


echo "Creating producer..."
producer_json=$(post "producers" '{"name":"Demo Producer","email":"producer+demo@yourcow.io","senasaId":"RENSPA-001","location":"Cordoba, AR","phone":"+54 351 555 1234","yearsOperating":12,"walletAddress":"0xPRODUCER1"}')
producer_id=$(printf '%s' "$producer_json" | json_get "id")
producer_user_id=$(printf '%s' "$producer_json" | json_get "user.id")


echo "Creating lot..."
lot_json=$(post "lots" "{\"producerId\":\"$producer_id\",\"name\":\"Demo Lot\",\"description\":\"Initial test lot\",\"totalShares\":\"100000\",\"pricePerShare\":\"100\",\"metadata\":{\"location\":\"Buenos Aires\",\"expectedAnimals\":10}}")
lot_id=$(printf '%s' "$lot_json" | json_get "id")


echo "Registering animal..."
animal_json=$(post "animals" "{\"eid\":\"EID-0001\",\"custodian\":\"$producer_user_id\",\"profile\":{\"breed\":\"Hereford\",\"birthDate\":\"2024-01-01\",\"initialWeight\":250}}")
animal_id=$(printf '%s' "$animal_json" | json_get "id")


echo "Creating payment..."
payment_json=$(post "payments" "{\"paymentIntentId\":\"pi_demo_001\",\"investorId\":\"$investor_id\",\"lotId\":\"$lot_id\",\"amountFiat\":10000,\"currency\":\"USD\",\"sharesAmount\":\"100\"}")
payment_id=$(printf '%s' "$payment_json" | json_get "id")


echo "Creating settlement..."
settlement_json=$(post "settlements" "{\"lotId\":\"$lot_id\",\"totalProceeds\":\"100000\",\"currency\":\"USD\",\"finalReportHash\":\"0xREPORT\",\"finalTotalWeightGrams\":2500000,\"finalAverageWeightGrams\":250000,\"initialTotalWeightGrams\":2400000}")
settlement_id=$(printf '%s' "$settlement_json" | json_get "id")


echo "\nCreated records:"
echo "  admin_id=$admin_id"
echo "  investor_id=$investor_id"
echo "  producer_id=$producer_id"
echo "  lot_id=$lot_id"
echo "  animal_id=$animal_id"
echo "  payment_id=$payment_id"
echo "  settlement_id=$settlement_id"

echo "\nSample reads:"
get "lots/$lot_id" | head -c 200; echo
get "payments/lot/$lot_id" | head -c 200; echo
get "settlements/lot/$lot_id" | head -c 200; echo
