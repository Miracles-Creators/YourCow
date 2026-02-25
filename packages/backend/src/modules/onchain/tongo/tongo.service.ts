import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Account as TongoSdkAccount } from "@fatsolutions/tongo-sdk";
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "crypto";
import { hkdf } from "crypto";
import { promisify } from "util";
import { PrismaService } from "../../../database/prisma.service";
import { StarknetService } from "../../../starknet/core/starknet.service";

const hkdfAsync = promisify(hkdf);

const TONGO_CONTRACT =
  "0x00b4cca30f0f641e01140c1c388f55641f1c3fe5515484e622b6cb91d8cee585";

interface TongoBalance {
  current: bigint;
  pending: bigint;
}

@Injectable()
export class TongoService {
  private readonly logger = new Logger(TongoService.name);
  private readonly masterKey: string;
  private readonly userLocks = new Map<number, Promise<void>>();
  private nonceLock: Promise<void> = Promise.resolve();

  constructor(
    private readonly prisma: PrismaService,
    private readonly starknetService: StarknetService,
  ) {
    this.masterKey = process.env.TONGO_MASTER_KEY || "";
    if (!this.masterKey) {
      this.logger.warn("TONGO_MASTER_KEY not set — Tongo operations will fail");
    }
  }

  async createTongoAccount(userId: number) {
    const existing = await this.prisma.tongoAccount.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    const privateKeyBytes = randomBytes(32);
    const privateKeyHex = "0x" + privateKeyBytes.toString("hex");

    // Cast provider to avoid type mismatch between starknet versions
    const sdkAccount = new TongoSdkAccount(
      BigInt(privateKeyHex),
      TONGO_CONTRACT,
      this.starknetService.getProvider() as any,
    );

    const pubKey = sdkAccount.publicKey;
    const tongoPublicKey = JSON.stringify({
      x: pubKey.x.toString(),
      y: pubKey.y.toString(),
    });

    const encryptedPrivateKey = await this.encryptPrivateKey(
      privateKeyHex,
      userId,
    );

    return this.prisma.tongoAccount.create({
      data: {
        userId,
        tongoPublicKey,
        encryptedPrivateKey,
      },
    });
  }

  async getBalance(userId: number): Promise<TongoBalance> {
    const sdkAccount = await this.getSdkAccount(userId);
    const state = await sdkAccount.state();
    return { current: state.balance, pending: state.pending };
  }

  async fund(userId: number, amount: bigint): Promise<string> {
    return this.withUserLock(userId, async () => {
      return this.withNonceLock(async () => {
        const sdkAccount = await this.getSdkAccount(userId);
        const operator = this.starknetService.getProtocolOperatorAccount();

        const tongoAmount = await sdkAccount.erc20ToTongo(amount);
        const op = await sdkAccount.fund({
          amount: tongoAmount,
          sender: operator.address,
        });

        const calls = op.approve
          ? [op.approve, op.toCalldata()]
          : [op.toCalldata()];

        const tx = await operator.execute(calls);
        await this.starknetService
          .getProvider()
          .waitForTransaction(tx.transaction_hash);
        return tx.transaction_hash;
      });
    });
  }

  async transfer(
    fromUserId: number,
    toUserId: number,
    amount: bigint,
  ): Promise<string> {
    return this.withUserLock(fromUserId, async () => {
      return this.withNonceLock(async () => {
        const fromSdk = await this.getSdkAccount(fromUserId);
        const toRecord = await this.prisma.tongoAccount.findUniqueOrThrow({
          where: { userId: toUserId },
        });

        const toPubKey = JSON.parse(toRecord.tongoPublicKey);
        const operator = this.starknetService.getProtocolOperatorAccount();

        const tongoAmount = await fromSdk.erc20ToTongo(amount);
        const op = await fromSdk.transfer({
          amount: tongoAmount,
          to: { x: BigInt(toPubKey.x), y: BigInt(toPubKey.y) },
          sender: operator.address,
        });

        const tx = await operator.execute([op.toCalldata()]);
        await this.starknetService
          .getProvider()
          .waitForTransaction(tx.transaction_hash);
        return tx.transaction_hash;
      });
    });
  }

