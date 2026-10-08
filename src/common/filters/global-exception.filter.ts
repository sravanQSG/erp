import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Single global exception filter (deliberately not split into a separate
 * HttpException-specific filter + catch-all: with two `@Catch()` filters
 * registered via `app.useGlobalFilters()`, Nest's filter selection did not
 * reliably prefer the more specific one in practice, which silently
 * dropped the detailed class-validator messages for 400s — see session
 * history). Branches internally instead, which is unambiguous.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] }).message ??
            exception.message);

      const body: ErrorResponseBody = {
        statusCode: status,
        message,
        error: exception.name,
        path: request.url,
        timestamp: new Date().toISOString(),
        requestId: request.id,
      };
      response.status(status).json(body);
      return;
    }

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.id,
    });
  }
}
