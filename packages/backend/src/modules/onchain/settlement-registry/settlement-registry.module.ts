import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { SettlementRegistryController } from "./settlement-registry.controller";
import { SettlementRegistryService } from "./settlement-registry.service";

@Module({
  imports: [AuthModule],
  controllers: [SettlementRegistryController],
  providers: [SettlementRegistryService],
  exports: [SettlementRegistryService],
})
export class SettlementRegistryModule {}
