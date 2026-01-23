import { Module } from "@nestjs/common";

import { AnimalRegistryModule } from "../../onchain/animal-registry/animal-registry.module";
import { AnimalsController } from "./animals.controller";
import { AnimalsApprovalService } from "./animals-approval.service";
import { AnimalsService } from "./animals.service";

@Module({
  imports: [AnimalRegistryModule],
  controllers: [AnimalsController],
  providers: [AnimalsService, AnimalsApprovalService],
  exports: [AnimalsService],
})
export class AnimalsModule {}
