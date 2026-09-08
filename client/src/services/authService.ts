import { request } from './api';
import { AuthResponse, User } from '../types';

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
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
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
