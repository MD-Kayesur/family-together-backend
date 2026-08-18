import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(userId: string, refreshToken: string, userAgent?: string, ipAddress?: string) {
    const refreshTokenHash = this.tokenService.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        userAgent: userAgent || 'Unknown Device',
        ipAddress: ipAddress || 'Unknown IP',
        expiresAt,
      },
    });
  }

  async findActiveSessionByToken(refreshToken: string) {
    const refreshTokenHash = this.tokenService.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    if (session.revokedAt) {
      // Security Theft Detection: Old token reused! Revoke all sessions for safety.
      await this.revokeAllUserSessions(session.userId);
      throw new UnauthorizedException('Security alert: Reuse of revoked session token. All sessions revoked.');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    return session;
  }

  async rotateSession(sessionId: string, newRefreshToken: string) {
    const newRefreshTokenHash = this.tokenService.hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  async revokeSession(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getUserActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }
}
