import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or controller) as not requiring authentication, bypassing
 * the global JwtAuthGuard. Use sparingly — e.g. login, refresh, health check.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
