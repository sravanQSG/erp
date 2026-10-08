import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../../common/types/jwt-payload.interface.js';
import { TenantConnectionService } from './tenant-connection.service.js';

/**
 * Global interceptor (runs after guards, so `request.user` is already
 * populated by JwtAuthGuard/JwtStrategy for authenticated routes). Opens a
 * QueryRunner pinned to the request's tenant schema and stores it in an
 * AsyncLocalStorage-backed CLS context (`TenantContextService`) for the
 * duration of the request, releasing it back to the pool once the response
 * completes or errors. Public routes (no `request.user`) and requests from
 * tenant-less platform admins (no `schemaName`) pass straight through — no
 * tenant context is needed or created.
 *
 * Uses the untyped `ClsService` here too — see TenantContextService for why.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly cls: ClsService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user || !user.schemaName) {
      return next.handle();
    }
    const schemaName = user.schemaName;

    return new Observable((subscriber) => {
      this.cls.run(() => {
        this.tenantConnection
          .acquire(schemaName)
          .then((queryRunner) => {
            this.cls.set('tenantId', user.tenantId);
            this.cls.set('schemaName', user.schemaName);
            this.cls.set('queryRunner', queryRunner);

            next.handle().subscribe({
              next: (value) => subscriber.next(value),
              error: (err: unknown) => {
                void this.tenantConnection
                  .release(queryRunner)
                  .finally(() => subscriber.error(err));
              },
              complete: () => {
                void this.tenantConnection
                  .release(queryRunner)
                  .finally(() => subscriber.complete());
              },
            });
          })
          .catch((err: unknown) => subscriber.error(err));
      });
    });
  }
}
