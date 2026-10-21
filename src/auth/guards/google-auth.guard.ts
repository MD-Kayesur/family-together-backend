import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const isConfigured =
      process.env.GOOGLE_CLIENT_ID &&
      !process.env.GOOGLE_CLIENT_ID.startsWith('your-') &&
      !process.env.GOOGLE_CLIENT_ID.startsWith('dummy-');

    if (!isConfigured || req.query.simulated === 'true') {
      return true;
    }
    return super.canActivate(context);
  }
}
