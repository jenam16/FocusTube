export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  avatar: string | null;
  dailyGoalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface RegisterResponse {
  message: string;
  code?: string;
  email?: string;
  emailVerified?: boolean;
  emailSent?: boolean;
  user?: User;
}

export interface VerifyEmailResponse {
  code?: string;
  message: string;
  user: User;
}

export interface ResendVerificationResponse {
  message: string;
  email?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  email?: string;
  retryAfter?: number;
}

