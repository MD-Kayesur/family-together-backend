import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  createdAt: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  conversationId?: string;
  senderId?: string;
  tag?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  // In-memory subscription store: userId -> Array of PushSubscriptionData
  private readonly userSubscriptions = new Map<string, PushSubscriptionData[]>();

  private vapidKeys: { publicKey: string; privateKey: string };

  constructor() {
    this.initializeVapid();
  }

  private initializeVapid() {
    try {
      const pub = process.env.VAPID_PUBLIC_KEY;
      const priv = process.env.VAPID_PRIVATE_KEY;

      if (pub && priv) {
        this.vapidKeys = { publicKey: pub, privateKey: priv };
      } else {
        // Fallback default keys for instant zero-config operation
        this.vapidKeys = webpush.generateVAPIDKeys();
        this.logger.log('Generated in-memory VAPID keys for Web Push');
      }

      webpush.setVapidDetails(
        'mailto:support@familyroots.com',
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey,
      );
      this.logger.log('Web Push VAPID service configured successfully');
    } catch (err: any) {
      this.logger.error(`Failed to initialize VAPID: ${err.message}`);
    }
  }

  getPublicKey(): string {
    return this.vapidKeys?.publicKey || '';
  }

  saveSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) {
    if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return { success: false, message: 'Invalid push subscription payload' };
    }

    const current = this.userSubscriptions.get(userId) || [];
    // Deduplicate by endpoint
    const filtered = current.filter((s) => s.endpoint !== subscription.endpoint);
    filtered.push({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: subscription.userAgent,
      createdAt: new Date().toISOString(),
    });

    this.userSubscriptions.set(userId, filtered);
    this.logger.log(`Registered device push subscription for user ${userId} (${filtered.length} total active devices)`);
    return { success: true, totalDevices: filtered.length };
  }

  removeSubscription(userId: string, endpoint: string) {
    const current = this.userSubscriptions.get(userId);
    if (!current) return;
    const filtered = current.filter((s) => s.endpoint !== endpoint);
    if (filtered.length > 0) {
      this.userSubscriptions.set(userId, filtered);
    } else {
      this.userSubscriptions.delete(userId);
    }
  }

  async sendPushToUser(userId: string, payload: NotificationPayload) {
    const subscriptions = this.userSubscriptions.get(userId);
    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const stringifiedPayload = JSON.stringify({
      title: payload.title || 'New Family Message',
      body: payload.body || 'You received a new message.',
      icon: payload.icon || '/icon.png',
      badge: payload.badge || '/icon.png',
      url: payload.url || '/user-dashboard?tab=messages',
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      tag: payload.tag || `chat_${payload.conversationId || 'default'}`,
    });

    let sent = 0;
    let failed = 0;

    const deadEndpoints: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            stringifiedPayload,
          );
          sent++;
        } catch (err: any) {
          failed++;
          this.logger.warn(`Push dispatch failed for user ${userId} (${err.statusCode || err.message})`);
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription has expired or user unsubscribed
            deadEndpoints.push(sub.endpoint);
          }
        }
      }),
    );

    for (const ep of deadEndpoints) {
      this.removeSubscription(userId, ep);
    }

    return { sent, failed };
  }
}
