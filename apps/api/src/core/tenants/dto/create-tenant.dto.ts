import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @Length(2, 255)
  name!: string;
}
