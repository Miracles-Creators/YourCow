#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3001/api}
WALLET_ADDRESS=${1:-}
EMAIL=${2:-}
NAME=${3:-}

if [ -z "$WALLET_ADDRESS" ]; then
  WALLET_ADDRESS=$(node -e 'console.log("0x"+require("crypto").randomBytes(20).toString("hex"))')
fi

if [ -z "$EMAIL" ]; then
  EMAIL="investor+$(date +%s)@demo.local"
fi

if [ -z "$NAME" ]; then
  NAME="Demo Investor"
fi

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
echo "Wallet address: $WALLET_ADDRESS"
echo "Email: $EMAIL"
echo "Name: $NAME"

echo "Creating investor profile..."
investor_json=$(post "investors" "{
  \"walletAddress\":\"$WALLET_ADDRESS\",
  \"email\":\"$EMAIL\",
  \"name\":\"$NAME\"
}")

echo "Response: $investor_json"

investor_id=$(printf '%s' "$investor_json" | json_get "id")

echo ""
echo "Investor created successfully!"
echo "  investor_id=$investor_id"
echo "  wallet_address=$WALLET_ADDRESS"
echo "  email=$EMAIL"
