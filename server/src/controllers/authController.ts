import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, sanitizeUser } from '../models/User.js';
import {
  generateToken,
  sendAuthCookie,
  clearAuthCookie,
  generateVerificationToken,
  hashVerificationToken,
} from '../utils/token.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/emailService.js';


export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ message: 'Please provide a valid email address' });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match' });
      return;
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      if (!existingUser.emailVerified) {
        res.status(409).json({
          code: 'EMAIL_NOT_VERIFIED',
          message:
            "An account with this email already exists but hasn't been verified yet.",
          email: trimmedEmail,
        });
        return;
      }
      res.status(400).json({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered. Please sign in.',
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { rawToken, tokenHash } = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      passwordHash,
      emailVerified: false,
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: verificationExpires,
      lastVerificationSentAt: new Date(),
    });

    // Send verification email through Resend
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
    });

    if (!emailResult.success) {
      res.status(201).json({
        code: 'EMAIL_SEND_FAILED',
        message:
          "Your account was created, but we couldn't send the verification email.",
        email: user.email,
        emailVerified: false,
        emailSent: false,
        error: emailResult.error,
      });
      return;
    }

    res.status(201).json({
      code: 'REGISTRATION_SUCCESS',
      message: 'Account created! Please check your email to verify your account.',
      email: user.email,
      emailVerified: false,
      emailSent: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Check if email is verified
    if (user.emailVerified === false) {
      res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
        email: user.email,
      });
      return;
    }

    const token = generateToken(user._id.toString());
    sendAuthCookie(res, token);

    res.status(200).json({
      user: sanitizeUser(user),
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = (req.body?.token || req.query?.token) as string | undefined;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      res.status(400).json({
        code: 'MISSING_TOKEN',
        message: 'Verification token is required.',
      });
      return;
    }

    const tokenHash = hashVerificationToken(rawToken.trim());
    const user = await User.findOne({ verificationTokenHash: tokenHash });

    if (!user) {
      res.status(400).json({
        code: 'INVALID_OR_USED',
        message: 'This verification link is invalid or has already been used.',
      });
      return;
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt.getTime() < Date.now()
    ) {
      res.status(400).json({
        code: 'EXPIRED',
        message:
          'This verification link has expired. Please request a new verification email.',
        email: user.email,
      });
      return;
    }

    // Mark email as verified and invalidate one-time token
    user.emailVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    // Automatically establish session via existing cookie mechanism
    const authToken = generateToken(user._id.toString());
    sendAuthCookie(res, authToken);

    res.status(200).json({
      code: 'SUCCESS',
      message: 'Email verified successfully!',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Internal server error during email verification.',
    });
  }
};

export const resendVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ message: 'Email address is required.' });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      // Generic response to reduce account enumeration
      res.status(200).json({
        message:
          'If an account exists with this email, a verification link has been sent.',
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        code: 'ALREADY_VERIFIED',
        message: 'Your email is already verified. Please sign in.',
      });
      return;
    }

    // Cooldown check (60 seconds)
    const COOLDOWN_MS = 60 * 1000;
    if (user.lastVerificationSentAt) {
      const timeSinceLast = Date.now() - user.lastVerificationSentAt.getTime();
      if (timeSinceLast < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLast) / 1000);
        res.status(429).json({
          code: 'COOLDOWN_ACTIVE',
          message: `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before requesting another verification email.`,
          retryAfter: remainingSeconds,
        });
        return;
      }
    }

    // Generate new token & invalidate previous token
    const { rawToken, tokenHash } = generateVerificationToken();
    user.verificationTokenHash = tokenHash;
    user.verificationTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    user.lastVerificationSentAt = new Date();
    await user.save();

    // Send email via Resend
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
    });

    if (!emailResult.success) {
      res.status(502).json({
        code: 'EMAIL_SEND_FAILED',
        message:
          emailResult.error ||
          'Failed to send verification email. Please try again.',
        error: emailResult.error,
      });
      return;
    }

    res.status(200).json({
      code: 'EMAIL_SENT',
      message: 'Verification email sent! Please check your inbox.',
      email: user.email,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Internal server error while resending verification email.',
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  res.status(200).json({
    user: sanitizeUser(req.user),
  });
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const GENERIC_MESSAGE =
      "If an account exists for this email, we've sent a password reset link.";

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ message: 'Please provide a valid email address.' });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ message: 'Please provide a valid email address.' });
      return;
    }

    const user = await User.findOne({ email: trimmedEmail });

    // Anti-enumeration: If user does not exist, return generic success
    if (!user) {
      res.status(200).json({ message: GENERIC_MESSAGE });
      return;
    }

    // Cooldown check (60 seconds)
    const COOLDOWN_MS = 60 * 1000;
    if (user.lastPasswordResetSentAt) {
      const elapsed = Date.now() - user.lastPasswordResetSentAt.getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        res.status(429).json({
          code: 'COOLDOWN_ACTIVE',
          message: `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before requesting another password reset email.`,
          retryAfter: remainingSeconds,
        });
        return;
      }
    }

    // Generate secure random reset token (hex) and SHA-256 hash
    const { rawToken, tokenHash } = generateVerificationToken();
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    user.lastPasswordResetSentAt = new Date();
    await user.save();

    // Send email via Resend
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
    });

    if (!emailResult.success) {
      // Clean up token state so user isn't locked in an invalid state
      user.passwordResetTokenHash = null;
      user.passwordResetTokenExpiresAt = null;
      await user.save();

      res.status(500).json({
        code: 'EMAIL_SEND_FAILED',
        message: 'Could not send password reset email. Please try again later.',
      });
      return;
    }

    res.status(200).json({
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Internal server error while processing password reset request.',
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      res.status(400).json({
        code: 'MISSING_TOKEN',
        message: 'Password reset token is required.',
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    const tokenHash = hashVerificationToken(token.trim());
    const user = await User.findOne({ passwordResetTokenHash: tokenHash });

    if (!user) {
      res.status(400).json({
        code: 'INVALID_OR_USED',
        message: 'This password reset link is invalid or has expired. Please request a new one.',
      });
      return;
    }

    if (
      user.passwordResetTokenExpiresAt &&
      user.passwordResetTokenExpiresAt.getTime() < Date.now()
    ) {
      // Invalidate expired token
      user.passwordResetTokenHash = null;
      user.passwordResetTokenExpiresAt = null;
      await user.save();

      res.status(400).json({
        code: 'EXPIRED',
        message: 'This password reset link is invalid or has expired. Please request a new one.',
      });
      return;
    }

    // Hash new password using existing bcrypt mechanism (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    user.passwordHash = passwordHash;
    // Invalidate reset token permanently
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    // Note: emailVerified status is preserved and not accidentally altered
    await user.save();

    res.status(200).json({
      code: 'SUCCESS',
      message: 'Your password has been reset successfully.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Internal server error while resetting password.',
    });
  }
};


