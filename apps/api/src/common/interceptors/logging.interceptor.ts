import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '@demo-erp/shared-types';

/**
 * Logs request method/url plus the authenticated user/tenant (once resolved
 * by the auth guard) and response time. Request-level access logging itself
 * is handled by `pino-http`; this adds ERP-specific context.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.debug(
          {
            method: request.method,
            url: request.originalUrl,
            tenantId: request.user?.tenantId,
            userId: request.user?.sub,
            durationMs: Date.now() - start,
          },
          'request completed',
        );
      }),
    );
  }
}
