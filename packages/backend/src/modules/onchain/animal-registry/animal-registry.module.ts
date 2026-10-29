import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { AnimalRegistryController } from "./animal-registry.controller";
import { AnimalRegistryService } from "./animal-registry.service";

@Module({
  imports: [AuthModule],
  controllers: [AnimalRegistryController],
  providers: [AnimalRegistryService],
  exports: [AnimalRegistryService],
})
export class AnimalRegistryModule {}
