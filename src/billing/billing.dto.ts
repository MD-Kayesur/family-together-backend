import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export enum PlanTier {
  FREE = 'FREE',
  HERITAGE_PRO = 'HERITAGE_PRO',
  DYNASTY_UNLIMITED = 'DYNASTY_UNLIMITED',
}

export enum PlanInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export class CreateCheckoutSessionDto {
  @ApiProperty({
    enum: PlanTier,
    description: 'Target subscription tier',
    example: PlanTier.HERITAGE_PRO,
  })
  @IsEnum(PlanTier)
  tier: PlanTier;

  @ApiProperty({
    enum: PlanInterval,
    description: 'Billing billing cadence',
    example: PlanInterval.MONTHLY,
  })
  @IsEnum(PlanInterval)
  interval: PlanInterval;

  @ApiPropertyOptional({
    description: 'Optional URL to redirect after successful checkout',
    example: 'http://localhost:3000/owner-dashboard/billing?status=success',
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional URL to redirect upon cancelled checkout',
    example: 'http://localhost:3000/owner-dashboard/billing?status=cancelled',
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class CreatePortalSessionDto {
  @ApiPropertyOptional({
    description: 'Optional return URL after leaving Stripe customer portal',
    example: 'http://localhost:3000/owner-dashboard/billing',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: PlanTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  storageLimitMb: number;
  maxMembersLimit: number;
  badge?: string;
  popular?: boolean;
  features: PlanFeature[];
}

export class UpdateMemberSubscriptionDto {
  @ApiProperty({
    enum: ['FREE', 'PRO', 'UNLIMITED'],
    description: 'Target member subscription tier',
    example: 'PRO',
  })
  @IsString()
  tier: 'FREE' | 'PRO' | 'UNLIMITED';

  @ApiPropertyOptional({
    description: 'Custom storage limit in MB for the member (defaults to 5000 MB for PRO)',
    example: 5000,
  })
  @IsOptional()
  storageLimitMb?: number;

  @ApiPropertyOptional({
    description: 'Whether the member has permissions to add more relatives',
    example: true,
  })
  @IsOptional()
  canAddMembers?: boolean;

  @ApiPropertyOptional({
    description: 'Optional note or custom justification',
    example: 'Family archivist and genealogist branch lead',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export interface MemberSubscriptionRecord {
  memberId: string;
  personId: string;
  userId?: string | null;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  familyRole: string;
  tier: 'FREE' | 'PRO' | 'UNLIMITED';
  storageLimitMb: number;
  storageUsedMb: number;
  canAddMembers: boolean;
  canUseAllFeatures: boolean;
  grantedAt?: string;
  note?: string;
}
