import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a 32-character Base32 RFC 4648 compatible secret key
   */
  generateBase32Secret(length = 20): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const buffer = crypto.randomBytes(length);
    let secret = '';
    for (let i = 0; i < buffer.length; i++) {
      secret += charset[buffer[i] % charset.length];
    }
    return secret;
  }

  /**
   * Decodes Base32 string to Buffer
   */
  private base32ToBuffer(base32: string): Buffer {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = base32.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (let i = 0; i < cleaned.length; i++) {
      const val = charset.indexOf(cleaned[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }

  /**
   * Generates a 6-digit TOTP code for a given timestamp
   */
  generateTotpCode(secret: string, timeStep = 30, forTime = Date.now()): string {
    const counter = Math.floor(forTime / 1000 / timeStep);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const secretBuffer = this.base32ToBuffer(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0x0f;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  }

  /**
   * Verifies a 6-digit TOTP code with +/- 1 time step drift (tolerance of +/- 30s)
   */
  verifyTotpCode(secret: string, code: string, window = 1): boolean {
    if (!secret || !code || code.length !== 6) return false;
    const now = Date.now();
    for (let i = -window; i <= window; i++) {
      const testTime = now + i * 30 * 1000;
      if (this.generateTotpCode(secret, 30, testTime) === code) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates a TOTP setup payload with secret, otpauth URL, and clean SVG QR Code data URI
   */
  async generate2FASetup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, isTwoFactorEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const secret = this.generateBase32Secret(20);
    const issuer = 'FamilyRoots';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;

    // Save temporary secret to user record
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      success: true,
      secret,
      otpauthUrl,
      email: user.email,
      isAlreadyEnabled: user.isTwoFactorEnabled,
    };
  }

  /**
   * Verifies the 6-digit code and permanently activates 2FA on the user account
   */
  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, isTwoFactorEnabled: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('No 2FA secret found. Please generate a QR code first.');
    }

    const isValid = this.verifyTotpCode(user.twoFactorSecret, code.trim());
    if (!isValid) {
      throw new BadRequestException('Invalid 6-digit authentication code. Please check your authenticator app.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return {
      success: true,
      message: 'Two-factor authentication successfully enabled on your FamilyRoots account.',
      isTwoFactorEnabled: true,
    };
  }

  /**
   * Disables 2FA after checking password
   */
  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, isTwoFactorEnabled: true },
    });

    if (!user || !user.isTwoFactorEnabled) {
      return { success: true, message: '2FA is already disabled.', isTwoFactorEnabled: false };
    }

    if (user.twoFactorSecret) {
      const isValid = this.verifyTotpCode(user.twoFactorSecret, code.trim());
      if (!isValid) {
        throw new BadRequestException('Invalid authentication code.');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return {
      success: true,
      message: 'Two-factor authentication has been disabled.',
      isTwoFactorEnabled: false,
    };
  }
}
