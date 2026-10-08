import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { readFileSync } from 'node:fs';
import { Repository } from 'typeorm';
import { jwtConfig } from '../../../config/configuration.js';
import type { JwtPayload } from '../../../common/types/jwt-payload.interface.js';
import { User } from '../entities/user.entity.js';
import { UserStatus } from '../entities/user-status.enum.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or disabled');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return payload;
  }
}
