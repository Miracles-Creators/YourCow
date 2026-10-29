import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { AuthGuard } from "./auth.guard";
import type { AuthenticatedRequest } from "./types";

@Injectable()
export class AdminGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin role required");
    }
    return true;
  }
}
