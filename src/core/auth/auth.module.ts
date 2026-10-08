import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readFileSync } from 'node:fs';
import ms from 'ms';
import { jwtConfig } from '../../config/configuration.js';
import { AuditLogModule } from '../../modules/audit-log/audit-log.module.js';
import { UsersModule } from '../../modules/users/users.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { User } from './entities/user.entity.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        privateKey: readFileSync(config.privateKeyPath, 'utf8'),
        publicKey: readFileSync(config.publicKeyPath, 'utf8'),
        signOptions: {
          algorithm: 'RS256',
          issuer: config.issuer,
          audience: config.audience,
          // `ms`'s StringValue template-literal type is stricter than our
          // env-sourced `string`; the underlying jsonwebtoken lib parses it
          // the same way at runtime regardless of this cast.
          expiresIn: config.accessTokenTtl as ms.StringValue,
        },
        verifyOptions: {
          algorithms: ['RS256'],
          issuer: config.issuer,
          audience: config.audience,
        },
      }),
    }),
    TenantsModule,
    UsersModule,
    AuditLogModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
