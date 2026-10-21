import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const isConfigured =
      process.env.FACEBOOK_APP_ID &&
      !process.env.FACEBOOK_APP_ID.startsWith('your-') &&
      !process.env.FACEBOOK_APP_ID.startsWith('dummy-');

    if (!isConfigured || req.query.simulated === 'true') {
      return true;
    }
    return super.canActivate(context);
  }
}
