import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ProducersModule } from "../producers/producers.module";
import { AdminsController } from "./admins.controller";
import { AdminsService } from "./admins.service";

@Module({
  imports: [AuthModule, ProducersModule],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
