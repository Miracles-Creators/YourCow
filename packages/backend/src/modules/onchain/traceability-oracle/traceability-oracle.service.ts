import { Injectable } from "@nestjs/common";
import { Contract, cairo } from "starknet";
import { StarknetService } from "../../../starknet/core/starknet.service";
import {
  TraceAnchor,
  AnchorTraceParams,
  AnchorTraceBatchParams,
  CorrectTraceParams,
} from "../../../starknet/types";

@Injectable()
export class TraceabilityOracleService {
  private contract!: Contract;

  constructor(private starknetService: StarknetService) {}

  // Uses Attestor account instead of Protocol Operator
  private getContract(): Contract {
    if (!this.contract) {
      const attestorAccount = this.starknetService.getAttestorAccount();
      this.contract = this.starknetService.getContract(
        "TraceabilityOracle",
        attestorAccount
      );
    }
    return this.contract;
  }

  async anchorTrace(params: AnchorTraceParams): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.anchor_trace(
        cairo.uint256(params.animalId),
        params.root,
        params.eventCount
      )
    );
  }

  async anchorTraceBatch(params: AnchorTraceBatchParams): Promise<string> {
    const contract = this.getContract();
    const animalIds = params.animalIds.map((id) => cairo.uint256(id));

    return this.starknetService.executeTransaction(
      contract.anchor_trace_batch(animalIds, params.roots, params.eventCounts)
    );
  }

  async correctTrace(params: CorrectTraceParams): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.correct_trace(
        cairo.uint256(params.animalId),
        params.newRoot,
        params.newEventCount,
        params.correctionReason
      )
    );
  }

  // Read-only methods

  async getTraceAnchor(animalId: bigint): Promise<TraceAnchor> {
    const contract = this.starknetService.getContractReadOnly(
      "TraceabilityOracle"
    );
    const result = await contract.get_trace_anchor(cairo.uint256(animalId));

    return {
      root: result.root.toString(),
      timestamp: BigInt(result.timestamp.toString()),
      eventCount: Number(result.event_count),
    };
  }

  async getLastRoot(animalId: bigint): Promise<string> {
    const contract = this.starknetService.getContractReadOnly(
      "TraceabilityOracle"
    );
    const result = await contract.get_last_root(cairo.uint256(animalId));
    return result.toString();
  }

  async getLastTimestamp(animalId: bigint): Promise<bigint> {
    const contract = this.starknetService.getContractReadOnly(
      "TraceabilityOracle"
    );
    const result = await contract.get_last_timestamp(cairo.uint256(animalId));
    return BigInt(result.toString());
  }

  async getCorrectionCount(animalId: bigint): Promise<number> {
    const contract = this.starknetService.getContractReadOnly(
      "TraceabilityOracle"
    );
    const result = await contract.get_correction_count(cairo.uint256(animalId));
    return Number(result);
  }

  async getAttestor(): Promise<string> {
    const contract = this.starknetService.getContractReadOnly(
      "TraceabilityOracle"
    );
    const result = await contract.get_attestor();
    return result.toString();
  }
}
