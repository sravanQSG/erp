import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config/configuration.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');

  app.use(helmet());
  app.enableCors({ origin: appConfig.corsOrigin, credentials: true });

  // Global ValidationPipe/ExceptionFilter/Guards/Interceptors are registered
  // as APP_* providers in AppModule (not imperatively here) so they're also
  // active in Nest TestingModule-based e2e tests, not just this bootstrap.

  const swaggerConfig = new DocumentBuilder()
    .setTitle(appConfig.name)
    .setDescription('Multi-tenant ERP API')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(appConfig.port);
}

await bootstrap();
