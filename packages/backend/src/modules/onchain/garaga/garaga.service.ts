import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AssetType } from "@prisma/client";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm, writeFile, cp, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { PrismaService } from "../../../database/prisma.service";
import { StarknetService } from "../../../starknet/core/starknet.service";

const execFileAsync = promisify(execFile);

export type JobStatus = "pending" | "proving" | "verifying" | "done" | "failed";

export interface Job {
  status: JobStatus;
  txHash?: string;
  error?: string;
}

interface FundraisingProof {
  thresholdPercent: number;
  lotId: number;
  verified: boolean;
  txHash: string;
  provedAt: string;
}

// Path to the pre-compiled circuit artifacts
const CIRCUIT_DIR = process.env.GARAGA_CIRCUIT_DIR
  ?? join(process.cwd(), "..", "..", "circuits", "fundraising_threshold");

@Injectable()
export class GaragaService {
  private readonly logger = new Logger(GaragaService.name);
  private readonly jobs = new Map<string, Job>();
  private readonly verifierAddress: string;
  private garagaModulePromise?: Promise<{
    getZKHonkCallData: (
      proof: Uint8Array,
      publicInputs: Uint8Array,
      verifyingKey: Uint8Array,
    ) => bigint[];
  }>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly starknetService: StarknetService,
  ) {
    // The Garaga verifier lives on Sepolia only — one contract, always.
    this.verifierAddress = process.env.GARAGA_VERIFIER_ADDRESS_SEPOLIA ?? "";

    if (!this.verifierAddress) {
      this.logger.warn("GARAGA_VERIFIER_ADDRESS_SEPOLIA not set - on-chain verification will fail");
    }
  }

  private buildProverToml(
    lotId: number,
    fundedShares: number,
    totalShares: number,
    thresholdPercent: number,
  ): string {
    return [
      `threshold_percent = "${thresholdPercent}"`,
      `lot_id = "0x${lotId.toString(16)}"`,
      `funded_shares = "${fundedShares}"`,
      `total_shares = "${totalShares}"`,
    ].join("\n");
  }

  private async generateProof(proverToml: string): Promise<{ proof: Buffer; publicInputs: Buffer }> {
    const workDir = await mkdtemp(join(tmpdir(), "garaga-"));
    // circuitDir is the temp copy where nargo runs
    const circuitDir = join(workDir, "circuit");

    try {
      // cp copies CIRCUIT_DIR as a subdirectory into workDir -> workDir/circuit/
      await cp(CIRCUIT_DIR, circuitDir, { recursive: true });
      await writeFile(join(circuitDir, "Prover.toml"), proverToml, { mode: 0o600 });

      await execFileAsync("nargo", ["execute", "witness"], {
        cwd: circuitDir,
        timeout: 30_000,
      });

      await execFileAsync("bb", [
        "prove",
        "-s", "ultra_honk",
        "--oracle_hash", "keccak",
        "-b", join(circuitDir, "target", "fundraising_threshold.json"),
        "-w", join(circuitDir, "target", "witness.gz"),
        "-k", join(circuitDir, "target", "vk", "vk"),
        "-o", join(circuitDir, "target"),
      ], { timeout: 120_000 });

      const proof = await readFile(join(circuitDir, "target", "proof"));
      const publicInputs = await readFile(join(circuitDir, "target", "public_inputs"));

      return { proof, publicInputs };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async verifyOnChain(
    proof: Buffer,
    publicInputs: Buffer,
  ): Promise<string> {
    if (!this.verifierAddress) {
      throw new Error("GARAGA_VERIFIER_ADDRESS not configured");
    }

    const { getZKHonkCallData } = await this.getGaragaModule();
    const vkPath = join(CIRCUIT_DIR, "target", "vk", "vk");
    const vk = await readFile(vkPath);

    const calldata = getZKHonkCallData(
      new Uint8Array(proof),
      new Uint8Array(publicInputs),
      new Uint8Array(vk),
    ).map((value) => value.toString());

    const account = this.starknetService.getOperatorAccount();
    const { transaction_hash } = await account.execute({
      contractAddress: this.verifierAddress,
      entrypoint: "verify_ultra_keccak_zk_honk_proof",
      calldata,
    });

    const receipt = await this.starknetService.getProvider().waitForTransaction(transaction_hash);
    if (receipt.statusReceipt !== "SUCCEEDED") {
      throw new Error(`On-chain verification failed: ${receipt.statusReceipt}`);
    }

    return transaction_hash;
  }

  private async getGaragaModule() {
    if (!this.garagaModulePromise) {
      this.garagaModulePromise = (async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const garaga = require("garaga");
        await garaga.init();
        return garaga;
      })();
    }

    return this.garagaModulePromise;
  }

  private async runProofJob(
    jobId: string,
    lotId: number,
    thresholdPercent: number,
  ): Promise<void> {
    const job = this.jobs.get(jobId)!;
    try {
      const lot = await this.prisma.lot.findUnique({ where: { id: lotId } });
      if (!lot) throw new NotFoundException(`Lot ${lotId} not found`);

      const agg = await this.prisma.balance.aggregate({
        _sum: { available: true, locked: true },
        where: { lotId, assetType: AssetType.LOT_SHARES },
      });
      const fundedShares = Math.floor(
        Number(agg._sum.available ?? 0) + Number(agg._sum.locked ?? 0),
      );
      const totalShares = lot.totalShares;
      if (!totalShares) throw new Error("Lot has no totalShares configured");

      if (fundedShares * 100 < thresholdPercent * totalShares) {
        throw new Error("Lot has not reached the requested threshold");
      }

      job.status = "proving";
      const proverToml = this.buildProverToml(lotId, fundedShares, totalShares, thresholdPercent);
      const { proof, publicInputs } = await this.generateProof(proverToml);

      job.status = "verifying";
      const txHash = await this.verifyOnChain(proof, publicInputs);

      const proofRecord: FundraisingProof = {
        thresholdPercent,
        lotId,
        verified: true,
        txHash,
        provedAt: new Date().toISOString(),
      };

      const existingMeta = (lot.metadata as Record<string, unknown>) ?? {};
      await this.prisma.lot.update({
        where: { id: lotId },
        data: {
          metadata: JSON.parse(
            JSON.stringify({ ...existingMeta, fundraisingProof: proofRecord }),
          ),
        },
      });

      job.status = "done";
      job.txHash = txHash;
      this.logger.log(`Proof job ${jobId} completed - tx: ${txHash}`);
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Proof job ${jobId} failed: ${job.error}`);
    }
  }

  startProveThreshold(lotId: number, thresholdPercent: number): string {
    const jobId = randomUUID();
    this.jobs.set(jobId, { status: "pending" });
    void this.runProofJob(jobId, lotId, thresholdPercent);
    return jobId;
  }

  getJobStatus(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }
}
