import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../common/types/jwt-payload.interface.js';
import { PERMISSIONS } from '../../modules/roles/constants/permissions.constant.js';
import { AuthService, TokenPair } from './auth.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<TokenPair> {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPair> {
    return this.authService.refresh(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto): Promise<{ success: true }> {
    await this.authService.logout(dto);
    return { success: true };
  }

  /**
   * Invites/creates a new user within the caller's own tenant. `tenantId`
   * is always taken from the authenticated caller's JWT, never the request
   * body, so a tenant admin can't create users in a different tenant.
   */
  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.USERS_INVITE)
  @Post('users')
  createUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateUserDto,
  ): Promise<{ userId: string }> {
    if (!currentUser.tenantId) {
      throw new ForbiddenException(
        'This account is not associated with a tenant',
      );
    }
    return this.authService.createUserForTenant(
      currentUser.tenantId,
      dto,
      currentUser.sub,
    );
  }

  /**
   * Platform-admin only: bootstraps the first admin user for a tenant right
   * after it's provisioned (no tenant-scoped admin exists yet to use
   * POST /auth/users). Lives here rather than on TenantsController to avoid
   * a circular module dependency (AuthModule already imports TenantsModule
   * for TenantsService; the reverse import would create a cycle).
   */
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('platform_admin')
  @Post('tenants/:tenantId/admin-user')
  bootstrapTenantAdmin(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateUserDto,
  ): Promise<{ userId: string }> {
    if (!dto.roleNames?.length) {
      dto.roleNames = ['admin'];
    }
    return this.authService.createUserForTenant(tenantId, dto, currentUser.sub);
  }
}
