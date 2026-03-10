#!/usr/bin/env bash
# Deploy the Garaga verifier to local starknet-devnet.
#
# Prerequisites:
#   - starknet-devnet running: yarn chain (or starknet-devnet --seed 0)
#   - garaga_verifier built: scripts/2-gen-verifier.sh
#   - sncast installed (starknet-foundry)
#
# Devnet pre-deployed account (seed 0):
#   Address:     0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691
#   Private key: 0x0000000000000000000000000000000000000000000000000000000000000001
#
# Output: prints the deployed contract address — auto-writes GARAGA_VERIFIER_ADDRESS_DEVNET to backend .env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$(dirname "$SCRIPT_DIR")"
VERIFIER_DIR="$CIRCUIT_DIR/garaga_verifier"
BACKEND_ENV="$CIRCUIT_DIR/../../packages/backend/.env"
RPC_URL="http://127.0.0.1:5050"

ACCOUNT_NAME="devnet-account"
ACCOUNT_ADDRESS="0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
PRIVATE_KEY="0x71d7bb07b9a64f6f78ac4c816aff4da9"

if [ ! -d "$VERIFIER_DIR" ]; then
  echo "Error: garaga_verifier/ not found. Run scripts/2-gen-verifier.sh first."
  exit 1
fi

echo "==> Importing devnet account into sncast..."
sncast account import \
  --url "$RPC_URL" \
  --name "$ACCOUNT_NAME" \
  --address "$ACCOUNT_ADDRESS" \
  --private-key "$PRIVATE_KEY" \
  --type oz \
  --silent 2>/dev/null || true

echo ""
echo "==> Declaring garaga_verifier..."
cd "$VERIFIER_DIR"

DECLARE_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --wait \
  declare \
  --url "$RPC_URL" \
  --contract-name UltraKeccakZKHonkVerifier 2>&1) || true

echo "$DECLARE_OUTPUT"

CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -i "class.hash" | grep -oE "0x[0-9a-fA-F]{10,}" | head -1)

if [ -z "$CLASS_HASH" ]; then
  echo ""
  echo "Could not auto-extract class hash. Paste it:"
  read -r CLASS_HASH
fi

echo ""
echo "==> Deploying garaga_verifier (class hash: $CLASS_HASH)..."

DEPLOY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --wait \
  deploy \
  --url "$RPC_URL" \
  --class-hash "$CLASS_HASH" 2>&1)

echo "$DEPLOY_OUTPUT"

CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -i "contract.address" | grep -oE "0x[0-9a-fA-F]{10,}" | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "Error: could not extract contract address from deploy output."
  exit 1
fi

# Write GARAGA_VERIFIER_ADDRESS_DEVNET to backend .env automatically
if [ -f "$BACKEND_ENV" ]; then
  if grep -q "^GARAGA_VERIFIER_ADDRESS_DEVNET=" "$BACKEND_ENV"; then
    sed -i '' "s|^GARAGA_VERIFIER_ADDRESS_DEVNET=.*|GARAGA_VERIFIER_ADDRESS_DEVNET=$CONTRACT_ADDRESS|" "$BACKEND_ENV"
  else
    echo "GARAGA_VERIFIER_ADDRESS_DEVNET=$CONTRACT_ADDRESS" >> "$BACKEND_ENV"
  fi
  echo ""
  echo "  ✓ Written to $BACKEND_ENV"
else
  echo ""
  echo "  (backend .env not found — set manually)"
fi

echo ""
echo "=========================================="
echo "  ✓ Garaga verifier deployed to devnet!"
echo ""
echo "  Address: $CONTRACT_ADDRESS"
echo "=========================================="
