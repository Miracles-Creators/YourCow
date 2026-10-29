import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { LotFactoryController } from "./lot-factory.controller";
import { LotFactoryService } from "./lot-factory.service";

@Module({
  imports: [AuthModule],
  controllers: [LotFactoryController],
  providers: [LotFactoryService],
  exports: [LotFactoryService],
})
export class LotFactoryModule {}
