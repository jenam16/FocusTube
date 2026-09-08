export interface User {
  id: string;
  name: string;
  email: string;
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

export interface ApiError {
  message: string;
}
