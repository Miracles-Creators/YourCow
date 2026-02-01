import { Module } from "@nestjs/common";

import { SettlementRegistryModule } from "../../onchain/settlement-registry/settlement-registry.module";
import { SettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";

@Module({
  imports: [SettlementRegistryModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
