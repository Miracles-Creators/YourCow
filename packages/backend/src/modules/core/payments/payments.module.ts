import { Module } from "@nestjs/common";

import { CustodyModule } from "../custody/custody.module";
import { LedgerModule } from "../ledger/ledger.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [CustodyModule, LedgerModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
