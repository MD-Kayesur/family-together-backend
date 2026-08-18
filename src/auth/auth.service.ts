import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { VerificationService } from './services/verification.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly verificationService: VerificationService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashedPassword = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        password: hashedPassword,
        avatarUrl: dto.avatarUrl,
        phoneNumber: dto.phoneNumber,
        status: 'PENDING',
      },
    });

    const verificationToken = await this.verificationService.createEmailVerificationToken(user.id);

    return {
      message: 'Registration successful. Please verify your email to activate your account.',
      userId: user.id,
      email: user.email,
      verificationToken, // Returned for dev/testing ease
    };
  }

  async signIn(dto: SignInDto, req: Request, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const refreshToken = this.tokenService.generateRefreshToken();
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';

    const session = await this.sessionService.createSession(
      user.id,
      refreshToken,
      userAgent,
      ipAddress,
    );

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      session.id,
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    const { password, ...userProfile } = user;
    return {
      message: 'Sign in successful',
      user: userProfile,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(rawRefreshToken: string | undefined, req: Request, res: Response) {
    const token = rawRefreshToken || req.cookies?.['refresh_token'];
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const session = await this.sessionService.findActiveSessionByToken(token);
    const newRefreshToken = this.tokenService.generateRefreshToken();

    await this.sessionService.rotateSession(session.id, newRefreshToken);

    const newAccessToken = this.tokenService.generateAccessToken(
      session.user.id,
      session.user.email,
      session.user.role,
      session.id,
    );

    this.setAuthCookies(res, newAccessToken, newRefreshToken);

    return {
      message: 'Token rotated successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(sessionId: string, res: Response) {
    await this.sessionService.revokeSession(sessionId);
    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, res: Response) {
    await this.sessionService.revokeAllUserSessions(userId);
    this.clearAuthCookies(res);
    return { message: 'Logged out from all active devices successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    await this.verificationService.verifyEmailToken(dto.token);
    return { message: 'Email verified successfully. Account activated!' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('User with this email does not exist.');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const verificationToken = await this.verificationService.createEmailVerificationToken(user.id);
    return {
      message: 'Verification link sent.',
      verificationToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If an account exists with this email, a reset token has been generated.' };
    }

    const resetToken = await this.verificationService.createPasswordResetToken(user.id);
    return {
      message: 'Password reset link sent.',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.verificationService.verifyPasswordResetToken(dto.token);
    const hashedPassword = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all existing sessions for security
    await this.sessionService.revokeAllUserSessions(userId);

    return { message: 'Password reset successful. All active sessions have been revoked.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await this.passwordService.comparePassword(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match');
    }

    const newHashedPassword = await this.passwordService.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
