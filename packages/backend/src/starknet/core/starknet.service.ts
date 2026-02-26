import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { RpcProvider, Account, Contract, Abi } from "starknet";
import deployedContracts from "../config/deployed-contracts";

export type NetworkName = "devnet" | "sepolia" | "mainnet";
export type ContractName = keyof (typeof deployedContracts)["devnet"];

export interface TransactionResult {
  transactionHash: string;
}

@Injectable()
export class StarknetService implements OnModuleInit {
  private readonly logger = new Logger(StarknetService.name);
  private provider!: RpcProvider;
  private operatorAccount!: Account;
  private attestorAccount: Account | null = null;
  private network: NetworkName = "devnet";

  async onModuleInit() {
    this.network = (process.env.ENVIRONMENT as NetworkName) || "devnet";

    const rpcUrl = this.network === "sepolia"
      ? (process.env.STARKNET_RPC_SEPOLIA || "https://api.cartridge.gg/x/starknet/sepolia")
      : (process.env.STARKNET_RPC_DEVNET || "http://127.0.0.1:5050/rpc");
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });

    const operatorKey = this.network === "sepolia"
      ? process.env.SEPOLIA_OPERATOR_PRIVATE_KEY
      : process.env.PROTOCOL_OPERATOR_PRIVATE_KEY;
    const operatorAddr = this.network === "sepolia"
      ? process.env.SEPOLIA_OPERATOR_ADDRESS
      : process.env.PROTOCOL_OPERATOR_ADDRESS;

    if (operatorKey && operatorAddr) {
      this.operatorAccount = new Account({
        provider: this.provider,
        address: operatorAddr,
        signer: operatorKey,
      });
    } else {
      this.logger.warn(
        `Operator keys not set for ${this.network}. Contract write operations will fail.`,
      );
    }

    const attestorPrivateKey = process.env.ATTESTOR_PRIVATE_KEY;
    const attestorAddress = process.env.ATTESTOR_ADDRESS;

    if (attestorPrivateKey && attestorAddress) {
      this.attestorAccount = new Account({
        provider: this.provider,
        address: attestorAddress,
        signer: attestorPrivateKey,
      });
    }

    this.logger.log(`Initialized on ${this.network} (${rpcUrl})`);
  }

  getProvider(): RpcProvider {
    return this.provider;
  }

  getOperatorAccount(): Account {
    if (!this.operatorAccount) {
      throw new Error(`Operator account not configured for ${this.network}`);
    }
    return this.operatorAccount;
  }

  getAttestorAccount(): Account {
    if (!this.attestorAccount) {
      throw new Error("Attestor account not configured");
    }
    return this.attestorAccount;
  }

  getContractConfig(contractName: ContractName) {
    const contracts =
      deployedContracts[this.network as keyof typeof deployedContracts];
    if (!contracts) {
      throw new Error(`No contracts deployed for network: ${this.network}`);
    }

    const contract = contracts[contractName as keyof typeof contracts];
    if (!contract) {
      throw new Error(
        `Contract ${contractName} not found on ${this.network}`
      );
    }

    return contract;
  }

  getContract(contractName: ContractName, account?: Account): Contract {
    const config = this.getContractConfig(contractName);
    const signer = account || this.operatorAccount;

    return new Contract({
      abi: config.abi as Abi,
      address: config.address,
      providerOrAccount: signer,
    });
  }

  getContractReadOnly(contractName: ContractName): Contract {
    const config = this.getContractConfig(contractName);
    return new Contract({
      abi: config.abi as Abi,
      address: config.address,
      providerOrAccount: this.provider,
    });
  }

  // Create a contract instance for a dynamic address (e.g., LotSharesToken per lot)
  getContractAtAddress(abi: Abi, address: string, account?: Account): Contract {
    const signer = account || this.operatorAccount;
    return new Contract({
      abi,
      address,
      providerOrAccount: signer,
    });
  }

  getNetwork(): NetworkName {
    return this.network;
  }

  /**
   * Execute a contract transaction and wait for confirmation.
   * This eliminates the duplicated waitForTransaction pattern across all services.
   */
  async executeTransaction(
    txPromise: Promise<{ transaction_hash: string }>
  ): Promise<string> {
    const tx = await txPromise;
    await this.provider.waitForTransaction(tx.transaction_hash);
    return tx.transaction_hash;
  }
}
