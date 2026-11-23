import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import {
  CreateCheckoutSessionDto,
  CreatePortalSessionDto,
  UpdateMemberSubscriptionDto,
} from './billing.dto';

@ApiTags('Billing & Subscriptions')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'Get all subscription pricing plans and storage quotas [Role: PUBLIC]',
    description: `**Route:** \`GET /billing/plans\`
**Purpose:** Retrieves subscription pricing tiers (Free Sanctuary, Heritage Pro, Dynasty Unlimited) with monthly/yearly pricing, member caps, storage limits, and full feature matrices.
**Allowed Roles:** \`PUBLIC\` (Open to all visitors and authenticated members).`,
  })
  @ApiResponse({ status: 200, description: 'List of pricing plans retrieved successfully' })
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('subscription')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Get active sanctuary subscription status, storage usage, and limits [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`GET /billing/subscription\`
**Purpose:** Returns the current family sanctuary subscription tier, status, storage used in MB, storage percent, and member quotas.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`.`,
  })
  @ApiResponse({ status: 200, description: 'Active subscription status returned successfully' })
  getSubscription(
    @Query('familyId') familyId?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.billingService.getSubscription(userId, familyId);
  }

  @Post('checkout')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Create Stripe Checkout Session to upgrade subscription [Roles: OWNER, ADMIN]',
    description: `**Route:** \`POST /billing/checkout\`
**Purpose:** Generates a secure hosted Stripe Checkout session URL for subscription upgrades to Heritage Pro or Dynasty Unlimited.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`.`,
  })
  @ApiResponse({ status: 200, description: 'Checkout session created successfully with redirect URL' })
  createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @Query('familyId') familyId?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.billingService.createCheckoutSession(dto, userId, familyId);
  }

  @Post('portal')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Create Stripe Customer Billing Portal session [Roles: OWNER, ADMIN]',
    description: `**Route:** \`POST /billing/portal\`
**Purpose:** Generates a Stripe billing management portal link where family owners can update payment cards, view invoices, or cancel subscriptions.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`.`,
  })
  @ApiResponse({ status: 200, description: 'Billing portal URL generated successfully' })
  createPortalSession(
    @Body() dto: CreatePortalSessionDto,
    @Query('familyId') familyId?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.billingService.createPortalSession(dto, userId, familyId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe Webhook Listener [Role: PUBLIC / STRIPE]',
    description: `**Route:** \`POST /billing/webhook\`
**Purpose:** Securely processes real-time Stripe asynchronous webhook events (checkout.session.completed, customer.subscription.deleted, invoice.payment_failed).
**Allowed Roles:** \`PUBLIC\` (Secured via Stripe cryptographic signature verification).`,
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  handleWebhook(
    @Body() rawBody: any,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.billingService.handleWebhook(rawBody, signature);
  }

  @Get('member-subscriptions')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Get all sanctuary members with their assigned subscription tiers and quotas [Roles: OWNER, ADMIN]',
    description: `Retrieves a list of family members with their allocated tier (FREE, PRO, UNLIMITED), storage quotas (e.g. 5,000 MB), and feature flags.`,
  })
  @ApiResponse({ status: 200, description: 'Member subscriptions retrieved' })
  getMemberSubscriptions(
    @Query('familyId') familyId?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.billingService.getMemberSubscriptions(userId, familyId);
  }

  @Patch('member-subscriptions/:id')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Update member subscription tier, storage quota (e.g. 5,000 MB) or feature access [Roles: OWNER, ADMIN]',
    description: `Enables the Owner to allocate a PRO tier (5,000 MB storage quota, member addition privileges, full platform access) to any member.`,
  })
  @ApiResponse({ status: 200, description: 'Member subscription tier updated successfully' })
  updateMemberSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateMemberSubscriptionDto,
    @Req() req?: any,
  ) {
    const callerUserId = req?.user?.id;
    return this.billingService.updateMemberSubscription(id, dto, callerUserId);
  }
}
