import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Optional refresh token if not provided in HttpOnly cookie' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
