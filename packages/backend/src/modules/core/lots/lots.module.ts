import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LotFactoryModule } from "../../onchain/lot-factory/lot-factory.module";
import { LotsController } from "./lots.controller";
import { LotsService } from "./lots.service";

@Module({
  imports: [AuthModule, LotFactoryModule],
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService],
})
export class LotsModule {}
