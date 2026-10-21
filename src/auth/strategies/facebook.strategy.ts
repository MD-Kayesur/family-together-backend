import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID || 'dummy-facebook-app-id',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'dummy-facebook-app-secret',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:8000/auth/facebook/callback',
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'displayName', 'photos', 'email', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      providerId: id,
      provider: 'facebook' as const,
      email: emails?.[0]?.value || `facebook_${id}@familyroots.app`,
      fullName:
        profile.displayName ||
        (name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : 'Facebook User'),
      avatarUrl: photos?.[0]?.value || null,
    };
    done(null, user);
  }
}
