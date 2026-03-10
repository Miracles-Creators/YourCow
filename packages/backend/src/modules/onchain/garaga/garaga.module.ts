import { Module } from "@nestjs/common";
import { AuthModule } from "../../core/auth/auth.module";
import { GaragaController } from "./garaga.controller";
import { GaragaService } from "./garaga.service";

@Module({
  imports: [AuthModule],
  controllers: [GaragaController],
  providers: [GaragaService],
  exports: [GaragaService],
})
export class GaragaModule {}
