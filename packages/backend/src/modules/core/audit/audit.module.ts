import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LedgerModule } from "../ledger/ledger.module";
import { AuditRegistryService } from "../../onchain/audit-registry/audit-registry.service";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

@Module({
  imports: [LedgerModule, AuthModule],
  controllers: [AuditController],
  providers: [AuditService, AuditRegistryService],
  exports: [AuditService],
})
export class AuditModule {}
