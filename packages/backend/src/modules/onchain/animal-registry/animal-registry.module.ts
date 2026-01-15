import { Module } from "@nestjs/common";

import { AnimalRegistryController } from "./animal-registry.controller";
import { AnimalRegistryService } from "./animal-registry.service";

@Module({
  controllers: [AnimalRegistryController],
  providers: [AnimalRegistryService],
  exports: [AnimalRegistryService],
})
export class AnimalRegistryModule {}
