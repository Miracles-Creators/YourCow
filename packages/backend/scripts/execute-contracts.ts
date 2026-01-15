/**
 * Script to test the Starknet integration
 *
 * Usage:
 *   1. Start devnet: starknet-devnet or katana
 *   2. Run: yarn tsx scripts/execute-contracts.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { RpcProvider, Account, Contract, cairo } from "starknet";
import deployedContracts from "../src/starknet/config/deployed-contracts";

async function main() {
  console.log("🚀 Testing Starknet integration...\n");

  // 1. Setup provider
  const rpcUrl = "http://127.0.0.1:5050/rpc";
  const provider = new RpcProvider({ nodeUrl: rpcUrl });

  console.log(`📡 RPC: ${rpcUrl}`);

  // Verify connection
  try {
    const chainId = await provider.getChainId();
    console.log(`✅ Connected! Chain ID: ${chainId}\n`);
  } catch (e) {
    console.error("❌ Could not connect to the RPC. Is devnet running?");
    process.exit(1);
  }

  // 2. Setup account
  const privateKey = process.env.PROTOCOL_OPERATOR_PRIVATE_KEY;
  const address = process.env.PROTOCOL_OPERATOR_ADDRESS;

  if (!privateKey || !address) {
    console.error(
      "❌ Missing PROTOCOL_OPERATOR_PRIVATE_KEY or PROTOCOL_OPERATOR_ADDRESS in .env"
    );
    process.exit(1);
  }

  const account = new Account({
    provider,
    address,
    signer: privateKey,
  });
  console.log(`👤 Account: ${address}\n`);

  // 3. Get LotFactory contract
  const lotFactoryConfig = deployedContracts.devnet.LotFactory;
  const lotFactory = new Contract({
    abi: lotFactoryConfig.abi,
    address: lotFactoryConfig.address,
    providerOrAccount: account,
  });

  const settlementRegistryConfig = deployedContracts.devnet.SettlementRegistry;
  

  await lotFactory.set_settlement_registry(settlementRegistryConfig.address);

  console.log(`📄 LotFactory: ${lotFactoryConfig.address}\n`);
  console.log(`📄 SettlementRegistry: ${settlementRegistryConfig.address}\n`);

  // 4. Read: get next lot ID
  console.log("📖 Reading next_lot_id...");
  const nextLotId = BigInt((await lotFactory.get_next_lot_id()).toString());
  console.log(`   Next Lot ID: ${nextLotId}\n`);

  // 5. Write: create a lot
  console.log("✍️  Creating new lot...");

  const createParams = {
    issuer: address,
    totalShares: 1000n,
    pricePerShare: 100n,
    metadataHash: "0x1234567890abcdef",
    tokenName: "Test Lot",
    tokenSymbol: "TEST",
  };

  console.log("   Params:", {
    issuer: createParams.issuer.slice(0, 10) + "...",
    totalShares: createParams.totalShares.toString(),
    pricePerShare: createParams.pricePerShare.toString(),
    tokenName: createParams.tokenName,
    tokenSymbol: createParams.tokenSymbol,
  });

  try {
    const tx = await lotFactory.create_lot(
      createParams.issuer,
      cairo.uint256(createParams.totalShares),
      cairo.uint256(createParams.pricePerShare),
      createParams.metadataHash,
      createParams.tokenName,
      createParams.tokenSymbol
    );

    console.log(`\n   ⏳ Transaction hash: ${tx.transaction_hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await provider.waitForTransaction(tx.transaction_hash);
    console.log(`   ✅ Confirmed! Status: ${receipt.statusReceipt}\n`);

    // 6. Read the created lot
    const newLotId = BigInt((await lotFactory.get_next_lot_id()).toString());
    const createdLotId = newLotId - 1n;

    console.log(`📖 Reading created lot (ID: ${createdLotId})...`);
    const lot = await lotFactory.get_lot(cairo.uint256(createdLotId));

    console.log("   Lot data:", {
      issuer: lot.issuer.toString().slice(0, 10) + "...",
      status: Number(lot.status),
      totalShares: lot.total_shares.toString(),
      pricePerShare: lot.initial_price_per_share.toString(),
      createdAt: lot.created_at.toString(),
    });

    // 7. Get token address
    const tokenAddress = await lotFactory.get_shares_token(
      cairo.uint256(createdLotId)
    );
    console.log(`   Token address: ${tokenAddress.toString()}\n`);

    console.log("🎉 Test completed successfully!");

  } catch (error: any) {
    console.error("\n❌ Error creating lot:");
    console.error("   ", error.message || error);

    if (error.message?.includes("Account validation failed")) {
      console.error(
        "\n   💡 Tip: Make sure the account has funds and the correct permissions"
      );
    }
  }
}

main().catch(console.error);
