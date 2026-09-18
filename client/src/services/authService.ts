import { request } from './api';
import {
  AuthResponse,
  RegisterResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  User,
} from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SyncPayload {
  name?: string;
  avatar?: string | null;
  dailyGoalMinutes?: number;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return request<VerifyEmailResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    return request<ResendVerificationResponse>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(payload: { token: string; password: string }): Promise<{ message: string; code?: string }> {
    return request<{ message: string; code?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me', {
      method: 'GET',
    });
  },

  async syncUser(payload?: SyncPayload): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>('/users/sync', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
};

