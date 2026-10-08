import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/jwt-payload.interface.js';

/**
 * Extracts the authenticated user (decoded JWT payload) from the request.
 * Usage: `@CurrentUser() user: AuthenticatedUser` or
 * `@CurrentUser('tenantId') tenantId: string`.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    return field && user ? user[field] : user;
  },
);
