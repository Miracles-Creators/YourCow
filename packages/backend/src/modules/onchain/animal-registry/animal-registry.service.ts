import { Injectable } from "@nestjs/common";
import { Contract, cairo } from "starknet";
import { StarknetService } from "../../../starknet/core/starknet.service";
import {
  Animal,
  AnimalStatus,
  RegisterAnimalParams,
  RegisterAnimalBatchParams,
} from "../../../starknet/types";

@Injectable()
export class AnimalRegistryService {
  private contract!: Contract;

  constructor(private starknetService: StarknetService) {}

  private getContract(): Contract {
    if (!this.contract) {
      this.contract = this.starknetService.getContract("AnimalRegistry");
    }
    return this.contract;
  }

  async registerAnimal(params: RegisterAnimalParams): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.register_animal(
        cairo.uint256(params.animalId),
        params.custodian,
        params.profileHash
      )
    );
  }

  async registerAnimalBatch(params: RegisterAnimalBatchParams): Promise<string> {
    const contract = this.getContract();
    const animalIds = params.animalIds.map((id) => cairo.uint256(id));

    return this.starknetService.executeTransaction(
      contract.register_animal_batch(
        animalIds,
        params.custodians,
        params.profileHashes
      )
    );
  }

  async assignToLot(animalId: bigint, lotId: bigint): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.assign_to_lot(cairo.uint256(animalId), cairo.uint256(lotId))
    );
  }

  async assignToLotBatch(animalIds: bigint[], lotId: bigint): Promise<string> {
    const contract = this.getContract();
    const ids = animalIds.map((id) => cairo.uint256(id));

    return this.starknetService.executeTransaction(
      contract.assign_to_lot_batch(ids, cairo.uint256(lotId))
    );
  }

  async removeFromLot(animalId: bigint): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.remove_from_lot(cairo.uint256(animalId))
    );
  }

  async removeFromLotBatch(animalIds: bigint[]): Promise<string> {
    const contract = this.getContract();
    const ids = animalIds.map((id) => cairo.uint256(id));

    return this.starknetService.executeTransaction(
      contract.remove_from_lot_batch(ids)
    );
  }

  async setAnimalStatus(
    animalId: bigint,
    newStatus: AnimalStatus
  ): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.set_animal_status(cairo.uint256(animalId), newStatus)
    );
  }

  async setAnimalStatusBatch(
    animalIds: bigint[],
    newStatus: AnimalStatus
  ): Promise<string> {
    const contract = this.getContract();
    const ids = animalIds.map((id) => cairo.uint256(id));

    return this.starknetService.executeTransaction(
      contract.set_animal_status_batch(ids, newStatus)
    );
  }

  async transferCustody(
    animalId: bigint,
    newCustodian: string
  ): Promise<string> {
    const contract = this.getContract();
    return this.starknetService.executeTransaction(
      contract.transfer_custody(cairo.uint256(animalId), newCustodian)
    );
  }

  // Read-only methods

  async getAnimal(animalId: bigint): Promise<Animal> {
    const contract = this.starknetService.getContractReadOnly("AnimalRegistry");
    const result = await contract.get_animal(cairo.uint256(animalId));

    return {
      custodian: result.custodian.toString(),
      status: Number(result.status),
      currentLotId: BigInt(result.current_lot_id.toString()),
      profileHash: result.profile_hash.toString(),
      createdAt: BigInt(result.created_at.toString()),
    };
  }

  async getAnimalStatus(animalId: bigint): Promise<AnimalStatus> {
    const contract = this.starknetService.getContractReadOnly("AnimalRegistry");
    const result = await contract.get_animal_status(cairo.uint256(animalId));
    return Number(result) as AnimalStatus;
  }

  async getCurrentLot(animalId: bigint): Promise<bigint> {
    const contract = this.starknetService.getContractReadOnly("AnimalRegistry");
    const result = await contract.get_current_lot(cairo.uint256(animalId));
    return BigInt(result.toString());
  }

  async getLotAnimalCount(lotId: bigint): Promise<bigint> {
    const contract = this.starknetService.getContractReadOnly("AnimalRegistry");
    const result = await contract.get_lot_animal_count(cairo.uint256(lotId));
    return BigInt(result.toString());
  }

  async animalExists(animalId: bigint): Promise<boolean> {
    const contract = this.starknetService.getContractReadOnly("AnimalRegistry");
    const result = await contract.animal_exists(cairo.uint256(animalId));
    return Boolean(result);
  }

  async getCustodian(animalId: bigint): Promise<string> {
    const contract = this.starknetService.getContractReadOnly("AnimalRegistry");
    const result = await contract.get_custodian(cairo.uint256(animalId));
    return result.toString();
  }
}
