import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { readFileSync } from 'node:fs';
import { jwtConfig } from '../../../config/configuration.js';
import type { JwtPayload } from '../../../common/types/jwt-payload.interface.js';
import { DRIZZLE_DB } from '../../../database/drizzle.constants.js';
import { users, UserStatus } from '../../../database/schema/index.js';
import * as schema from '../../../database/schema/index.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase<typeof schema>,
    @Inject(jwtConfig.KEY) config: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: readFileSync(config.publicKeyPath, 'utf8'),
      algorithms: ['RS256'],
      issuer: config.issuer,
      audience: config.audience,
    });
  }

  /**
   * Runs on every authenticated request. Re-checks `tokenVersion` against
   * the stored value so a password reset / forced logout instantly
   * invalidates any previously issued access tokens, not just refresh
   * tokens (small cost: one indexed PK lookup on `public.users`).
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or disabled');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return payload;
  }
}
