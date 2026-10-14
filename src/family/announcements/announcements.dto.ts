import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BroadcastEmailDto {
  @ApiProperty({ example: 'Annual Family Reunion 2026 - Date & Venue Finalized' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Dear Family,\n\nWe are thrilled to announce that our 2026 reunion will take place...' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: 'ALL' })
  @IsOptional()
  targetRole?: string;

  @ApiPropertyOptional({ example: 'NORMAL' })
  @IsOptional()
  priority?: string;
}

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AnnouncementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'ALL', description: 'Filter broadcasts by target role' })
  @IsOptional()
  @IsString()
  targetRole?: string;
}
