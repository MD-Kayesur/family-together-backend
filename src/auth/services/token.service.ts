import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(userId: string, email: string, role: string, sessionId: string): string {
    const payload: JwtPayload = { sub: userId, email, role, sessionId };
    return this.jwtService.sign(payload as object, {
      secret: process.env.JWT_SECRET || 'family-roots-jwt-secret-key-2026',
      expiresIn: (process.env.JWT_EXPIRATION as any) || '15m',
    });
  }


  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: process.env.JWT_SECRET || 'family-roots-jwt-secret-key-2026',
    });
  }
}
