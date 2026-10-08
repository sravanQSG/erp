import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ALL_PERMISSION_KEYS, type PermissionKey } from '@demo-erp/shared-types';

export class CreateRoleDto {
  @ApiProperty({ example: 'billing-manager' })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional({ example: 'Can manage invoices and payments' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiPropertyOptional({ enum: ALL_PERMISSION_KEYS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(ALL_PERMISSION_KEYS, { each: true })
  permissions?: PermissionKey[];
}
