import { Module } from "@nestjs/common";

import { NavRelayService } from "./nav-relay.service";

@Module({
  providers: [NavRelayService],
  exports: [NavRelayService],
})
export class NavRelayModule {}
