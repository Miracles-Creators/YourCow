#!/usr/bin/env bash
# E2E test: generate real proof → format Garaga calldata → call verifier on devnet.
#
# Prerequisites:
#   - starknet-devnet running: yarn chain (starknet-devnet --seed 0)
#   - garaga_verifier deployed to devnet: scripts/3-deploy-devnet.sh
#   - GARAGA_VERIFIER_ADDRESS set (env var or .env in backend)
#
# What this tests:
#   1. nargo execute → bb prove (real proof)
#   2. garaga calldata → formats proof for Starknet
#   3. sncast invoke → calls verifier on devnet
#   4. Confirms the tx succeeds (proof is valid)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$(dirname "$SCRIPT_DIR")"
RPC_URL="http://127.0.0.1:5050"

ACCOUNT_NAME="devnet-account"
ACCOUNT_ADDRESS="0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
PRIVATE_KEY="0x71d7bb07b9a64f6f78ac4c816aff4da9"

# Load the devnet verifier first, then fall back to the generic address.
if [ -z "${GARAGA_VERIFIER_ADDRESS:-}" ]; then
  BACKEND_ENV="$CIRCUIT_DIR/../../packages/backend/.env"
  if [ -f "$BACKEND_ENV" ]; then
    GARAGA_VERIFIER_ADDRESS=$(grep "^GARAGA_VERIFIER_ADDRESS_DEVNET=" "$BACKEND_ENV" | cut -d= -f2)
    if [ -z "${GARAGA_VERIFIER_ADDRESS:-}" ]; then
      GARAGA_VERIFIER_ADDRESS=$(grep "^GARAGA_VERIFIER_ADDRESS=" "$BACKEND_ENV" | cut -d= -f2)
    fi
  fi
fi

if [ -z "${GARAGA_VERIFIER_ADDRESS:-}" ]; then
  echo "Error: GARAGA_VERIFIER_ADDRESS not set."
  echo "Deploy first: scripts/3-deploy-devnet.sh"
  echo "Then set GARAGA_VERIFIER_ADDRESS in packages/backend/.env"
  exit 1
fi

echo "==> Verifier address: $GARAGA_VERIFIER_ADDRESS"
echo ""

cd "$CIRCUIT_DIR"

echo "==> Step 1: Generate witness + proof..."
cat > Prover.toml << 'EOF'
threshold_percent = "100"
lot_id = "0x1"
funded_shares = "100"
total_shares = "100"
EOF

nargo execute witness

bb prove -s ultra_honk --oracle_hash keccak \
  -b target/fundraising_threshold.json \
  -w target/witness.gz \
  -k target/vk/vk \
  -o target

echo ""
echo "==> Step 2: Verify proof locally..."
bb verify -s ultra_honk --oracle_hash keccak \
  -k target/vk/vk \
  -p target/proof \
  -i target/public_inputs

echo ""
echo "==> Step 3: Generate Garaga calldata..."
# starkli format: "<total_len> <elem0> <elem1> ..." — space-separated decimals, ready for sncast
CALLDATA=$(garaga calldata \
  --system ultra_keccak_zk_honk \
  --vk target/vk/vk \
  --proof target/proof \
  --public-inputs target/public_inputs \
  --format starkli)

echo "  Calldata generated (${#CALLDATA} chars)"
echo ""

echo "==> Step 4: Import devnet account..."
sncast account import \
  --url "$RPC_URL" \
  --name "$ACCOUNT_NAME" \
  --address "$ACCOUNT_ADDRESS" \
  --private-key "$PRIVATE_KEY" \
  --type oz \
  --silent 2>/dev/null || true

echo ""
echo "==> Step 5: Invoke verifier on devnet..."
sncast --account "$ACCOUNT_NAME" --wait \
  invoke \
  --url "$RPC_URL" \
  --contract-address "$GARAGA_VERIFIER_ADDRESS" \
  --function "verify_ultra_keccak_zk_honk_proof" \
  --calldata $CALLDATA 2>&1 | tee /tmp/garaga_invoke.txt

INVOKE_OUTPUT=$(cat /tmp/garaga_invoke.txt)

if echo "$INVOKE_OUTPUT" | grep -qi "invoke completed\|success"; then
  echo ""
  echo "=========================================="
  echo "  ✓ E2E proof verification PASSED on devnet!"
  echo "=========================================="
else
  echo ""
  echo "ERROR: On-chain verification may have failed. Check output above."
  exit 1
fi
