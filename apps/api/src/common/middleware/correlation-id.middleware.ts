import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Assigns a request id (reusing an inbound `x-request-id` if present) so
 * logs and error responses can be correlated across a single request.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const id =
      (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
    req.id = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
