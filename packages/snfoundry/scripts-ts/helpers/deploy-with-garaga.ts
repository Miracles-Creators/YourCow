#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import dotenv from "dotenv";
import yargs from "yargs";

type NetworkName = "devnet" | "sepolia" | "mainnet";

interface CommandLineOptions {
  _: string[];
  $0: string;
  network?: NetworkName;
  reset?: boolean;
}

const repoRoot = path.resolve(__dirname, "../../../..");
const backendEnvPath = path.join(repoRoot, "packages/backend/.env");
const generateVerifierScript = path.join(
  repoRoot,
  "circuits/fundraising_threshold/scripts/generate-cairo-verifier.sh",
);
const devnetDeployScript = path.join(
  repoRoot,
  "circuits/fundraising_threshold/scripts/deploy-verifier-devnet.sh",
);
const sepoliaDeployScript = path.join(
  repoRoot,
  "circuits/fundraising_threshold/scripts/deploy-verifier-sepolia.sh",
);
const verifierTargetDir = path.join(
  repoRoot,
  "circuits/fundraising_threshold/garaga_verifier/target/dev",
);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseArgs(): CommandLineOptions {
  return yargs(process.argv.slice(2))
    .option("network", {
      type: "string",
      choices: ["devnet", "sepolia", "mainnet"],
      default: "devnet",
      description: "Specify the network to deploy to",
    })
    .option("reset", {
      type: "boolean",
      description: "Reset deployments",
      default: true,
      hidden: true,
    })
    .option("no-reset", {
      type: "boolean",
      description: "Do not reset deployments",
      default: false,
    })
    .demandOption(["network"])
    .strict()
    .help()
    .parseSync() as CommandLineOptions;
}

function runExistingDeploy(network: NetworkName, reset: boolean) {
  const args = [
    "scripts-ts/helpers/deploy-wrapper.ts",
    "--network",
    network,
  ];

  if (!reset) {
    args.push("--no-reset");
  }

  execFileSync("ts-node", args, {
    cwd: path.resolve(__dirname, "../.."),
    stdio: "inherit",
  });
}

function ensureGeneratedVerifier() {
  if (fs.existsSync(verifierTargetDir)) {
    return;
  }

  execFileSync("bash", [generateVerifierScript], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function readBackendEnvVar(envKey: string): string | undefined {
  if (!fs.existsSync(backendEnvPath)) {
    return undefined;
  }

  const content = fs.readFileSync(backendEnvPath, "utf8");
  const match = content.match(new RegExp(`^${envKey}=(.*)$`, "m"));
  return match?.[1]?.trim();
}

function upsertBackendEnvVar(envKey: string, value: string) {
  const line = `${envKey}=${value}`;
  const content = fs.existsSync(backendEnvPath)
    ? fs.readFileSync(backendEnvPath, "utf8")
    : "";

  const updated = content.match(new RegExp(`^${envKey}=.*$`, "m"))
    ? content.replace(new RegExp(`^${envKey}=.*$`, "m"), line)
    : `${content}${content.endsWith("\n") || content.length === 0 ? "" : "\n"}${line}\n`;

  fs.writeFileSync(backendEnvPath, updated);
}

function deployGaraga(network: NetworkName) {
  if (network === "mainnet") {
    console.log("Skipping Garaga verifier deployment on mainnet.");
    return;
  }

  ensureGeneratedVerifier();

  if (network === "devnet") {
    execFileSync("bash", [devnetDeployScript], {
      cwd: repoRoot,
      stdio: "inherit",
    });

    const address = readBackendEnvVar("GARAGA_VERIFIER_ADDRESS_DEVNET")
      ?? readBackendEnvVar("GARAGA_VERIFIER_ADDRESS");
    if (!address) {
      throw new Error(
        "Devnet Garaga verifier deploy completed without writing GARAGA_VERIFIER_ADDRESS_DEVNET.",
      );
    }

    upsertBackendEnvVar("GARAGA_VERIFIER_ADDRESS_DEVNET", address);
    console.log(`Synced GARAGA_VERIFIER_ADDRESS_DEVNET in ${backendEnvPath}`);
    return;
  }

  const privateKey = process.env.PRIVATE_KEY_SEPOLIA;
  const accountAddress = process.env.ACCOUNT_ADDRESS_SEPOLIA;
  if (!privateKey || !accountAddress) {
    throw new Error(
      "Sepolia Garaga deploy requires PRIVATE_KEY_SEPOLIA and ACCOUNT_ADDRESS_SEPOLIA in packages/snfoundry/.env",
    );
  }

  execFileSync("bash", [sepoliaDeployScript], {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      STARKNET_PRIVATE_KEY: privateKey,
      STARKNET_ACCOUNT_ADDRESS: accountAddress,
    },
  });

  const address = readBackendEnvVar("GARAGA_VERIFIER_ADDRESS_SEPOLIA")
    ?? readBackendEnvVar("GARAGA_VERIFIER_ADDRESS");
  if (!address) {
    throw new Error(
      "Sepolia Garaga verifier deploy completed without writing GARAGA_VERIFIER_ADDRESS_SEPOLIA.",
    );
  }

  upsertBackendEnvVar("GARAGA_VERIFIER_ADDRESS_SEPOLIA", address);
  console.log(`Synced GARAGA_VERIFIER_ADDRESS_SEPOLIA in ${backendEnvPath}`);
}

function main() {
  const argv = parseArgs();
  if (argv._.length > 0) {
    throw new Error("Invalid arguments, only --network or --no-reset can be passed in");
  }

  const network = argv.network ?? "devnet";
  const reset = argv.reset !== false;

  runExistingDeploy(network, reset);
  deployGaraga(network);
}

main();
