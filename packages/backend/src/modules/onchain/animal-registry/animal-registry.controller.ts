import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { AnimalRegistryService } from "./animal-registry.service";
import {
  AssignToLotBatchDto,
  AssignToLotDto,
  RegisterAnimalBatchDto,
  RegisterAnimalOnChainDto,
  RemoveFromLotBatchDto,
  SetAnimalStatusBatchDto,
  SetAnimalStatusDto,
  TransferCustodyDto,
} from "./dto/animal-registry.dto";
import { AnimalStatus } from "../../../starknet/types";
import { toBigInt } from "../../../utils/bigint";

@Controller("contracts/animal-registry")
export class AnimalRegistryController {
  constructor(private readonly animalRegistryService: AnimalRegistryService) {}

  @Post("animals")
  async registerAnimal(@Body() body: RegisterAnimalOnChainDto) {
    return this.animalRegistryService.registerAnimal({
      animalId: toBigInt(body.animalId),
      custodian: body.custodian,
      profileHash: body.profileHash,
    });
  }

  @Post("animals/batch")
  async registerAnimalBatch(@Body() body: RegisterAnimalBatchDto) {
    return this.animalRegistryService.registerAnimalBatch({
      animalIds: body.animalIds.map(toBigInt),
      custodians: body.custodians,
      profileHashes: body.profileHashes,
    });
  }

  @Post("animals/:animalId/assign")
  async assignToLot(
    @Param("animalId") animalId: string,
    @Body() body: AssignToLotDto
  ) {
    return this.animalRegistryService.assignToLot(
      toBigInt(animalId),
      toBigInt(body.lotId)
    );
  }

  @Post("animals/assign-batch")
  async assignToLotBatch(@Body() body: AssignToLotBatchDto) {
    return this.animalRegistryService.assignToLotBatch(
      body.animalIds.map(toBigInt),
      toBigInt(body.lotId)
    );
  }

  @Post("animals/:animalId/remove")
  async removeFromLot(@Param("animalId") animalId: string) {
    return this.animalRegistryService.removeFromLot(toBigInt(animalId));
  }

  @Post("animals/remove-batch")
  async removeFromLotBatch(@Body() body: RemoveFromLotBatchDto) {
    return this.animalRegistryService.removeFromLotBatch(
      body.animalIds.map(toBigInt)
    );
  }

  @Post("animals/:animalId/status")
  async setAnimalStatus(
    @Param("animalId") animalId: string,
    @Body() body: SetAnimalStatusDto
  ) {
    return this.animalRegistryService.setAnimalStatus(
      toBigInt(animalId),
      body.newStatus as AnimalStatus
    );
  }

  @Post("animals/status-batch")
  async setAnimalStatusBatch(@Body() body: SetAnimalStatusBatchDto) {
    return this.animalRegistryService.setAnimalStatusBatch(
      body.animalIds.map(toBigInt),
      body.newStatus as AnimalStatus
    );
  }

  @Post("animals/:animalId/transfer-custody")
  async transferCustody(
    @Param("animalId") animalId: string,
    @Body() body: TransferCustodyDto
  ) {
    return this.animalRegistryService.transferCustody(
      toBigInt(animalId),
      body.newCustodian
    );
  }

  @Get("animals/:animalId")
  async getAnimal(@Param("animalId") animalId: string) {
    return this.animalRegistryService.getAnimal(toBigInt(animalId));
  }

  @Get("animals/:animalId/status")
  async getAnimalStatus(@Param("animalId") animalId: string) {
    return this.animalRegistryService.getAnimalStatus(toBigInt(animalId));
  }

  @Get("animals/:animalId/current-lot")
  async getCurrentLot(@Param("animalId") animalId: string) {
    return this.animalRegistryService.getCurrentLot(toBigInt(animalId));
  }

  @Get("lots/:lotId/animal-count")
  async getLotAnimalCount(@Param("lotId") lotId: string) {
    return this.animalRegistryService.getLotAnimalCount(toBigInt(lotId));
  }

  @Get("animals/:animalId/exists")
  async animalExists(@Param("animalId") animalId: string) {
    return this.animalRegistryService.animalExists(toBigInt(animalId));
  }

  @Get("animals/:animalId/custodian")
  async getCustodian(@Param("animalId") animalId: string) {
    return this.animalRegistryService.getCustodian(toBigInt(animalId));
  }
}
