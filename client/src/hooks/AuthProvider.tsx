import { ReactNode, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import {
  authService,
  LoginPayload,
  RegisterPayload,
} from '../services/authService';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authService
      .getMe()
      .then((res) => {
        if (isMounted) {
          setUser(res.user);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setUser(response.user);
  };

  const register = async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    setUser(response.user);
    try {
      await authService.syncUser();
    } catch {
      // Safe non-blocking sync
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
