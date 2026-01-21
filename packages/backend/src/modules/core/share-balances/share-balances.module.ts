import { Module } from "@nestjs/common";

import { ShareBalancesController } from "./share-balances.controller";
import { ShareBalancesService } from "./share-balances.service";

@Module({
  controllers: [ShareBalancesController],
  providers: [ShareBalancesService],
  exports: [ShareBalancesService],
})
export class ShareBalancesModule {}
