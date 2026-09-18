import { createContext } from 'react';
import { User, RegisterResponse } from '../types';
import { LoginPayload, RegisterPayload } from '../services/authService';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthenticatedUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

