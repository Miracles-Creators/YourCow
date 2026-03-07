#!/bin/bash
# ============================================
# YourCow — Deploy NAVOracle to Sepolia
# ============================================
#
# Usage:
#   ./deploy.sh <PRIVATE_KEY>
#
# Requirements:
#   - Foundry installed (forge)
#   - Wallet with Sepolia ETH (https://sepoliafaucet.com)
#
# Before running, make executable:
#   chmod +x deploy.sh
#

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <PRIVATE_KEY>"
  echo ""
  echo "Get Sepolia ETH from: https://sepoliafaucet.com"
  exit 1
fi

PRIVATE_KEY=$1
RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
CONTRACT_PATH="contracts/NAVOracle.sol:NAVOracle"

echo "=========================================="
echo "  Deploying NAVOracle to Sepolia..."
echo "=========================================="

cd "$(dirname "$0")"

forge create "$CONTRACT_PATH" \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast

echo ""
echo "=========================================="
echo "  Copy the 'Deployed to' address above"
echo "  and paste it in:"
echo "    cre/config.staging.json"
echo "    cre/config.production.json"
echo "=========================================="
