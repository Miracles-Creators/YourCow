import { Module } from "@nestjs/common";

import { TongoController } from "./tongo.controller";
import { TongoService } from "./tongo.service";

@Module({
  controllers: [TongoController],
  providers: [TongoService],
  exports: [TongoService],
})
export class TongoModule {}
