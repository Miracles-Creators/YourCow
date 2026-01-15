import { Module } from "@nestjs/common";

import { TraceabilityOracleController } from "./traceability-oracle.controller";
import { TraceabilityOracleService } from "./traceability-oracle.service";

@Module({
  controllers: [TraceabilityOracleController],
  providers: [TraceabilityOracleService],
  exports: [TraceabilityOracleService],
})
export class TraceabilityOracleModule {}
