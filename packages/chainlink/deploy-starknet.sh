#!/bin/bash
# ============================================
# YourCow — Deploy NavOracle.cairo to Starknet Sepolia
# ============================================
#
# Usage:
#   ./deploy-starknet.sh
#
# Requirements:
#   - sncast installed (Starknet Foundry)
#   - scarb installed
#   - .env file with STARKNET_PRIVATE_KEY, STARKNET_ACCOUNT_ADDRESS
#   - Account funded with STRK on Sepolia

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "${STARKNET_PRIVATE_KEY:-}" ] || [ -z "${STARKNET_ACCOUNT_ADDRESS:-}" ]; then
  echo "Error: Set STARKNET_PRIVATE_KEY and STARKNET_ACCOUNT_ADDRESS in .env"
  exit 1
fi

RPC_URL="https://api.cartridge.gg/x/starknet/sepolia"
CONTRACTS_DIR="$SCRIPT_DIR/../snfoundry/contracts"
SNCAST_GLOBAL="--account yourcow-deployer --wait"

echo "=========================================="
echo "  Building contracts..."
echo "=========================================="
cd "$CONTRACTS_DIR"
scarb build

echo ""
echo "=========================================="
echo "  Importing sncast account..."
echo "=========================================="

sncast account import \
  --url "$RPC_URL" \
  --name yourcow-deployer \
  --address "$STARKNET_ACCOUNT_ADDRESS" \
  --private-key "$STARKNET_PRIVATE_KEY" \
  --type oz \
  --silent 2>/dev/null || true

echo ""
echo "=========================================="
echo "  Declaring NavOracle..."
echo "=========================================="

# --account is a GLOBAL option (before subcommand) in sncast 0.51.x
DECLARE_OUTPUT=$(sncast $SNCAST_GLOBAL \
  declare \
  --url "$RPC_URL" \
  --contract-name NavOracle 2>&1) || true

echo "$DECLARE_OUTPUT"

# Extract class hash (try both "class_hash: 0x..." and "class_hash: 0x..." formats)
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -oE "0x[0-9a-fA-F]{50,}" | head -1)

if [ -z "$CLASS_HASH" ]; then
  echo "Error: Could not extract class_hash from declare output."
  echo "Paste the class hash:"
  read -r CLASS_HASH
fi

echo ""
echo "Class hash: $CLASS_HASH"

echo ""
echo "=========================================="
echo "  Deploying NavOracle..."
echo "=========================================="
echo "  owner:    $STARKNET_ACCOUNT_ADDRESS"
echo "  operator: $STARKNET_ACCOUNT_ADDRESS"
echo "=========================================="

DEPLOY_OUTPUT=$(sncast --account yourcow-deployer --wait \
  deploy \
  --url "$RPC_URL" \
  --class-hash "$CLASS_HASH" \
  --constructor-calldata "$STARKNET_ACCOUNT_ADDRESS" "$STARKNET_ACCOUNT_ADDRESS" 2>&1)

echo "$DEPLOY_OUTPUT"

CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE "0x[0-9a-fA-F]{50,}" | tail -1)

echo ""
echo "=========================================="
echo "  NavOracle.cairo deployed!"
echo ""
echo "  Address: $CONTRACT_ADDRESS"
echo ""
echo "  Next steps:"
echo "    1. Set NAV_ORACLE_STARKNET_ADDRESS=$CONTRACT_ADDRESS in backend .env"
echo "    2. Update deployed-contracts.ts if needed"
echo "    3. After CRE broadcast, call set_operator() with the relay address"
echo "=========================================="
