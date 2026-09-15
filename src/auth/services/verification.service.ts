import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Generates a 6-digit numeric verification code (100000 - 999999).
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Creates or rotates a 6-digit OTP code for the user, valid for 15 minutes.
   */
  async createEmailVerificationCode(userId: string): Promise<string> {
    // Clean up expired tokens for this user
    await this.prisma.emailVerificationToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });

    const code = this.generateVerificationCode();
    const tokenHash = this.tokenService.hashToken(`${userId}:${code}`);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Backward-compatible token generator.
   */
  async createEmailVerificationToken(userId: string): Promise<string> {
    return this.createEmailVerificationCode(userId);
  }

  /**
   * Verifies the 6-digit code for the specified email and activates the user account.
   */
  async verifyEmailCode(email: string, code: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('User with this email does not exist.');
    }

    if (user.emailVerified && user.status === 'ACTIVE') {
      return user.id;
    }

    const tokenHash = this.tokenService.hashToken(`${user.id}:${code.trim()}`);
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        verifiedAt: null,
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    return user.id;
  }

  async verifyEmailToken(rawToken: string): Promise<string> {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.verifiedAt) {
      throw new BadRequestException('Invalid or already used verification token');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Verification token expired');
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    return record.userId;
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const rawToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour token

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  async verifyPasswordResetToken(rawToken: string): Promise<string> {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt) {
      throw new BadRequestException('Invalid or already used reset token');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Password reset token expired');
    }

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return record.userId;
  }
}
