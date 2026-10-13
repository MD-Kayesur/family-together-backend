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

export class AnnouncementsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  search?: string;
}
