import { Injectable } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";
import crypto from "crypto";

import { PrismaService } from "../../../database/prisma.service";
import { SESSION_COOKIE_NAME } from "./auth.constants";
import { parseCookies } from "./auth.utils";

@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor(private readonly prisma: PrismaService) {
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
}
