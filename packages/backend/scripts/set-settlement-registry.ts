/**
 * Set LotFactory settlement registry (one-time setup after deploy).
 *
 * Usage:
 *   yarn tsx scripts/set-settlement-registry.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { Account, Contract, RpcProvider } from "starknet";
import deployedContracts from "../src/starknet/config/deployed-contracts";

async function main() {
  const rpcUrl = process.env.STARKNET_RPC_URL ?? "http://127.0.0.1:5050/rpc";
  const provider = new RpcProvider({ nodeUrl: rpcUrl });

  const privateKey = process.env.PROTOCOL_OPERATOR_PRIVATE_KEY;
  const address = process.env.PROTOCOL_OPERATOR_ADDRESS;

  if (!privateKey || !address) {
    console.error(
      "Missing PROTOCOL_OPERATOR_PRIVATE_KEY or PROTOCOL_OPERATOR_ADDRESS in .env"
    );
    process.exit(1);
  }

  const account = new Account({
    provider,
    address,
    signer: privateKey,
  });

  const lotFactoryConfig = deployedContracts.devnet.LotFactory;
  const settlementRegistryConfig = deployedContracts.devnet.SettlementRegistry;

  if (!lotFactoryConfig?.address || !settlementRegistryConfig?.address) {
    console.error("Missing LotFactory or SettlementRegistry address in deployed-contracts");
    process.exit(1);
  }

  const lotFactory = new Contract({
    abi: lotFactoryConfig.abi,
    address: lotFactoryConfig.address,
    providerOrAccount: account,
  });

  console.log("Setting settlement registry...");
  console.log(`LotFactory: ${lotFactoryConfig.address}`);
  console.log(`SettlementRegistry: ${settlementRegistryConfig.address}`);

  const tx = await lotFactory.set_settlement_registry(
    settlementRegistryConfig.address
  );
  console.log(`Transaction hash: ${tx.transaction_hash}`);

  await provider.waitForTransaction(tx.transaction_hash);
  console.log("Settlement registry set successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
