import { Injectable } from "@nestjs/common";
import { Contract, cairo } from "starknet";
import { StarknetService } from "../../../starknet/core/starknet.service";
import { Lot, LotStatus, CreateLotParams } from "../../../starknet/types";

@Injectable()
export class LotFactoryService {
  private contract!: Contract;

  constructor(private starknetService: StarknetService) {}

  private getContract(): Contract {
    if (!this.contract) {
      this.contract = this.starknetService.getContract("LotFactory");
    }
    return this.contract;
  }

  async createLot(params: CreateLotParams): Promise<{
    transactionHash: string;
    lotId: bigint;
  }> {
    const contract = this.getContract();

    // Note: contract still uses 'issuer' field, will be renamed in future deploy
    const tx = await contract.create_lot(
      params.producer,
      cairo.uint256(params.totalShares),
      cairo.uint256(params.initialPricePerShare),
      params.metadataHash,
      params.tokenName,
      params.tokenSymbol
    );

    const receipt = await this.starknetService
      .getProvider()
      .waitForTransaction(tx.transaction_hash);

    let lotId: bigint = 0n;
    if (receipt.value) {
      lotId = BigInt(receipt.value.toString());
    }

    return {
      transactionHash: tx.transaction_hash,
      lotId,
    };
  }

  async getLot(lotId: bigint): Promise<Lot> {
    const contract = this.starknetService.getContractReadOnly("LotFactory");
    const result = await contract.get_lot(cairo.uint256(lotId));

    return {
      producer: result.issuer.toString(), // mapped from contract's issuer field
      status: Number(result.status),
      totalShares: BigInt(result.total_shares.toString()),
      initialPricePerShare: BigInt(result.initial_price_per_share.toString()),
      metadataHash: result.metadata_hash.toString(),
      createdAt: BigInt(result.created_at.toString()),
    };
  }

  async getLotStatus(lotId: bigint): Promise<LotStatus> {
    const contract = this.starknetService.getContractReadOnly("LotFactory");
    const result = await contract.get_lot_status(cairo.uint256(lotId));
    return Number(result) as LotStatus;
  }

  async setLotStatus(lotId: bigint, newStatus: LotStatus): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.set_lot_status(cairo.uint256(lotId), newStatus)
    );
  }

  async getSharesToken(lotId: bigint): Promise<string> {
    const contract = this.starknetService.getContractReadOnly("LotFactory");
    const result = await contract.get_shares_token(cairo.uint256(lotId));
    return result.toString();
  }

  async getNextLotId(): Promise<bigint> {
    const contract = this.starknetService.getContractReadOnly("LotFactory");
    const result = await contract.get_next_lot_id();
    return BigInt(result.toString());
  }

  async getInitialPricePerShare(lotId: bigint): Promise<bigint> {
    const contract = this.starknetService.getContractReadOnly("LotFactory");
    const result = await contract.get_initial_price_per_share(
      cairo.uint256(lotId)
    );
    return BigInt(result.toString());
  }

  async getProtocolOperator(): Promise<string> {
    const contract = this.starknetService.getContractReadOnly("LotFactory");
    const result = await contract.get_protocol_operator();
    return result.toString();
  }
}
