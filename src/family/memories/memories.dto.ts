import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MemoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter memories belonging to or shared with a specific user ID',
    example: 'usr_8392183',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter memories belonging to or shared with a user email',
    example: 'user@familyroots.io',
  })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({
    description: 'Filter memories by category (e.g. Milestone, Gathering, Historical)',
    example: 'Milestone',
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateMemoryDto {
  @ApiProperty({
    description: 'Title of the family memory',
    example: 'Summer Family Gathering 2024',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed story, reflection, or description of the moment',
    example: 'A wonderful evening in the backyard where four generations gathered.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Name of the family member who shared or authored this memory',
    example: 'Grandpa Rahman',
  })
  @IsOptional()
  @IsString()
  sharedBy?: string;

  @ApiPropertyOptional({
    description: 'ID of the author user account for privacy isolation',
    example: 'usr_123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Email of the author for privacy isolation',
    example: 'author@family.com',
  })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({
    description: 'Date when the moment occurred (YYYY-MM-DD or readable format)',
    example: '2024-07-15',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Location or place where the memory was captured',
    example: 'Sylhet, Bangladesh',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Memory category or collection tag',
    example: 'Family Reunion',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Primary media image/photo URL',
    example: 'https://images.unsplash.com/photo-1511895426328-dc8714191300',
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Multiple media photo URLs for gallery slider',
    type: [String],
    example: ['https://images.unsplash.com/photo-1511895426328-dc8714191300'],
  })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Comma-separated names of relatives tagged in this memory',
    example: 'Tariq, Zain, Salma',
  })
  @IsOptional()
  @IsString()
  taggedMembers?: string;

  @ApiPropertyOptional({
    description: 'Privacy level of the memory (e.g. PUBLIC, PRIVATE, FAMILY)',
    example: 'FAMILY',
  })
  @IsOptional()
  @IsString()
  privacy?: string;
}

export class UpdateMemoryDto {
  @ApiPropertyOptional({
    description: 'Updated title of the memory',
    example: 'Annual Summer Gathering 2024 (Updated)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated story or description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated author/sharer attribution',
  })
  @IsOptional()
  @IsString()
  sharedBy?: string;

  @ApiPropertyOptional({
    description: 'Updated date of occurrence',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Updated location',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Updated category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Updated single media URL',
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Updated array of media URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Updated tagged relatives',
  })
  @IsOptional()
  @IsString()
  taggedMembers?: string;

  @ApiPropertyOptional({
    description: 'Updated privacy level',
  })
  @IsOptional()
  @IsString()
  privacy?: string;
}
