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
