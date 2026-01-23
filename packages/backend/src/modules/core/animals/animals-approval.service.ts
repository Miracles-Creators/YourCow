import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AnimalApprovalStatus, OnChainSyncStatus } from "@prisma/client";
import { hash } from "starknet";

import { AnimalRegistryService } from "../../onchain/animal-registry/animal-registry.service";
import { AnimalsService } from "./animals.service";

@Injectable()
export class AnimalsApprovalService {
  constructor(
    private readonly animalsService: AnimalsService,
    private readonly animalRegistryService: AnimalRegistryService
  ) {}

  async approveBatch(params: {
    animalIds: number[];
    lotId: number;
    approvedById?: number;
  }) {
    if (!params.animalIds.length) {
      throw new BadRequestException("animalIds must not be empty");
    }

    const animals = await this.animalsService.listByIds(params.animalIds);
    if (animals.length !== params.animalIds.length) {
      throw new NotFoundException("Some animals were not found");
    }

    const nonPending = animals.filter(
      (animal) => animal.approvalStatus !== AnimalApprovalStatus.PENDING_APPROVAL
    );
    if (nonPending.length) {
      throw new BadRequestException("All animals must be pending approval");
    }

    const wrongLot = animals.filter((animal) => animal.lotId !== params.lotId);
    if (wrongLot.length) {
      throw new BadRequestException("All animals must belong to the provided lot");
    }

    const computedProfileHashes = animals.map((animal) => ({
      id: animal.id,
      profileHash: animal.profileHash ?? this.computeProfileHash(animal.profile),
    }));

    const profileHashById = new Map(
      computedProfileHashes.map((entry) => [entry.id, entry.profileHash])
    );

    const onChainIds = animals.map((animal) => BigInt(animal.onChainId ?? animal.id));
    const initialWeightsGrams = animals.map((animal) => {
      if (!animal.initialWeightGrams || animal.initialWeightGrams <= 0) {
        throw new BadRequestException(
          "Animal initial weight grams must be greater than 0"
        );
      }
      return animal.initialWeightGrams;
    });
    const custodians = animals.map((animal) => animal.custodian);
    const profileHashes = animals.map(
      (animal) => profileHashById.get(animal.id) ?? ""
    );

    try {
      const registerTxHash = await this.animalRegistryService.registerAnimalBatch({
        animalsWithWeights: onChainIds.map((animalId, index) => ({
          animalId,
          initialWeightGrams: initialWeightsGrams[index],
        })),
        custodians,
        profileHashes,
      });

      await this.animalRegistryService.assignToLotBatch(
        onChainIds,
        BigInt(params.lotId)
      );

      return this.animalsService.updateApprovalOnChainResults(
        animals.map((animal) => ({
          id: animal.id,
          approvalStatus: AnimalApprovalStatus.APPROVED,
          onChainStatus: OnChainSyncStatus.SYNCED,
          onChainId: Number(animal.onChainId ?? animal.id),
          profileHash: profileHashById.get(animal.id) ?? null,
          registrationTxHash: registerTxHash,
          approvedById: params.approvedById,
        }))
      );
    } catch (error) {
      await this.animalsService.updateApprovalOnChainResults(
        animals.map((animal) => ({
          id: animal.id,
          approvalStatus: animal.approvalStatus,
          onChainStatus: OnChainSyncStatus.FAILED,
        }))
      );
      throw error;
    }
  }

  private computeProfileHash(profile: unknown): string {
    const json = JSON.stringify(profile);
    const keccak = hash.starknetKeccak(json);
    return hash.computePoseidonHashOnElements([keccak]).toString();
  }
}
