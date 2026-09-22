import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class UsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter users by system role (e.g. SUPER_ADMIN, ADMIN, OWNER, MEMBER, USER)',
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter users by account status (e.g. ACTIVE, INACTIVE, SUSPENDED)',
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;
}
