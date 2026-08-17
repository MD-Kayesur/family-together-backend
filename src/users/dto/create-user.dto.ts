import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User primary email address' })
  email: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Full legal or display name of the user' })
  fullName: string;

  @ApiPropertyOptional({ example: 'P@ssword123!', description: 'User account password' })
  password?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Profile avatar image URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Contact phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Software engineer & family historian', description: 'Short personal biography' })
  bio?: string;

  @ApiPropertyOptional({ enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'], default: 'MEMBER', description: 'User role permission level' })
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}


