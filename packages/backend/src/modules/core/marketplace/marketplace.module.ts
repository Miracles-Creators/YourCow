import { Module } from "@nestjs/common";

import { LotSharesTokenModule } from "../../onchain/lot-shares-token/lot-shares-token.module";
import { AuthModule } from "../auth/auth.module";
import { CustodyModule } from "../custody/custody.module";
import { LedgerModule } from "../ledger/ledger.module";
import { MarketplaceController } from "./marketplace.controller";
import { PortfolioController } from "./portfolio.controller";
import { MarketplaceService } from "./marketplace.service";

@Module({
  imports: [CustodyModule, LedgerModule, AuthModule, LotSharesTokenModule],
  controllers: [MarketplaceController, PortfolioController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
