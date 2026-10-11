import {
  Controller,
  Get,
  Post,
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
}
