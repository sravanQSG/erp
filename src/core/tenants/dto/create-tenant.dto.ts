import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @Length(2, 255)
  name!: string;

  /**
   * Strictly validated so it can be safely used to derive the Postgres
   * schema name (`tenant_<slug>`) and interpolated into DDL statements.
   */
  @ApiProperty({
    example: 'acme',
    description:
      'Lowercase letters, digits and underscores only; must start with a letter. Used to derive the Postgres schema name.',
  })
  @IsString()
  @Length(2, 48)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'slug must start with a lowercase letter and contain only lowercase letters, digits, and underscores',
  })
  slug!: string;
}
