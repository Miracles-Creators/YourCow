import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ProducersController } from "./producers.controller";
import { ProducersService } from "./producers.service";

@Module({
  imports: [AuthModule],
  controllers: [ProducersController],
  providers: [ProducersService],
  exports: [ProducersService],
})
export class ProducersModule {}
