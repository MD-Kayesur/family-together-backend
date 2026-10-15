import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class RelationshipsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Number of relationship links per query (defaults to 1000 for complete tree rendering)',
    default: 1000,
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number = 1000;

  @ApiPropertyOptional({
    description: 'Filter relationships by verification status (VERIFIED, PENDING, REJECTED)',
    example: 'VERIFIED',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter relationships connected to a specific person ID (either as fromPerson or toPerson)',
    example: 'prsn_001',
  })
  @IsOptional()
  @IsString()
  personId?: string;

  @ApiPropertyOptional({
    description: 'Filter relationships by specific family ID (for My Family tab)',
    example: '6116bc2a-49e2-4856-874e-ef70ceeeea69',
  })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiPropertyOptional({
    description: 'Filter relationships by user ID (to show user own added family tree)',
    example: '491ec50e-eeb1-43bf-b235-f2fffd6ed0b2',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class CreateRelationshipDto {
  @ApiProperty({
    description: 'ID of the source person in the relationship link',
    example: 'prsn_001',
  })
  @IsString()
  fromPersonId: string;

  @ApiProperty({
    description: 'ID of the target person in the relationship link',
    example: 'prsn_002',
  })
  @IsString()
  toPersonId: string;

  @ApiPropertyOptional({
    description: 'Directional relationship type code (e.g. PARENT_CHILD, SPOUSE, SIBLING)',
    example: 'PARENT_CHILD',
  })
  @IsOptional()
  @IsString()
  typeCode?: string;
}
