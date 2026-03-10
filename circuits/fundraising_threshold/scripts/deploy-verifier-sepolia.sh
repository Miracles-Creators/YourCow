#!/usr/bin/env bash
# Deploy the Garaga verifier to Starknet Sepolia.
#
# Prerequisites:
#   - garaga_verifier built: scripts/2-gen-verifier.sh
#   - sncast 0.57.0+ installed
#   - STARKNET_PRIVATE_KEY and STARKNET_ACCOUNT_ADDRESS in .env (same dir as this script)
#     or exported in the environment.
#   - Account funded with STRK on Sepolia (get from https://faucet.starknet.io)
#
# Notes:
#   - Uses a fixed salt for deterministic address.
#   - sncast 0.57.0 may warn "RPC spec version mismatch (0.9.0 vs 0.10.0)" — ignore, txs succeed.
#   - casm-add-pythonic-hints must be false (already patched by 2-gen-verifier.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$(dirname "$SCRIPT_DIR")"
VERIFIER_DIR="$CIRCUIT_DIR/garaga_verifier"
BACKEND_ENV="$CIRCUIT_DIR/../../packages/backend/.env"
RPC_URL="https://api.cartridge.gg/x/starknet/sepolia"
ACCOUNT_NAME="yourcow-deployer-sepolia"
SALT="0x1234"  # Fixed salt — same VK + same salt = same address every deploy

# Load .env from script directory (optional)
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

if [ -z "${STARKNET_PRIVATE_KEY:-}" ] || [ -z "${STARKNET_ACCOUNT_ADDRESS:-}" ]; then
  echo "Error: Set STARKNET_PRIVATE_KEY and STARKNET_ACCOUNT_ADDRESS"
  echo "  Either export them or create $SCRIPT_DIR/.env"
  exit 1
fi

if [ ! -d "$VERIFIER_DIR" ]; then
  echo "Error: garaga_verifier/ not found. Run scripts/2-gen-verifier.sh first."
  exit 1
fi

echo "==> Importing Sepolia account into sncast..."
sncast account import \
  --url "$RPC_URL" \
  --name "$ACCOUNT_NAME" \
  --address "$STARKNET_ACCOUNT_ADDRESS" \
  --private-key "$STARKNET_PRIVATE_KEY" \
  --type oz \
  --silent 2>/dev/null || true

echo ""
echo "==> Declaring UltraKeccakZKHonkVerifier on Sepolia..."
cd "$VERIFIER_DIR"

DECLARE_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --wait \
  declare \
  --url "$RPC_URL" \
  --contract-name UltraKeccakZKHonkVerifier 2>&1) || true

echo "$DECLARE_OUTPUT"

CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -oE "0x[0-9a-fA-F]{50,}" | head -1)

if [ -z "$CLASS_HASH" ]; then
  echo ""
  echo "Declare may have found an existing class hash (already declared) or failed."
  echo "Paste the class hash (or leave empty to abort):"
  read -r CLASS_HASH
  if [ -z "$CLASS_HASH" ]; then
    exit 1
  fi
fi

echo ""
echo "==> Deploying (class hash: $CLASS_HASH, salt: $SALT)..."

DEPLOY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --wait \
  deploy \
  --url "$RPC_URL" \
  --class-hash "$CLASS_HASH" \
  --salt "$SALT" 2>&1)

echo "$DEPLOY_OUTPUT"

CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -i "contract.address" | grep -oE "0x[0-9a-fA-F]{10,}" | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "Error: could not extract contract address from deploy output."
  exit 1
fi

# Write GARAGA_VERIFIER_ADDRESS to backend .env automatically
if [ -f "$BACKEND_ENV" ]; then
  if grep -q "^GARAGA_VERIFIER_ADDRESS=" "$BACKEND_ENV"; then
    sed -i '' "s|^GARAGA_VERIFIER_ADDRESS=.*|GARAGA_VERIFIER_ADDRESS=$CONTRACT_ADDRESS|" "$BACKEND_ENV"
  else
    echo "GARAGA_VERIFIER_ADDRESS=$CONTRACT_ADDRESS" >> "$BACKEND_ENV"
  fi
  echo ""
  echo "  ✓ Written to $BACKEND_ENV"
else
  echo ""
  echo "  (backend .env not found — set manually)"
fi

echo ""
echo "=========================================="
echo "  ✓ Garaga verifier deployed to Sepolia!"
echo ""
echo "  Address:    $CONTRACT_ADDRESS"
echo "  Class hash: $CLASS_HASH"
echo ""
echo "  Remaining manual step:"
echo "    Set ENVIRONMENT=sepolia in packages/backend/.env"
echo "=========================================="
