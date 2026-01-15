import { Module } from "@nestjs/common";

import { LotFactoryController } from "./lot-factory.controller";
import { LotFactoryService } from "./lot-factory.service";

@Module({
  controllers: [LotFactoryController],
  providers: [LotFactoryService],
  exports: [LotFactoryService],
})
export class LotFactoryModule {}
