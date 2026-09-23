import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class InvitationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter invitations by status (PENDING, APPROVED, REJECTED)',
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Full name of the invited relative',
    example: 'Salma Begum',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address where join invitation token will be sent',
    example: 'salma.begum@gmail.com',
  })
  @IsString()
  email: string;

  @ApiPropertyOptional({
    description: 'Assigned platform role upon acceptance (MEMBER, VIEWER, ADMIN)',
    example: 'MEMBER',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Context note or relative verification details',
    example: 'Aunt from Sylhet, elder sister of Zain',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateInvitationStatusDto {
  @ApiProperty({
    description: 'Approval status for join invitation (APPROVED, REJECTED)',
    example: 'APPROVED',
  })
  @IsString()
  status: string;
}
