import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { SettlementRegistryModule } from "../../onchain/settlement-registry/settlement-registry.module";
import { SettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";

@Module({
  imports: [AuthModule, SettlementRegistryModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
