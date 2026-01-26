import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";
import crypto from "crypto";
import { RpcProvider, typedData as starknetTypedData } from "starknet";

import { PrismaService } from "../../../database/prisma.service";
import {
  SESSION_COOKIE_NAME,
  WALLET_LINK_CHALLENGE_TTL_MS,
  WALLET_LINK_DOMAIN_NAME,
  WALLET_LINK_DOMAIN_VERSION,
} from "./auth.constants";
import { parseCookies } from "./auth.utils";
import { StarknetService } from "../../../starknet/core/starknet.service";

type WalletLinkChallenge = {
  userId: number;
  address: string;
  nonce: number;
  issuedAt: string;
  expiresAt: string;
  chainId: string;
};

@Injectable()
export class AuthService {
  private readonly secret: string;
  private readonly walletChallenges = new Map<number, WalletLinkChallenge>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly starknetService: StarknetService,
  ) {
    this.secret = process.env.AUTH_SECRET ?? "dev-secret";
  }

  async loginWithEmail(
    email: string,
    name?: string,
    role?: UserRole,
  ): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        role: role ?? UserRole.INVESTOR,
        email: normalizedEmail,
        name: name?.trim() || null,
      },
    });
  }

  createSessionToken(userId: number): string {
    const userIdStr = userId.toString();
    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(userIdStr)
      .digest("hex");
    return `${userIdStr}.${signature}`;
  }

  async getUserFromRequest(headers: { cookie?: string }): Promise<User | null> {
    const cookies = parseCookies(headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return null;
    }

    const [userIdStr, signature] = token.split(".");
    if (!userIdStr || !signature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.secret)
      .update(userIdStr)
      .digest("hex");

    if (!this.safeCompare(signature, expectedSignature)) {
      return null;
    }

    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      return null;
    }

    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  private normalizeAddress(address: string): string {
    const normalized = address.trim().toLowerCase();
    if (!normalized.startsWith("0x")) {
      throw new BadRequestException("Invalid wallet address");
    }
    return normalized;
  }

  private async getChainId(provider: RpcProvider): Promise<string> {
    const chainId = await provider.getChainId();
    return chainId.toString();
  }

  private buildWalletLinkTypedData(challenge: WalletLinkChallenge) {
    return {
      types: {
        StarkNetDomain: [
          { name: "name", type: "felt" },
          { name: "version", type: "felt" },
          { name: "chainId", type: "felt" },
        ],
        WalletLink: [
          { name: "address", type: "felt" },
          { name: "userId", type: "felt" },
          { name: "nonce", type: "felt" },
          { name: "expiresAt", type: "felt" },
        ],
      },
      primaryType: "WalletLink",
      domain: {
        name: WALLET_LINK_DOMAIN_NAME,
        version: WALLET_LINK_DOMAIN_VERSION,
        chainId: challenge.chainId,
      },
      message: {
        address: challenge.address,
        userId: challenge.userId,
        nonce: challenge.nonce,
        expiresAt: new Date(challenge.expiresAt).getTime(),
      },
    };
  }

  async createWalletLinkChallenge(userId: number, address: string) {
    const normalizedAddress = this.normalizeAddress(address);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    if (user.walletAddress && user.walletAddress !== normalizedAddress) {
      throw new BadRequestException("Wallet already linked to this user");
    }

    const provider = this.starknetService.getProvider();
    const chainId = await this.getChainId(provider);
    const nonce = Date.now() + Math.floor(Math.random() * 1_000_000);
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + WALLET_LINK_CHALLENGE_TTL_MS).toISOString();

    const challenge: WalletLinkChallenge = {
      userId,
      address: normalizedAddress,
      nonce,
      issuedAt,
      expiresAt,
      chainId,
    };

    this.walletChallenges.set(userId, challenge);

    return {
      ...challenge,
      typedData: this.buildWalletLinkTypedData(challenge),
    };
  }

  async linkWallet(userId: number, address: string, signature: string[]) {
    const normalizedAddress = this.normalizeAddress(address);
    const challenge = this.walletChallenges.get(userId);
    if (!challenge) {
      throw new BadRequestException("Missing wallet link challenge");
    }
    if (challenge.address !== normalizedAddress) {
      throw new BadRequestException("Wallet address mismatch");
    }
    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      this.walletChallenges.delete(userId);
      throw new BadRequestException("Wallet link challenge expired");
    }

    const typedData = this.buildWalletLinkTypedData(challenge);
    const provider = this.starknetService.getProvider();
    const messageHash = starknetTypedData.getMessageHash(
      typedData as never,
      normalizedAddress,
    );

    const calldata = [
      messageHash.toString(),
      signature.length.toString(),
      ...signature,
    ];

    const isValid = await this.verifySignature(provider, normalizedAddress, calldata);
    if (!isValid) {
      throw new BadRequestException("Invalid wallet signature");
    }

    const existing = await this.prisma.user.findFirst({
      where: { walletAddress: normalizedAddress },
    });
    if (existing && existing.id !== userId) {
      throw new BadRequestException("Wallet already linked to another user");
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { walletAddress: normalizedAddress },
    });

    this.walletChallenges.delete(userId);
    return user;
  }

  private async verifySignature(
    provider: RpcProvider,
    address: string,
    calldata: string[],
  ): Promise<boolean> {
    try {
      const result = (await provider.callContract({
        contractAddress: address,
        entrypoint: "is_valid_signature",
        calldata,
      })) as unknown as { result?: string[] } | string[];
      const value = Array.isArray(result) ? result[0] : result?.result?.[0];
      return value !== "0x0";
    } catch (error) {
      const result = (await provider.callContract({
        contractAddress: address,
        entrypoint: "isValidSignature",
        calldata,
      })) as unknown as { result?: string[] } | string[];
      const value = Array.isArray(result) ? result[0] : result?.result?.[0];
      return value !== "0x0";
    }
  }
}
