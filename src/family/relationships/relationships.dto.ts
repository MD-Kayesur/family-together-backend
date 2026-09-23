import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class RelationshipsQueryDto extends PaginationQueryDto {
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
