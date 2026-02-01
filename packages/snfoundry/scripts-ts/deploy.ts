import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  assertDeployerDefined,
  assertRpcNetworkActive,
  assertDeployerSignable,
  declareContract,
} from "./deploy-contract";
import { green, red, yellow } from "./helpers/colorize-log";

/**
 * Deploy a contract using the specified parameters.
 *
 * @example (deploy contract with constructorArgs)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contract: "YourContract",
 *       contractName: "YourContractExportName",
 *       constructorArgs: {
 *         owner: deployer.address,
 *       },
 *       options: {
 *         maxFee: BigInt(1000000000000)
 *       }
 *     }
 *   );
 * };
 *
 * @example (deploy contract without constructorArgs)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contract: "YourContract",
 *       contractName: "YourContractExportName",
 *       options: {
 *         maxFee: BigInt(1000000000000)
 *       }
 *     }
 *   );
 * };
 *
 *
 * @returns {Promise<void>}
 */

/**
 * YourCow Protocol Deployment Script
 *
 * Deploys all YourCow contracts in the correct order:
 * 1. LotSharesToken - Declare only (to get class hash for LotFactory)
 * 2. LotFactory - Creates and manages lots (uses LotSharesToken class hash)
 * 3. AnimalRegistry - Registers animals (ERC721-like)
 * 4. TraceabilityOracle - Anchors traceability data
 * 5. SettlementRegistry - Handles lot settlement
 *
 * Note: LotSharesToken instances are deployed per-lot by LotFactory.create_lot()
 */

const deployYourCowProtocol = async (): Promise<void> => {
  console.log(yellow("\n📦 Deploying YourCow Protocol Contracts...\n"));

  // The deployer acts as both owner and protocol_operator for initial setup
  // In production, these should be different addresses
  const owner = deployer.address;
  const protocolOperator = deployer.address;
  const attestor = deployer.address; // For MVP, deployer is also attestor

  // 1. Declare LotSharesToken to get its class hash (needed by LotFactory)
  // We deploy a "dummy" instance just to declare it and get the class hash
  // This instance won't be used - LotFactory will deploy real instances via create_lot()
  console.log(yellow("1/6 Declaring LotSharesToken (for class hash)..."));
  const lotSharesToken = await declareContract({
    contract: "LotSharesToken",
    contractName: "LotSharesToken_ClassHash",
  })
 

  const lotSharesTokenClassHash = lotSharesToken.classHash;
  console.log(yellow(`   LotSharesToken class hash: ${lotSharesTokenClassHash}`));

  // 2. Deploy LotFactory with the LotSharesToken class hash
  console.log(yellow("2/6 Deploying LotFactory..."));
  const lotFactory = await deployContract({
    contract: "LotFactory",
    constructorArgs: {
      owner: owner,
      protocol_operator: protocolOperator,
      shares_token_class_hash: lotSharesTokenClassHash,
    },
  });

  // 3. Deploy AnimalRegistry
  console.log(yellow("3/6 Deploying AnimalRegistry..."));
  await deployContract({
    contract: "AnimalRegistry",
    constructorArgs: {
      owner: owner,
      protocol_operator: protocolOperator,
      lot_factory: lotFactory.address,
    },
  });

  // 4. Deploy TraceabilityOracle
  console.log(yellow("4/6 Deploying TraceabilityOracle..."));
  await deployContract({
    contract: "TraceabilityOracle",
    constructorArgs: {
      owner: owner,
      attestor: attestor,
    },
  });

  // 5. Deploy SettlementRegistry
  console.log(yellow("5/6 Deploying SettlementRegistry..."));
  await deployContract({
    contract: "SettlementRegistry",
    constructorArgs: {
      owner: owner,
      protocol_operator: protocolOperator,
      lot_factory: lotFactory.address,
    },
  });

  //6- Deploy Audit Registry
  console.log(yellow("6/6 Deploying AuditRegistry..."));
  await deployContract({
    contract: "AuditRegistry",
    constructorArgs: {
      owner: owner,
      operator: protocolOperator,
    },
  });

  console.log(green("\n✅ YourCow Protocol deployed successfully!\n"));
  console.log(yellow("Note: After deployment, you need to:"));
  console.log(yellow("  1. Call LotFactory.set_settlement_registry(settlement_registry_address)"));
  console.log(yellow("  2. LotSharesToken will be deployed automatically when calling LotFactory.create_lot()\n"));
};

// Original example contract deployment
const deployYourContract = async (): Promise<void> => {
  await deployContract({
    contract: "YourContract",
    constructorArgs: {
      owner: deployer.address,
    },
  });
};

const main = async (): Promise<void> => {
  try {
    assertDeployerDefined();

    await Promise.all([assertRpcNetworkActive(), assertDeployerSignable()]);

    // Deploy YourCow Protocol
    await deployYourCowProtocol();

    // Deploy the example contract
    await deployYourContract();

    await executeDeployCalls();
    exportDeployments();

    console.log(green("All Setup Done!"));
  } catch (err) {
    if (err instanceof Error) {
      console.error(red(err.message));
    } else {
      console.error(err);
    }
    process.exit(1); //exit with error so that non subsequent scripts are run
  }
};

main();
