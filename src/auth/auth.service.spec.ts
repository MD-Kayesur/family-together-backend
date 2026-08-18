import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { VerificationService } from './services/verification.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let passwordService: PasswordService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PasswordService,
        TokenService,
        SessionService,
        VerificationService,
        JwtService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            session: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            emailVerificationToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            passwordResetToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    passwordService = module.get<PasswordService>(PasswordService);
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash and compare passwords correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await passwordService.hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(password);

    const isMatch = await passwordService.comparePassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await passwordService.comparePassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should generate random refresh token and hash it', () => {
    const token = tokenService.generateRefreshToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(10);

    const hash = tokenService.hashToken(token);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(token);
  });
});
