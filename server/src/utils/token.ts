import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response, CookieOptions } from 'express';
import { config } from '../config/index.js';

export const AUTH_COOKIE_NAME = 'focustube_auth';

export const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwtSecret) as { userId: string };
};

export const sendAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: 0,
  });
};

/**
 * Generates a cryptographically random verification token (hex)
 * and its corresponding SHA-256 hash for secure storage.
 */
export const generateVerificationToken = (): {
  rawToken: string;
  tokenHash: string;
} => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashVerificationToken(rawToken);
  return { rawToken, tokenHash };
};

/**
 * Computes a SHA-256 hash of a raw verification token.
 */
export const hashVerificationToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

