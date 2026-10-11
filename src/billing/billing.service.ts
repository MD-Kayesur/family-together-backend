import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import {
  PlanTier,
  PlanInterval,
  PricingPlan,
  CreateCheckoutSessionDto,
  CreatePortalSessionDto,
} from './billing.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  private readonly plans: PricingPlan[] = [
    {
      id: PlanTier.FREE,
      name: 'Free Sanctuary',
      tagline: 'Essential lineage and memory preservation for small families.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      storageLimitMb: 500, // 500 MB
      maxMembersLimit: 25,
      features: [
        { text: 'Up to 25 Family Members', included: true },
        { text: '500 MB Document & Media Vault', included: true },
        { text: 'Interactive Visual Family Tree', included: true },
        { text: 'Basic Milestone Memory Stories', included: true },
        { text: 'Event Calendar & RSVP Tracking', included: true },
        { text: '4K Ultra-HD Media Galleries', included: false },
        { text: 'GEDCOM Data Migration & Exports', included: false },
        { text: 'Priority Family Concierge Support', included: false },
      ],
    },
    {
      id: PlanTier.HERITAGE_PRO,
      name: 'Heritage Pro',
      tagline: 'Generational archives with generous high-resolution media vaults.',
      monthlyPrice: 9.99,
      yearlyPrice: 99.0, // ~17% discount
      storageLimitMb: 51200, // 50 GB
      maxMembersLimit: 150,
      badge: 'Most Popular',
      popular: true,
      features: [
        { text: 'Up to 150 Family Members', included: true },
        { text: '50 GB Encrypted Vault Storage', included: true },
        { text: '4K Ultra-HD Photo & Video Galleries', included: true },
        { text: 'Real-Time Person Profile Deduplication', included: true },
        { text: 'Multi-Batch Document Uploads up to 100MB', included: true },
        { text: 'Custom Sanctuary Branding & Theme Badges', included: true },
        { text: 'Priority Email & Live Chat Support', included: true },
        { text: 'GEDCOM Migration & Archival Exports', included: false },
      ],
    },
    {
      id: PlanTier.DYNASTY_UNLIMITED,
      name: 'Dynasty Unlimited',
      tagline: 'Unlimited lineage scale, GEDCOM imports, and permanent preservation.',
      monthlyPrice: 24.99,
      yearlyPrice: 249.0,
      storageLimitMb: 512000, // 500 GB
      maxMembersLimit: 10000,
      badge: 'Ultimate Sanctuary',
      features: [
        { text: 'Unlimited Relatives & Generations', included: true },
        { text: '500 GB High-Security Vault Archive', included: true },
        { text: 'Full GEDCOM File Import & Export (.ged)', included: true },
        { text: 'High-Res Printable Poster Generation (SVG/PDF)', included: true },
        { text: 'Unlimited Batch Document Storage', included: true },
        { text: 'Multi-Tenant Cross-Branch Linkage', included: true },
        { text: 'Audit Heatmap & Automated Heritage Backups', included: true },
        { text: '24/7 Dedicated Family Concierge Support', included: true },
      ],
    },
  ];

  constructor(private readonly prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes('placeholder')) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-02-24.acacia' as any,
      });
      this.logger.log('Stripe client initialized successfully with live/test secret key.');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not configured or in placeholder mode. Billing service running in seamless sandbox mode.',
      );
    }
  }

  /**
   * Return available pricing plans and feature matrix
   */
  getPlans(): PricingPlan[] {
    return this.plans;
  }

  /**
   * Helper to resolve the active family for a user or fallback to first family
   */
  private async resolveFamilyId(userId?: string, providedFamilyId?: string): Promise<string> {
    if (providedFamilyId) return providedFamilyId;
    if (userId) {
      const member = await this.prisma.familyMember.findFirst({
        where: { person: { userId } },
        select: { familyId: true },
      });
      if (member) return member.familyId;
    }
    const firstFamily = await this.prisma.family.findFirst({ select: { id: true } });
    if (!firstFamily) {
      throw new NotFoundException('No family sanctuary found. Please initialize a family sanctuary first.');
    }
    return firstFamily.id;
  }

  /**
   * Retrieve active subscription and storage usage metrics for a sanctuary
   */
  async getSubscription(userId?: string, familyId?: string) {
    const resolvedFamilyId = await this.resolveFamilyId(userId, familyId);

    // Find or initialize default FREE subscription
    let subscription = await this.prisma.subscription.findUnique({
      where: { familyId: resolvedFamilyId },
    });

    if (!subscription) {
      const family = await this.prisma.family.findUnique({
        where: { id: resolvedFamilyId },
        select: { createdBy: true },
      });
      subscription = await this.prisma.subscription.create({
        data: {
          familyId: resolvedFamilyId,
          userId: userId || family?.createdBy || 'system-owner',
          tier: 'FREE',
          status: 'ACTIVE',
          interval: 'MONTHLY',
          storageLimitMb: 500,
          storageUsedMb: 12.5, // Seed baseline
          maxMembersLimit: 25,
        },
      });
    }

    // Calculate actual storage usage and member counts
    const [totalMembers, totalDocuments, totalMemories] = await Promise.all([
      this.prisma.familyMember.count({ where: { familyId: resolvedFamilyId } }),
      this.prisma.document.count({ where: { familyId: resolvedFamilyId } }),
      this.prisma.memory.count({ where: { familyId: resolvedFamilyId } }),
    ]);

    // Approximate storage: 2.5MB per document + 1.2MB per memory photo
    const computedStorageMb = Math.round((totalDocuments * 2.5 + totalMemories * 1.2) * 10) / 10;
    const finalStorageUsed = Math.max(subscription.storageUsedMb, computedStorageMb);

    // Storage percentage calculation
    const storagePercent = Math.min(
      100,
      Math.round((finalStorageUsed / (subscription.storageLimitMb || 500)) * 100),
    );

    const planDetails = this.plans.find((p) => p.id === subscription.tier) || this.plans[0];

    return {
      subscription: {
        ...subscription,
        storageUsedMb: finalStorageUsed,
        storagePercent,
        currentMembersCount: totalMembers,
        totalDocuments,
        totalMemories,
      },
      plan: planDetails,
      isSandbox: !this.stripe,
    };
  }

  /**
   * Create a Stripe Checkout Session or sandbox simulation URL
   */
  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
    userId?: string,
    providedFamilyId?: string,
  ) {
    const resolvedFamilyId = await this.resolveFamilyId(userId, providedFamilyId);
    const plan = this.plans.find((p) => p.id === dto.tier);
    if (!plan) {
      throw new BadRequestException(`Invalid subscription tier: ${dto.tier}`);
    }

    if (dto.tier === PlanTier.FREE) {
      // Downgrade or switch to free tier directly
      await this.prisma.subscription.upsert({
        where: { familyId: resolvedFamilyId },
        update: {
          tier: 'FREE',
          status: 'ACTIVE',
          storageLimitMb: 500,
          maxMembersLimit: 25,
        },
        create: {
          familyId: resolvedFamilyId,
          userId: userId || 'system-owner',
          tier: 'FREE',
          status: 'ACTIVE',
          storageLimitMb: 500,
          maxMembersLimit: 25,
        },
      });

      return {
        url: dto.successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner-dashboard/billing?status=free_active`,
        sessionId: 'free_plan_applied',
      };
    }

    const priceAmount =
      dto.interval === PlanInterval.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl =
      dto.successUrl ||
      `${frontendBase}/owner-dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success`;
    const cancelUrl =
      dto.cancelUrl || `${frontendBase}/owner-dashboard/billing?status=cancelled`;

    // If Stripe is configured with API keys
    if (this.stripe) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          mode: 'subscription',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `FamilyRoots ${plan.name}`,
                  description: `${plan.tagline} (${dto.interval.toLowerCase()})`,
                  images: ['https://family-together-eta.vercel.app/brand/icon.png'],
                },
                unit_amount: Math.round(priceAmount * 100),
                recurring: {
                  interval: dto.interval === PlanInterval.YEARLY ? 'year' : 'month',
                },
              },
              quantity: 1,
            },
          ],
          client_reference_id: resolvedFamilyId,
          metadata: {
            familyId: resolvedFamilyId,
            userId: userId || '',
            tier: dto.tier,
            interval: dto.interval,
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        return {
          url: session.url,
          sessionId: session.id,
        };
      } catch (err: any) {
        this.logger.error(`Stripe checkout session creation failed: ${err.message}`, err.stack);
        throw new BadRequestException(`Stripe session error: ${err.message}`);
      }
    }

    // Seamless Sandbox / Simulation Mode
    // Automatically upgrades subscription in PostgreSQL for instant testing
    await this.prisma.subscription.upsert({
      where: { familyId: resolvedFamilyId },
      update: {
        tier: dto.tier,
        status: 'ACTIVE',
        interval: dto.interval,
        storageLimitMb: plan.storageLimitMb,
        maxMembersLimit: plan.maxMembersLimit,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeSubscriptionId: `sub_sim_${Date.now()}`,
      },
      create: {
        familyId: resolvedFamilyId,
        userId: userId || 'system-owner',
        tier: dto.tier,
        status: 'ACTIVE',
        interval: dto.interval,
        storageLimitMb: plan.storageLimitMb,
        maxMembersLimit: plan.maxMembersLimit,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeSubscriptionId: `sub_sim_${Date.now()}`,
      },
    });

    return {
      url: `${frontendBase}/owner-dashboard/billing?status=success&tier=${dto.tier}&sandbox=true`,
      sessionId: `sim_${Date.now()}`,
      message: `Sanctuary upgraded to ${plan.name} in developer sandbox mode.`,
    };
  }

  /**
   * Create a Stripe Customer Billing Portal Session
   */
  async createPortalSession(
    dto: CreatePortalSessionDto,
    userId?: string,
    providedFamilyId?: string,
  ) {
    const resolvedFamilyId = await this.resolveFamilyId(userId, providedFamilyId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { familyId: resolvedFamilyId },
    });

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = dto.returnUrl || `${frontendBase}/owner-dashboard/billing`;

    if (this.stripe && subscription?.stripeCustomerId) {
      const portal = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });
      return { url: portal.url };
    }

    // Sandbox / fallback portal return
    return {
      url: `${returnUrl}?portal=simulated`,
      message: 'Stripe Customer Portal simulated in development mode.',
    };
  }

  /**
   * Handle incoming Stripe webhook events
   */
  async handleWebhook(rawBody: string | Buffer, signature?: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (this.stripe && webhookSecret && signature) {
      try {
        event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        this.logger.error(`Webhook signature verification failed: ${err.message}`);
        throw new BadRequestException(`Webhook Error: ${err.message}`);
      }
    } else {
      // In sandbox / unverified webhook test mode, parse body JSON directly
      try {
        event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
      } catch {
        return { received: true, simulated: true };
      }
    }

    this.logger.log(`Handling Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const familyId = session.metadata?.familyId || session.client_reference_id;
        const tier = (session.metadata?.tier as PlanTier) || PlanTier.HERITAGE_PRO;
        const interval = (session.metadata?.interval as PlanInterval) || PlanInterval.MONTHLY;

        if (familyId) {
          const plan = this.plans.find((p) => p.id === tier) || this.plans[1];
          await this.prisma.subscription.upsert({
            where: { familyId },
            update: {
              tier,
              status: 'ACTIVE',
              interval,
              stripeCustomerId: (session.customer as string) || null,
              stripeSubscriptionId: (session.subscription as string) || null,
              storageLimitMb: plan.storageLimitMb,
              maxMembersLimit: plan.maxMembersLimit,
            },
            create: {
              familyId,
              userId: session.metadata?.userId || 'stripe-webhook',
              tier,
              status: 'ACTIVE',
              interval,
              stripeCustomerId: (session.customer as string) || null,
              stripeSubscriptionId: (session.subscription as string) || null,
              storageLimitMb: plan.storageLimitMb,
              maxMembersLimit: plan.maxMembersLimit,
            },
          });
          this.logger.log(`Subscription activated for family ${familyId}: ${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await this.prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            tier: 'FREE',
            status: 'CANCELED',
            storageLimitMb: 500,
            maxMembersLimit: 25,
          },
        });
        this.logger.log(`Subscription cancelled for Stripe customer: ${customerId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status === 'active' ? 'ACTIVE' : 'PAST_DUE';
        await this.prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status },
        });
        break;
      }
    }

    return { received: true };
  }
}
