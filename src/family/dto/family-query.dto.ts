import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MembersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter family members by gender (e.g. MALE, FEMALE, OTHER, UNKNOWN)',
    example: 'MALE',
    required: false,
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Filter members by deceased status (true / false)',
    example: false,
    required: false,
  })
  @IsOptional()
  isDeceased?: boolean | string;
}

export class MemoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter memories by creator User ID (privacy boundary)',
    example: 'usr_abc123',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter memories by creator email address',
    example: 'rahim@familyroots.org',
    required: false,
  })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({
    description: 'Filter memories by category (e.g. Heritage, Milestone, Travel, Celebration)',
    example: 'Heritage',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class EventsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter events by virtual attendance flag (true / false)',
    example: false,
    required: false,
  })
  @IsOptional()
  isVirtual?: boolean | string;
}

export class DocumentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter documents by category (e.g. Legal Records, Photos, Certificates)',
    example: 'Legal Records',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class InvitationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter invitation requests by status (PENDING, APPROVED, REJECTED)',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    example: 'PENDING',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class RelationshipsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter relationships by relationship status (ACTIVE, ENDED, PENDING_VERIFICATION)',
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific person ID',
    example: 'prs_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  personId?: string;
}

export class ActivityQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter activity logs by entity type (MEMBER, MEMORY, DOCUMENT, RELATIONSHIP)',
    example: 'MEMBER',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}
