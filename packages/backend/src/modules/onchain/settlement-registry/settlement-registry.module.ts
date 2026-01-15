import { Module } from "@nestjs/common";

import { SettlementRegistryController } from "./settlement-registry.controller";
import { SettlementRegistryService } from "./settlement-registry.service";

@Module({
  controllers: [SettlementRegistryController],
  providers: [SettlementRegistryService],
  exports: [SettlementRegistryService],
})
export class SettlementRegistryModule {}
