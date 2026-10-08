import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'new.hire@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'correct horse battery staple' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'New Hire' })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional({
    example: ['member'],
    description: 'Role names to assign within the tenant. Defaults to ["member"].',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleNames?: string[];
}
