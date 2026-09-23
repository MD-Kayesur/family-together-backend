import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

export class UpdateFamilyDetailsDto {
  @ApiPropertyOptional({
    description: 'Updated sanctuary family name',
    example: 'The Rahman Family',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated sanctuary heritage biography and description',
    example: 'Dedicated to preserving our shared history and celebrating generations.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSanctuarySettingsDto {
  @ApiPropertyOptional({
    description: 'Updated sanctuary display name',
    example: 'The Rahman Family Sanctuary',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated sanctuary description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ActivityQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter activity logs by event type (e.g. MEMBER_ADDED, MEMORY_CREATED, USER_JOINED)',
    example: 'MEMBER_ADDED',
  })
  @IsOptional()
  @IsString()
  type?: string;
}
