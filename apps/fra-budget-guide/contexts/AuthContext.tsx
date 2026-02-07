import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';
import { API_CONFIG } from '@/constants/api';

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  organisationId: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      setIsLoading(true);
      if (!apiService.isAuthenticated()) {
        return;
      }

      const result = await apiService.get<any>(API_CONFIG.ENDPOINTS.AUTH.ME, {
        requiresAuth: true,
      });

      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await apiService.post<any>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
          email,
          password,
        });

        if (result.success && result.data?.accessToken && result.data?.refreshToken) {
          await apiService.setTokens(result.data.accessToken, result.data.refreshToken);
          setUser(result.data.user);
          return { success: true };
        }

        return {
          success: false,
          error: result.error?.message || 'Invalid email or password',
        };
      } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: 'Failed to sign in' };
      }
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      organisationName: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await apiService.post<any>(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
          email,
          password,
          name,
          organisationName,
        });

        if (result.success && result.data?.accessToken && result.data?.refreshToken) {
          await apiService.setTokens(result.data.accessToken, result.data.refreshToken);
          setUser(result.data.user);
          return { success: true };
        }

        return {
          success: false,
          error: result.error?.message || 'Failed to create account',
        };
      } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Failed to create account' };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, undefined, {
        requiresAuth: true,
      });
    } catch {
      // Ignore logout API errors
    }
    await apiService.clearTokens();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
});
