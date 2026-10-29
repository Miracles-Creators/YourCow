import { Module } from "@nestjs/common";

import { AuthModule } from "../../core/auth/auth.module";
import { TraceabilityOracleController } from "./traceability-oracle.controller";
import { TraceabilityOracleService } from "./traceability-oracle.service";

@Module({
  imports: [AuthModule],
  controllers: [TraceabilityOracleController],
  providers: [TraceabilityOracleService],
  exports: [TraceabilityOracleService],
})
export class TraceabilityOracleModule {}
