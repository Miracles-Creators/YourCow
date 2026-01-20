import { Module } from "@nestjs/common";

import { PrismaModule } from "./database/prisma.module";
import { HealthController } from "./health.controller";
import { StarknetModule } from "./starknet";

// Core modules (DB first)
import { ProducersModule } from "./modules/core/producers/producers.module";
import { InvestorsModule } from "./modules/core/investors/investors.module";
import { AdminsModule } from "./modules/core/admins/admins.module";
import { LotsModule } from "./modules/core/lots/lots.module";
import { AnimalsModule } from "./modules/core/animals/animals.module";
import { PaymentsModule } from "./modules/core/payments/payments.module";
import { SettlementsModule } from "./modules/core/settlements/settlements.module";
import { AuthModule } from "./modules/core/auth/auth.module";

// On-chain modules (contract interactions)
import { LotFactoryModule } from "./modules/onchain/lot-factory/lot-factory.module";
import { AnimalRegistryModule } from "./modules/onchain/animal-registry/animal-registry.module";
import { LotSharesTokenModule } from "./modules/onchain/lot-shares-token/lot-shares-token.module";
import { TraceabilityOracleModule } from "./modules/onchain/traceability-oracle/traceability-oracle.module";
import { SettlementRegistryModule } from "./modules/onchain/settlement-registry/settlement-registry.module";

@Module({
  imports: [
    // Infrastructure
    PrismaModule,
    StarknetModule,

    // Core modules (DB)
    ProducersModule,
    InvestorsModule,
    AdminsModule,
    LotsModule,
    AnimalsModule,
    PaymentsModule,
    SettlementsModule,
    AuthModule,

    // On-chain modules
    LotFactoryModule,
    AnimalRegistryModule,
    LotSharesTokenModule,
    TraceabilityOracleModule,
    SettlementRegistryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
