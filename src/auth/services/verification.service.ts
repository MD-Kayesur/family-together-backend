import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async createEmailVerificationToken(userId: string): Promise<string> {
    const rawToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour token

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
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
