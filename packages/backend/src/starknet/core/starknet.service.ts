import { Injectable, OnModuleInit } from "@nestjs/common";
import { RpcProvider, Account, Contract, Abi } from "starknet";
import deployedContracts from "../config/deployed-contracts";

export type NetworkName = "devnet" | "sepolia" | "mainnet";
export type ContractName = keyof (typeof deployedContracts)["devnet"];

export interface TransactionResult {
  transactionHash: string;
}

@Injectable()
export class StarknetService implements OnModuleInit {
  private provider!: RpcProvider;
  private protocolOperatorAccount!: Account;
  private attestorAccount: Account | null = null;
  private network: NetworkName = "devnet";

  async onModuleInit() {
    this.network = (process.env.STARKNET_NETWORK as NetworkName) || "devnet";

    const rpcUrl =
      process.env.STARKNET_RPC_URL || "http://127.0.0.1:5050/rpc";

    this.provider = new RpcProvider({ nodeUrl: rpcUrl });

    // Protocol Operator Account - main signer for most operations
    const operatorPrivateKey = process.env.PROTOCOL_OPERATOR_PRIVATE_KEY;
    const operatorAddress = process.env.PROTOCOL_OPERATOR_ADDRESS;

    if (!operatorPrivateKey || !operatorAddress) {
      console.warn(
        "WARNING: PROTOCOL_OPERATOR_PRIVATE_KEY or PROTOCOL_OPERATOR_ADDRESS not set. " +
          "Contract write operations will fail."
      );
    } else {
      this.protocolOperatorAccount = new Account({
        provider: this.provider,
        address: operatorAddress,
        signer: operatorPrivateKey,
      });
    }

    // Attestor Account - for TraceabilityOracle operations (optional)
    const attestorPrivateKey = process.env.ATTESTOR_PRIVATE_KEY;
    const attestorAddress = process.env.ATTESTOR_ADDRESS;

    if (attestorPrivateKey && attestorAddress) {
      this.attestorAccount = new Account({
        provider: this.provider,
        address: attestorAddress,
        signer: attestorPrivateKey,
      });
    }

    console.log(`Starknet service initialized on ${this.network}`);
  }

  getProvider(): RpcProvider {
    return this.provider;
  }

  getProtocolOperatorAccount(): Account {
    if (!this.protocolOperatorAccount) {
      throw new Error("Protocol Operator account not configured");
    }
    return this.protocolOperatorAccount;
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
    const signer = account || this.protocolOperatorAccount;

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
    const signer = account || this.protocolOperatorAccount;
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
