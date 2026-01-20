import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

import { AuthService } from "./auth.service";
import type { AuthenticatedRequest } from "./types";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.authService.getUserFromRequest(request.headers);
    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }
    request.user = user;
    return true;
  }
}
