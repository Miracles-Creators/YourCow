import { Body, Controller, Get, Post, Req, Res, UseGuards, UnauthorizedException } from "@nestjs/common";
import type { Response } from "express";

import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from "./auth.constants";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { WalletChallengeDto } from "./dto/wallet-challenge.dto";
import { LinkWalletDto } from "./dto/link-wallet.dto";
import type { AuthenticatedRequest } from "./types";
import { UserRole } from "@prisma/client";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.loginWithEmail(
      body.email,
      body.name,
      body.role as UserRole | undefined,
    );
    const token = this.authService.createSessionToken(user.id);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return user;
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get("me")
  async me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(AuthGuard)
  @Post("wallet/challenge")
  async walletChallenge(
    @Req() req: AuthenticatedRequest,
    @Body() body: WalletChallengeDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Unauthorized");
    }
    return this.authService.createWalletLinkChallenge(req.user.id, body.address);
  }

  @UseGuards(AuthGuard)
  @Post("wallet/link")
  async linkWallet(
    @Req() req: AuthenticatedRequest,
    @Body() body: LinkWalletDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Unauthorized");
    }
    return this.authService.linkWallet(req.user.id, body.address, body.signature);
  }
}
