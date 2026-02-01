import { Module } from "@nestjs/common";

import { AnimalRegistryModule } from "../../onchain/animal-registry/animal-registry.module";
import { LotFactoryModule } from "../../onchain/lot-factory/lot-factory.module";
import { AnimalsController } from "./animals.controller";
import { AnimalsApprovalService } from "./animals-approval.service";
import { AnimalsService } from "./animals.service";

@Module({
  //TODO SEE IF LOTFACTORY IS NEEDED
  imports: [AnimalRegistryModule, LotFactoryModule],
  controllers: [AnimalsController],
  providers: [AnimalsService, AnimalsApprovalService],
  exports: [AnimalsService],
})
export class AnimalsModule {}
