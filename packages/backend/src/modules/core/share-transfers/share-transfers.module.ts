import { Module } from "@nestjs/common";

import { ShareTransfersController } from "./share-transfers.controller";
import { ShareTransfersService } from "./share-transfers.service";

@Module({
  controllers: [ShareTransfersController],
  providers: [ShareTransfersService],
  exports: [ShareTransfersService],
})
export class ShareTransfersModule {}
