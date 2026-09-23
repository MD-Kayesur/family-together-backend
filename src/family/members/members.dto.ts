import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MembersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter family members by gender (e.g. MALE, FEMALE, OTHER, UNKNOWN)',
    example: 'FEMALE',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Filter by living status (true for deceased ancestors, false for living relatives)',
    example: false,
  })
  @IsOptional()
  isDeceased?: boolean | string;
}

export class CreateMemberDto {
  @ApiPropertyOptional({
    description: 'ID of an existing person record to associate with the sanctuary rather than creating a new person',
    example: 'prsn_93817',
  })
  @IsOptional()
  @IsString()
  existingPersonId?: string;

  @ApiProperty({
    description: 'First name of the family member',
    example: 'Zain',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name / family surname',
    example: 'Rahman',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Email address of member for notifications and platform account provisioning',
    example: 'zain.rahman@familyroots.io',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Initial password for provisioned platform sign-in account (defaults to Family@123 if omitted)',
    example: 'SecurePass123!',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'Gender of member (MALE, FEMALE, OTHER, UNKNOWN)',
    example: 'MALE',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Biographical history, life story, personal achievements',
    example: 'Born in Sylhet, settled in London in 1982. Passionate gardener and family historian.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Role within the family tree sanctuary (e.g. ELDER, MEMBER, YOUTH)',
    example: 'MEMBER',
  })
  @IsOptional()
  @IsString()
  roleInFamily?: string;

  @ApiPropertyOptional({
    description: 'Middle name or maiden name',
    example: 'Ahmed',
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({
    description: 'Nickname, preferred moniker, or informal title',
    example: 'Joy',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1985-04-12',
  })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional({
    description: 'Birthplace town, district, or hospital',
    example: 'Sylhet, Bangladesh',
  })
  @IsOptional()
  @IsString()
  birthplace?: string;

  @ApiPropertyOptional({
    description: 'Whether this ancestor is deceased',
    example: false,
  })
  @IsOptional()
  isDeceased?: boolean;

  @ApiPropertyOptional({
    description: 'Date of passing if deceased',
    example: '2020-11-03',
  })
  @IsOptional()
  @IsString()
  dateOfPassing?: string;

  @ApiPropertyOptional({
    description: 'Profession, trade, or occupation',
    example: 'Civil Engineer',
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Current city or residence country',
    example: 'London, UK',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Contact telephone or secondary email',
    example: '+44 7700 900077',
  })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Avatar portrait image URL',
    example: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'ID of an existing relative to establish automatic directional linkage with',
    example: 'prsn_102',
  })
  @IsOptional()
  @IsString()
  relativeToPersonId?: string;

  @ApiPropertyOptional({
    description: 'Relationship type to relativeToPersonId (e.g. FATHER, MOTHER, SON, DAUGHTER, SPOUSE, BROTHER, SISTER)',
    example: 'SON',
  })
  @IsOptional()
  @IsString()
  relationshipType?: string;
}

export class UpdateMemberDto {
  @ApiPropertyOptional({
    description: 'Updated first name',
    example: 'Zain',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Updated last name',
    example: 'Rahman',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Updated biography',
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
