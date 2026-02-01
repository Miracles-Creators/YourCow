import { Injectable } from "@nestjs/common";
import { Contract, num } from "starknet";

import { StarknetService } from "../../../starknet/core/starknet.service";
import { normalizeHash } from "../../../utils/hash";

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
  ): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.anchor_batch(
        batchId,
        this.toFelt(batchHash),
        fromId,
        toId,
      )
    );
  }

  async getBatch(batchId: number): Promise<AuditBatchAnchor> {
    const contract = this.starknetService.getContractReadOnly(
      "AuditRegistry" as never,
    );

    const result = await contract.get_batch(batchId);

    return {
      batchHash: normalizeHash(num.toHex(result.batch_hash)),
      fromLedgerId: BigInt(result.from_ledger_id.toString()),
      toLedgerId: BigInt(result.to_ledger_id.toString()),
      timestamp: BigInt(result.timestamp.toString()),
    };
  }

  private toFelt(hash: string): string {
    const normalized = normalizeHash(hash);
    // Poseidon hash is already a valid felt252
    return `0x${normalized}`;
  }
}
