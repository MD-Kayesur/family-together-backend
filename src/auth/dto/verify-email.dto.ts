import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'Registered user email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '481920', description: '6-digit verification code' })
  @IsString()
  @Length(4, 10)
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'legacy-token-string', description: 'Optional verification token for link-based validation' })
  @IsString()
  @IsOptional()
  token?: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com', description: 'Registered email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
