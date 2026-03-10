import { networks } from "./helpers/networks";
import { green, red, yellow } from "./helpers/colorize-log";
import yargs from "yargs";
import path from "path";
import fs from "fs";
import { Contract, CallData } from "starknet";

interface Arguments {
  network: string;
  [x: string]: unknown;
  _: (string | number)[];
  $0: string;
}

const argv = yargs(process.argv.slice(2))
  .option("network", {
    type: "string",
    choices: ["devnet", "sepolia", "mainnet"],
    default: "devnet",
    description: "Specify the network",
  })
  .parseSync() as Arguments;

const networkName = argv.network;

const main = async (): Promise<void> => {
  const { provider, deployer } = networks[networkName];

  if (!deployer) {
    throw new Error(
      `❌ Deployer not configured for ${networkName}. Check your .env file.`
    );
  }

  const deploymentsPath = path.resolve(
    __dirname,
    `../deployments/${networkName}_latest.json`
  );

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      `❌ No deployments found for ${networkName}. Run yarn deploy --network ${networkName} first.`
    );
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

  const lotFactoryAddress = deployments["LotFactory"]?.address;
  const settlementRegistryAddress = deployments["SettlementRegistry"]?.address;

  if (!lotFactoryAddress) throw new Error("❌ LotFactory address not found in deployments.");
  if (!settlementRegistryAddress) throw new Error("❌ SettlementRegistry address not found in deployments.");

  console.log(yellow(`\n🔗 Setting SettlementRegistry on LotFactory (${networkName})...\n`));
  console.log(yellow(`   LotFactory:          ${lotFactoryAddress}`));
  console.log(yellow(`   SettlementRegistry:  ${settlementRegistryAddress}\n`));

  const { transaction_hash } = await deployer.execute([
    {
      contractAddress: lotFactoryAddress,
      entrypoint: "set_settlement_registry",
      calldata: CallData.compile({ settlement_registry: settlementRegistryAddress }),
    },
  ]);

  console.log(yellow(`   tx hash: ${transaction_hash}`));

  if (networkName !== "devnet") {
    console.log(yellow("   Waiting for confirmation..."));
    const receipt = await provider.waitForTransaction(transaction_hash);
    const receiptAny = receipt as any;
    if (receiptAny.execution_status !== "SUCCEEDED") {
      throw new Error(`❌ Transaction failed: ${receiptAny.revert_reason}`);
    }
  }

  console.log(green("\n✅ SettlementRegistry set successfully!\n"));
};

main().catch((err) => {
  console.error(red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
