import { Injectable } from "@nestjs/common";
import { Contract, cairo } from "starknet";
import { StarknetService } from "../../../starknet/core/starknet.service";
import { Settlement, SettleLotParams } from "../../../starknet/types";

@Injectable()
export class SettlementRegistryService {
  private contract!: Contract;

  constructor(private starknetService: StarknetService) {}

  private getContract(): Contract {
    if (!this.contract) {
      this.contract = this.starknetService.getContract("SettlementRegistry");
    }
    return this.contract;
  }

  async settleLot(params: SettleLotParams): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.settle_lot(
        cairo.uint256(params.lotId),
        params.finalReportHash,
        cairo.uint256(params.totalProceeds)
      )
    );
  }

  // Read-only methods

  async getSettlement(lotId: bigint): Promise<Settlement> {
    const contract = this.starknetService.getContractReadOnly(
      "SettlementRegistry"
    );
    const result = await contract.get_settlement(cairo.uint256(lotId));

    return {
      settledAt: BigInt(result.settled_at.toString()),
      finalReportHash: result.final_report_hash.toString(),
      totalProceeds: BigInt(result.total_proceeds.toString()),
      settledBy: result.settled_by.toString(),
    };
  }

  async isSettled(lotId: bigint): Promise<boolean> {
    const contract = this.starknetService.getContractReadOnly(
      "SettlementRegistry"
    );
    const result = await contract.is_settled(cairo.uint256(lotId));
    return Boolean(result);
  }

  async getLotFactory(): Promise<string> {
    const contract = this.starknetService.getContractReadOnly(
      "SettlementRegistry"
    );
    const result = await contract.get_lot_factory();
    return result.toString();
  }

  async getProtocolOperator(): Promise<string> {
    const contract = this.starknetService.getContractReadOnly(
      "SettlementRegistry"
    );
    const result = await contract.get_protocol_operator();
    return result.toString();
  }
}
