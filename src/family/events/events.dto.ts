import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class EventsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter events by virtual attendance flag (true / false)',
    example: false,
  })
  @IsOptional()
  isVirtual?: boolean | string;

  @ApiPropertyOptional({
    description: 'Filter events by status: ACTIVE (upcoming or today) or INACTIVE (expired/past date)',
    enum: ['ACTIVE', 'INACTIVE', 'ALL'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Title of the celebration, milestone, or reunion',
    example: 'Rahman Family Annual Reunion 2026',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Date and time of the event (ISO 8601 or YYYY-MM-DD)',
    example: '2026-10-15T18:00:00.000Z',
  })
  @IsString()
  date: string;

  @ApiPropertyOptional({
    description: 'Physical venue address or virtual meeting URL',
    example: 'Community Center, Sylhet / Zoom Link',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Detailed description or agenda of the family celebration or gathering',
    example: 'Annual gathering of all relatives with dinner, family tree presentation, and activities.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the event is virtual',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;
}

export class UpdateEventDto {
  @ApiPropertyOptional({
    description: 'Title of the celebration, milestone, or reunion',
    example: 'Rahman Family Annual Reunion 2026',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Date and time of the event (ISO 8601 or YYYY-MM-DD)',
    example: '2026-10-15T18:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Physical venue address or virtual meeting URL',
    example: 'Community Center, Sylhet / Zoom Link',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Detailed description or agenda of the family celebration or gathering',
    example: 'Annual gathering of all relatives with dinner, family tree presentation, and activities.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the event is virtual',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;
}
