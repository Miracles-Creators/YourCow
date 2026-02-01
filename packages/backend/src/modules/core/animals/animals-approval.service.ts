import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AnimalApprovalStatus, OnChainSyncStatus } from "@prisma/client";
import { AnimalRegistryService } from "../../onchain/animal-registry/animal-registry.service";
import { LotFactoryService } from "../../onchain/lot-factory/lot-factory.service";
import { AnimalsService } from "./animals.service";
import { PrismaService } from "../../../database/prisma.service";
import { LotStatus as OnChainLotStatus } from "../../../starknet/types";
import { hashObject } from "../../../utils/hash";

@Injectable()
export class AnimalsApprovalService {
  constructor(
    private readonly animalsService: AnimalsService,
    private readonly animalRegistryService: AnimalRegistryService,
    private readonly prisma: PrismaService,
    private readonly lotFactoryService: LotFactoryService
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

    const lot = await this.prisma.lot.findUnique({
      where: { id: params.lotId },
      select: { onChainLotId: true },
    });
    if (!lot) {
      throw new NotFoundException("Lot not found");
    }
    if (!lot.onChainLotId) {
      throw new BadRequestException("Lot is not deployed on-chain yet");
    }

    const onChainStatus = await this.lotFactoryService.getLotStatus(
      BigInt(lot.onChainLotId),
    );
    if (onChainStatus !== OnChainLotStatus.ACTIVE) {
      throw new BadRequestException("Lot is not active on-chain");
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
        BigInt(lot.onChainLotId)
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
    return hashObject(profile);
  }
}
