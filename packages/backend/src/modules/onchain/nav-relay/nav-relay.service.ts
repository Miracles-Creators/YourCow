import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import {
  createPublicClient,
  http,
  type WatchContractEventReturnType,
} from "viem";
import { sepolia } from "viem/chains";
import { cairo } from "starknet";
import navOracleAbi from "./NAVOracle.abi.json";

import { StarknetService } from "../../../starknet/core/starknet.service";

@Injectable()
export class NavRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NavRelayService.name);
  private unwatch: WatchContractEventReturnType | null = null;
  private readonly contractAddress: `0x${string}` | null;

  constructor(private starknetService: StarknetService) {
    const addr = process.env.NAV_ORACLE_ADDRESS;
    this.contractAddress = addr?.startsWith("0x") ? (addr as `0x${string}`) : null;
  }

  async onModuleInit() {
    if (process.env.ENABLE_NAV_RELAY !== "true") {
      this.logger.log("NAV relay disabled");
      return;
    }

    if (!this.contractAddress) {
      throw new Error("NAV_ORACLE_ADDRESS must be a valid 0x-prefixed address");
    }

    this.startListening();
  }

  private startListening() {
    const client = createPublicClient({
      chain: sepolia,
      transport: http(process.env.SEPOLIA_EVM_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com", {
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    this.unwatch = client.watchContractEvent({
      address: this.contractAddress!,
      abi: navOracleAbi,
      pollingInterval: 15_000,
      onLogs: (logs) => {
        this.handleLogs(logs as unknown as readonly { eventName: string; args: Record<string, any> }[]).catch((err: Error) => {
          this.logger.error("Failed to relay logs", err.stack);
        });
      },
      onError: (err: Error) => {
        this.logger.error("EVM poll error", err.message);
      },
    });

    this.logger.log(`Listening to NAVOracle events on Sepolia (${this.contractAddress})`);
  }

  private async handleLogs(logs: readonly { eventName: string; args: Record<string, any> }[]) {
    const marketLogs = logs.filter((l) => l.eventName === "MarketPricesUpdated");
    const navLogs = logs.filter((l) => l.eventName === "LotNAVUpdated");

    if (marketLogs.length > 0) {
      const latest = marketLogs[marketLogs.length - 1];
      const { beefPrice, cornPrice, arsUsdRate } = latest.args;
      if (beefPrice <= 0n || cornPrice <= 0n || arsUsdRate <= 0n) {
        this.logger.warn("Skipping market prices — non-positive values detected");
      } else {
        await this.relayMarketPrices(beefPrice, cornPrice, arsUsdRate);
      }
    }

    if (navLogs.length > 0) {
      await this.relayNavBatch(navLogs);
    }
  }

  private async relayMarketPrices(beefPrice: bigint, cornPrice: bigint, arsUsdRate: bigint) {
    const contract = this.starknetService.getContract("NavOracle");
    const txHash = await this.starknetService.executeTransaction(
      contract.update_market_prices(beefPrice, cornPrice, arsUsdRate),
    );
    this.logger.log(`Relayed market prices -> Starknet tx: ${txHash}`);
  }

  private async relayNavBatch(navLogs: readonly { eventName: string; args: Record<string, any> }[]) {
    const lotIds: bigint[] = [];
    const navValues: bigint[] = [];
    const navPerShares: bigint[] = [];
    const weightGrams: number[] = [];

    for (const log of navLogs) {
      const nav = log.args.nav as bigint;
      const navPerShare = log.args.navPerShare as bigint;
      if (nav < 0n || navPerShare < 0n) {
        this.logger.warn(`Lot #${log.args.lotId}: clamping negative NAV to 0 (nav=${nav}, navPerShare=${navPerShare})`);
      }
      lotIds.push(log.args.lotId as bigint);
      navValues.push(nav < 0n ? 0n : nav);
      navPerShares.push(navPerShare < 0n ? 0n : navPerShare);
      weightGrams.push(Number(log.args.weightGrams));
    }

    const contract = this.starknetService.getContract("NavOracle");
    const txHash = await this.starknetService.executeTransaction(
      contract.update_nav_batch(
        lotIds.map((id) => cairo.uint256(id)),
        navValues,
        navPerShares,
        weightGrams,
      ),
    );
    this.logger.log(`Relayed ${lotIds.length} lot NAVs -> Starknet tx: ${txHash}`);
  }

  onModuleDestroy() {
    if (this.unwatch) {
      this.unwatch();
      this.logger.log("EVM watcher stopped");
    }
  }
}
