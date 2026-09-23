import { Controller, Post, Get, Patch, Body, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

import { SessionService } from './services/session.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Register a new user account [Role: PUBLIC]',
    description: `**Route:** \`POST /auth/signup\`
**Purpose:** Registers a new user account with full name, email, password, and optional role.
**Required Permissions / Roles:** \`PUBLIC\` (Open registration - no authentication required).`,
  })
  @ApiResponse({ status: 201, description: 'User account created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  @ApiOperation({
    summary: 'Sign in with email and password [Role: PUBLIC]',
    description: `**Route:** \`POST /auth/signin\`
**Purpose:** Authenticates user credentials, generates JWT access and refresh tokens, and attaches secure HttpOnly cookies.
**Required Permissions / Roles:** \`PUBLIC\` (No authentication required).`,
  })
  @ApiResponse({ status: 200, description: 'User signed in successfully; sets HttpOnly cookies' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account suspended' })
  signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(dto, req, res);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate refresh token and issue new access token [Role: PUBLIC]',
    description: `**Route:** \`POST /auth/refresh\`
**Purpose:** Validates the cryptographically hashed refresh token session and issues a new access token.
**Required Permissions / Roles:** \`PUBLIC\` (Valid refresh token required).`,
  })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh session' })
  refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshToken(dto.refreshToken, req, res);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @Post('logout')
  @ApiOperation({
    summary: 'Log out current session [Roles: MEMBER, OWNER, ADMIN, SUPER_ADMIN, VIEWER, USER]',
    description: `**Route:** \`POST /auth/logout\`
**Purpose:** Revokes the active session identifier from PostgreSQL and clears authentication cookies.
**Required Permissions / Roles:** \`MEMBER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`VIEWER\`, \`USER\` (All authenticated users).`,
  })
  @ApiResponse({ status: 200, description: 'Current session revoked' })
  logout(
    @CurrentUser('sessionId') sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(sessionId, res);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @Post('logout-all')
  @ApiOperation({
    summary: 'Log out from all active devices [Roles: MEMBER, OWNER, ADMIN, SUPER_ADMIN, VIEWER, USER]',
    description: `**Route:** \`POST /auth/logout-all\`
**Purpose:** Terminates all active sessions for the authenticated user across all browsers, mobile devices, and sessions.
**Required Permissions / Roles:** \`MEMBER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`VIEWER\`, \`USER\` (All authenticated users).`,
  })
  @ApiResponse({ status: 200, description: 'All active sessions revoked' })
  logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logoutAll(userId, res);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated user profile [Roles: MEMBER, OWNER, ADMIN, SUPER_ADMIN, VIEWER, USER]',
    description: `**Route:** \`GET /auth/me\`
**Purpose:** Retrieves the current authenticated user identity, assigned role, email, full name, and sanctuary ownership status.
**Required Permissions / Roles:** \`MEMBER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`VIEWER\`, \`USER\` (All authenticated users).`,
  })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @Get('sessions')
  @ApiOperation({
    summary: 'Get list of active sessions for current user [Roles: MEMBER, OWNER, ADMIN, SUPER_ADMIN, VIEWER, USER]',
    description: `**Route:** \`GET /auth/sessions\`
**Purpose:** Returns all active device sessions, IP addresses, user agents, and creation timestamps for security auditing.
**Required Permissions / Roles:** \`MEMBER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`VIEWER\`, \`USER\` (All authenticated users).`,
  })
  @ApiResponse({ status: 200, description: 'Active user sessions' })
  getSessions(@CurrentUser('id') userId: string) {
    return this.sessionService.getUserActiveSessions(userId);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email token to activate account [Role: PUBLIC]',
    description: `**Route:** \`POST /auth/verify-email\`
**Purpose:** Verifies email token to mark the user status as ACTIVE in the PostgreSQL database.
**Required Permissions / Roles:** \`PUBLIC\` (No authentication required).`,
  })
  @ApiResponse({ status: 200, description: 'Account activated' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @ApiOperation({
    summary: 'Resend email activation link [Role: PUBLIC]',
    description: `**Route:** \`POST /auth/resend-verification\`
**Purpose:** Dispatches a fresh email verification token to a pending unverified account.
**Required Permissions / Roles:** \`PUBLIC\` (No authentication required).`,
  })
  @ApiResponse({ status: 200, description: 'Activation email resent' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset token link [Role: PUBLIC]',
    description: `**Route:** \`POST /auth/forgot-password\`
**Purpose:** Dispatches an email with a secure reset token link if the account exists.
**Required Permissions / Roles:** \`PUBLIC\` (No authentication required).`,
  })
  @ApiResponse({ status: 200, description: 'Reset token generated if account exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password using token [Role: PUBLIC]',
    description: `**Route:** \`POST /auth/reset-password\`
**Purpose:** Sets a new hashed password and terminates all prior active sessions.
**Required Permissions / Roles:** \`PUBLIC\` (Valid reset token required).`,
  })
  @ApiResponse({ status: 200, description: 'Password reset and all sessions revoked' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @Post('change-password')
  @ApiOperation({
    summary: 'Change current user password [Roles: MEMBER, OWNER, ADMIN, SUPER_ADMIN, VIEWER, USER]',
    description: `**Route:** \`POST /auth/change-password\`
**Purpose:** Verifies old password and updates credentials for the authenticated user.
**Required Permissions / Roles:** \`MEMBER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`VIEWER\`, \`USER\` (All authenticated users).`,
  })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('access_token')
  @Patch('profile')
  @ApiOperation({
    summary: 'Update current user profile and credentials [Roles: MEMBER, OWNER, ADMIN, SUPER_ADMIN, VIEWER, USER]',
    description: `**Route:** \`PATCH /auth/profile\`
**Purpose:** Updates user profile attributes such as full name, contact phone, bio, and avatar.
**Required Permissions / Roles:** \`MEMBER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`VIEWER\`, \`USER\` (All authenticated users).`,
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      bio?: string;
      avatarUrl?: string;
    },
  ) {
    return this.authService.updateProfile(userId, dto);
  }
}
