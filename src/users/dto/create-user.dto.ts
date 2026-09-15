import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User primary email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Full legal or display name of the user' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: 'P@ssword123!', description: 'User account password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Profile avatar image URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Software engineer & family historian', description: 'Short personal biography' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'], default: 'MEMBER', description: 'User role permission level' })
  @IsOptional()
  @IsString()
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'User account status' })
  @IsOptional()
  @IsString()
  status?: string;
}



