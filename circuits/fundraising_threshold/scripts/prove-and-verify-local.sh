#!/usr/bin/env bash
# Test proof generation locally — no wallet, no Starknet needed.
# Run from any directory; this script handles the cd.
# Expected output: "Proof verified successfully"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$CIRCUIT_DIR"

echo "==> Writing Prover.toml..."
cat > Prover.toml << 'EOF'
threshold_percent = "100"
lot_id = "0x1"
funded_shares = "100"
total_shares = "100"
EOF

echo "==> Generating witness..."
nargo execute witness

echo "==> Generating proof..."
bb prove -s ultra_honk --oracle_hash keccak \
  -b target/fundraising_threshold.json \
  -w target/witness.gz \
  -k target/vk/vk \
  -o target

echo "==> Verifying proof locally..."
bb verify -s ultra_honk --oracle_hash keccak \
  -k target/vk/vk \
  -p target/proof \
  -i target/public_inputs

echo ""
echo "✓ Local proof verified. Circuit and VK are correct."
echo "  Next step: garaga gen + deploy verifier to Sepolia (see docs/plans/garaga-status.md)"
