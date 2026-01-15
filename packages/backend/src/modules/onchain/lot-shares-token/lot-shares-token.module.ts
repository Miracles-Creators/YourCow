import { Module } from "@nestjs/common";

import { LotSharesTokenController } from "./lot-shares-token.controller";
import { LotSharesTokenService } from "./lot-shares-token.service";
import { LotFactoryModule } from "../lot-factory/lot-factory.module";

@Module({
  imports: [LotFactoryModule],
  controllers: [LotSharesTokenController],
  providers: [LotSharesTokenService],
  exports: [LotSharesTokenService],
})
export class LotSharesTokenModule {}
