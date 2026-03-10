#!/usr/bin/env bash
# Generate Cairo verifier from the existing VK.
# Run this whenever the circuit changes (nargo build + bb write_vk first).
# Output: garaga_verifier/ — a Scarb package ready to declare/deploy.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$CIRCUIT_DIR"

echo "==> Verifying tool alignment..."
garaga --version

echo ""
echo "==> Removing previous garaga_verifier (if any)..."
rm -rf garaga_verifier

echo ""
echo "==> Running garaga gen..."
garaga gen \
  --system ultra_keccak_zk_honk \
  --vk target/vk/vk \
  --project-name garaga_verifier

echo ""
echo "==> Fixing Scarb.toml (casm-add-pythonic-hints must be false for Sepolia)..."
# garaga gen sets this to true by default — Sepolia rejects the resulting CASM hash
sed -i '' 's/casm-add-pythonic-hints = true/casm-add-pythonic-hints = false/' \
  garaga_verifier/Scarb.toml

echo ""
echo "==> Building Cairo verifier..."
cd garaga_verifier
scarb build

echo ""
echo "✓ garaga_verifier built successfully."
echo "  Artifacts: garaga_verifier/target/dev/"
echo "  Next: run scripts/3-deploy-devnet.sh to deploy locally."
