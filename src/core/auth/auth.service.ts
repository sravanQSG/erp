import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import ms from 'ms';
import { jwtConfig } from '../../config/configuration.js';
import type { JwtPayload } from '../../common/types/jwt-payload.interface.js';
import { DRIZZLE_DB } from '../../database/drizzle.constants.js';
import {
  refreshTokens,
  roles,
  users,
  UserStatus,
  type User,
} from '../../database/schema/index.js';
import * as schema from '../../database/schema/index.js';
import { AuditLogService } from '../../modules/audit-log/audit-log.service.js';
import { TenantConnectionService } from '../tenant-context/tenant-connection.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import {
  TenantUserAccess,
  TenantUsersService,
} from '../../modules/users/users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { hashPassword, verifyPassword } from './password.util.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const PLATFORM_ADMIN_ROLE = 'platform_admin';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtCfg: ConfigType<typeof jwtConfig>,
    private readonly tenantsService: TenantsService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly tenantUsersService: TenantUsersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(dto: LoginDto): Promise<TokenPair> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordValid = await verifyPassword(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { schemaName, access } = await this.resolveAccessForUser(user);
    return this.issueTokenPair(user, schemaName, access);
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const [existing] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: the presented token is single-use.
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, existing.id));

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, existing.userId))
      .limit(1);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { schemaName, access } = await this.resolveAccessForUser(user);
    return this.issueTokenPair(user, schemaName, access);
  }

  async logout(dto: RefreshTokenDto): Promise<void> {
    const tokenHash = this.hashToken(dto.refreshToken);
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  /**
   * Creates a new global user plus their tenant profile/role assignment.
   * Bridges the public schema (the `users` row) and the tenant's schema
   * (profile + roles), mirroring the cross-schema coordination used by
   * TenantProvisioningService.
   */
  async createUserForTenant(
    tenantId: string,
    dto: CreateUserDto,
    actorUserId: string,
  ): Promise<{ userId: string }> {
    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);
    if (existing) {
      throw new ConflictException(`Email "${dto.email}" is already registered`);
    }

    const tenant = await this.tenantsService.findById(tenantId);
    const passwordHash = await hashPassword(dto.password);
    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        passwordHash,
        tenantId: tenant.id,
        status: UserStatus.ACTIVE,
      })
      .returning();

    const roleNames = dto.roleNames?.length ? dto.roleNames : ['member'];
    await this.tenantConnection.runInTenantSchema(tenant.schemaName, async (tenantDb) => {
      const profile = await this.tenantUsersService.createProfile(
        tenantDb,
        user.id,
        dto.displayName,
      );
      const roleRows = await tenantDb
        .select()
        .from(roles)
        .where(inArray(roles.name, roleNames));
      for (const role of roleRows) {
        await this.tenantUsersService.assignRole(tenantDb, profile.id, role.id);
      }
      await this.auditLogService.record(tenantDb, {
        actorUserId,
        action: 'user.created',
        entityType: 'tenant_user',
        entityId: profile.id,
        metadata: { email: dto.email, roleNames },
      });
    });

    return { userId: user.id };
  }

  private async resolveAccessForUser(
    user: User,
  ): Promise<{ schemaName: string | null; access: TenantUserAccess }> {
    if (!user.tenantId) {
      // Tenant-less platform admin: no tenant-scoped roles/permissions to resolve.
      return { schemaName: null, access: { roleNames: [], permissions: [] } };
    }
    const tenant = await this.tenantsService.findById(user.tenantId);
    const access = await this.tenantConnection.runInTenantSchema(
      tenant.schemaName,
      (tenantDb) => this.tenantUsersService.getAccessForGlobalUser(tenantDb, user.id),
    );
    return { schemaName: tenant.schemaName, access };
  }

  private async issueTokenPair(
    user: User,
    schemaName: string | null,
    access: TenantUserAccess,
  ): Promise<TokenPair> {
    const userRoles = user.isPlatformAdmin
      ? [...access.roleNames, PLATFORM_ADMIN_ROLE]
      : access.roleNames;

    const payload: Pick<
      JwtPayload,
      'sub' | 'tenantId' | 'schemaName' | 'email' | 'roles' | 'permissions' | 'tokenVersion'
    > = {
      sub: user.id,
      tenantId: user.tenantId,
      schemaName,
      email: user.email,
      roles: userRoles,
      permissions: access.permissions,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.issueRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + ms(this.jwtCfg.refreshTokenTtl as ms.StringValue),
    );

    await this.db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });
    return rawToken;
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
