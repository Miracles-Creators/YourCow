import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { TongoController } from "./tongo.controller";
import { TongoService } from "./tongo.service";

@Module({
  imports: [AuthModule],
  controllers: [TongoController],
  providers: [TongoService],
  exports: [TongoService],
})
export class TongoModule {}
