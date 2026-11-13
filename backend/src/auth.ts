import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { HttpError } from './errors.js';

export interface AuthUser {
  id: number;
  role: 'member' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 32);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) throw new HttpError(401, '請先登入');

  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    req.user = { id: Number(payload.sub), role: payload.role };
  } catch {
    throw new HttpError(401, '登入已過期，請重新登入');
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') throw new HttpError(403, '需要管理員權限');
  next();
}

export function currentUser(req: Request): AuthUser {
  if (!req.user) throw new HttpError(401, '請先登入');
  return req.user;
}
