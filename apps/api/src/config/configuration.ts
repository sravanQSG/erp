import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  name: string;
  corsOrigin: string;
  logLevel: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: boolean;
  poolSize: number;
}

export interface JwtConfig {
  privateKeyPath: string;
  publicKeyPath: string;
  issuer: string;
  audience: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
}

export interface ThrottleConfig {
  ttlSeconds: number;
  limit: number;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    name: process.env.APP_NAME ?? 'demo-erp',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    logLevel: process.env.LOG_LEVEL ?? 'info',
  }),
);

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? '',
    ssl: process.env.DB_SSL === 'true',
    logging: process.env.DB_LOGGING === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
  }),
);

export const jwtConfig = registerAs(
  'jwt',
  (): JwtConfig => ({
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH ?? 'keys/private.pem',
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH ?? 'keys/public.pem',
    issuer: process.env.JWT_ISSUER ?? 'demo-erp',
    audience: process.env.JWT_AUDIENCE ?? 'demo-erp-clients',
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL ?? '30d',
  }),
);

export const throttleConfig = registerAs(
  'throttle',
  (): ThrottleConfig => ({
    ttlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  }),
);
