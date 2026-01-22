import { Module } from "@nestjs/common";

import { LotSharesTokenModule } from "../../onchain/lot-shares-token/lot-shares-token.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [LotSharesTokenModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