  async rollover(userId: number): Promise<string> {
    return this.withUserLock(userId, async () => {
      return this.withNonceLock(async () => {
        const sdkAccount = await this.getSdkAccount(userId);
        const operator = this.starknetService.getProtocolOperatorAccount();

        const op = await sdkAccount.rollover({
          sender: operator.address,
        });

        const tx = await operator.execute([op.toCalldata()]);
        await this.starknetService
          .getProvider()
          .waitForTransaction(tx.transaction_hash);
        return tx.transaction_hash;
      });
    });
  }

  async withdraw(
    userId: number,
    toAddress: string,
    amount: bigint,
  ): Promise<string> {
    return this.withUserLock(userId, async () => {
      return this.withNonceLock(async () => {
        const sdkAccount = await this.getSdkAccount(userId);
        const operator = this.starknetService.getProtocolOperatorAccount();

        const tongoAmount = await sdkAccount.erc20ToTongo(amount);
        const op = await sdkAccount.withdraw({
          to: toAddress,
          amount: tongoAmount,
          sender: operator.address,
        });

        const tx = await operator.execute([op.toCalldata()]);
        await this.starknetService
          .getProvider()
          .waitForTransaction(tx.transaction_hash);
        return tx.transaction_hash;
      });
    });
  }

  async confirmDeposit(
    userId: number,
    txHash: string,
    claimedAmount: string,
  ): Promise<string> {
    // Idempotency check
    const existing = await this.prisma.tongoDeposit.findUnique({
      where: { txHash },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new BadRequestException("Transaction already used by another user");
      }
      return existing.id;
    }

    // Verify tx on-chain
    const provider = this.starknetService.getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.statusReceipt !== "SUCCEEDED") {
      throw new BadRequestException("Transaction not confirmed on-chain");
    }

    // Record deposit
    const deposit = await this.prisma.tongoDeposit.create({
      data: { userId, txHash, amount: claimedAmount },
    });

    // Ensure user has a Tongo account
    await this.createTongoAccount(userId);

    // Fund the user's Tongo balance
    const tongoTxHash = await this.fund(userId, BigInt(claimedAmount));

    return tongoTxHash;
  }

  // --- Internal helpers ---

  private async getSdkAccount(userId: number): Promise<TongoSdkAccount> {
    const record = await this.prisma.tongoAccount.findUniqueOrThrow({
      where: { userId },
    });
    const privateKey = await this.decryptPrivateKey(
      record.encryptedPrivateKey,
      userId,
    );
    return new TongoSdkAccount(
      BigInt(privateKey),
      TONGO_CONTRACT,
      this.starknetService.getProvider() as any,
    );
  }

  private async deriveUserKey(userId: number): Promise<Buffer> {
    const derived = await hkdfAsync(
      "sha256",
      this.masterKey,
      String(userId),
      "tongo-key-encryption",
      32,
    );
    return Buffer.from(derived);
  }

  private async encryptPrivateKey(
    privateKey: string,
    userId: number,
  ): Promise<string> {
    const key = await this.deriveUserKey(userId);
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
  }

  private async decryptPrivateKey(
    encrypted: string,
    userId: number,
  ): Promise<string> {
    const key = await this.deriveUserKey(userId);
    const [ivHex, tagHex, data] = encrypted.split(":");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  private async withUserLock<T>(
    userId: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const prev = this.userLocks.get(userId) || Promise.resolve();
    let resolve: () => void;
    const next = new Promise<void>((r) => {
      resolve = r;
    });
    this.userLocks.set(userId, next);
    await prev;
    try {
      return await fn();
    } finally {
      resolve!();
      if (this.userLocks.get(userId) === next) {
        this.userLocks.delete(userId);
      }
    }
  }

  private async withNonceLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.nonceLock;
    let resolve: () => void;
    const next = new Promise<void>((r) => {
      resolve = r;
    });
    this.nonceLock = next;
    await prev;
    try {
      return await fn();
    } finally {
      resolve!();
    }
  }
}
