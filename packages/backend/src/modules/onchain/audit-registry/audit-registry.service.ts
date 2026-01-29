import { Injectable } from "@nestjs/common";
import { Contract } from "starknet";

import { StarknetService } from "../../../starknet/core/starknet.service";

export type AuditBatchAnchor = {
  batchHash: string;
  fromLedgerId: bigint;
  toLedgerId: bigint;
  timestamp: bigint;
};

@Injectable()
export class AuditRegistryService {
  private contract!: Contract;

  constructor(private readonly starknetService: StarknetService) {}

  private getContract(): Contract {
    if (!this.contract) {
      this.contract = this.starknetService.getContract("AuditRegistry" as never);
    }
    return this.contract;
  }

  async anchorBatch(
    batchId: number,
    batchHash: string,
    fromId: bigint,
    toId: bigint,
  ): Promise<{ transactionHash: string; blockNumber?: number }> {
    const contract = this.getContract();
    const tx = await contract.anchor_batch(
      batchId,
      this.toFelt(batchHash),
      fromId,
      toId,
    );

    const receipt = (await this.starknetService
      .getProvider()
      .waitForTransaction(tx.transaction_hash)) as {
      block_number?: number | string | bigint;
      blockNumber?: number | string | bigint;
    };

    const blockNumberRaw = receipt.block_number ?? receipt.blockNumber;
    const blockNumber =
      blockNumberRaw == null ? undefined : Number(blockNumberRaw);

    return {
      transactionHash: tx.transaction_hash,
      blockNumber: Number.isNaN(blockNumber) ? undefined : blockNumber,
    };
  }

  async getBatch(batchId: number): Promise<AuditBatchAnchor> {
    const contract = this.starknetService.getContractReadOnly(
      "AuditRegistry" as never,
    );

    const result = await contract.get_batch(batchId);

    return {
      batchHash: this.normalizeHash(result.batch_hash.toString()),
      fromLedgerId: BigInt(result.from_ledger_id.toString()),
      toLedgerId: BigInt(result.to_ledger_id.toString()),
      timestamp: BigInt(result.timestamp.toString()),
    };
  }

  private normalizeHash(hash: string): string {
    const normalized = hash.trim().toLowerCase();
    return normalized.startsWith("0x") ? normalized.slice(2) : normalized;
  }

  private toFelt(hash: string): string {
    const normalized = this.normalizeHash(hash);
    return `0x${normalized}`;
  }
}
