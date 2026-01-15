import { Injectable } from "@nestjs/common";
import { Contract, cairo, Abi } from "starknet";
import { StarknetService } from "../../../starknet/core/starknet.service";
import externalContracts from "../../../starknet/config/external-contracts";
import { LotFactoryService } from "../lot-factory/lot-factory.service";

type ExternalNetwork = keyof typeof externalContracts;

@Injectable()
export class LotSharesTokenService {
  constructor(
    private starknetService: StarknetService,
    private lotFactoryService: LotFactoryService
  ) {}

  private getTokenAbi(): Abi {
    const network = this.starknetService.getNetwork() as ExternalNetwork;
    const contracts = externalContracts[network];
    if (!contracts?.LotSharesToken) {
      throw new Error(`LotSharesToken not configured for network: ${String(network)}`);
    }
    return contracts.LotSharesToken.abi as Abi;
  }

  // Get token contract for a specific lot
  async getTokenContract(lotId: bigint): Promise<Contract> {
    const tokenAddress = await this.lotFactoryService.getSharesToken(lotId);
    const abi = this.getTokenAbi();

    return this.starknetService.getContractAtAddress(abi, tokenAddress);
  }

  async getTokenContractReadOnly(lotId: bigint): Promise<Contract> {
    const tokenAddress = await this.lotFactoryService.getSharesToken(lotId);
    const abi = this.getTokenAbi();

    return new Contract({
      abi,
      address: tokenAddress,
      providerOrAccount: this.starknetService.getProvider(),
    });
  }

  // Mint shares to an investor
  async mint(lotId: bigint, to: string, amount: bigint): Promise<string> {
    const contract = await this.getTokenContract(lotId);
    return this.starknetService.executeTransaction(
      contract.mint(to, cairo.uint256(amount))
    );
  }

  // Freeze token transfers (called during settlement)
  async freeze(lotId: bigint): Promise<string> {
    const contract = await this.getTokenContract(lotId);
    return this.starknetService.executeTransaction(contract.freeze());
  }

  // Read-only methods

  async getName(lotId: bigint): Promise<string> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.name();
    return result.toString();
  }

  async getSymbol(lotId: bigint): Promise<string> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.symbol();
    return result.toString();
  }

  async getDecimals(lotId: bigint): Promise<number> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.decimals();
    return Number(result);
  }

  async getTotalSupply(lotId: bigint): Promise<bigint> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.total_supply();
    return BigInt(result.toString());
  }

  async getTotalShares(lotId: bigint): Promise<bigint> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.total_shares();
    return BigInt(result.toString());
  }

  async getBalanceOf(lotId: bigint, account: string): Promise<bigint> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.balance_of(account);
    return BigInt(result.toString());
  }

  isFrozen = async (lotId: bigint): Promise<boolean> => {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.is_frozen();
    return Boolean(result);
  }

  async isFullyFunded(lotId: bigint): Promise<boolean> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.is_fully_funded();
    return Boolean(result);
  }

  async getAllowance(
    lotId: bigint,
    owner: string,
    spender: string
  ): Promise<bigint> {
    const contract = await this.getTokenContractReadOnly(lotId);
    const result = await contract.allowance(owner, spender);
    return BigInt(result.toString());
  }
}
