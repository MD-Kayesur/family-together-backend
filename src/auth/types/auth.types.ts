import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  sessionId: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
