import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { authService, type User, type Organisation } from '@/services/auth.service';
import type { KeyPass, EmployeeCount, OrganisationSize } from '@/types/assessment';
import { apiService } from '@/services/api.service';
import { API_CONFIG } from '@/constants/api';

// Map backend user/org types to local types
interface UserData extends User {
  keyPassCode?: string;
}
interface OrganisationData extends Organisation {
  employeeBand?: EmployeeCount | null;
  size?: OrganisationSize;
  keyPassesAllocated?: number;
  keyPassesUsed?: number;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<UserData | null>(null);
  const [organisation, setOrganisation] = useState<OrganisationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keyPasses, setKeyPasses] = useState<KeyPass[]>([]);

  useEffect(() => {
    restoreSession();
  }, []);

  /**
   * Restore user session from cached tokens
   */
  const restoreSession = async () => {
    try {
      setIsLoading(true);
      const result = await authService.restoreSession();

      if (result.success && result.user && result.organisation) {
        setUser(result.user);
        setOrganisation(result.organisation as OrganisationData);
        console.log('Session restored:', result.user.email);
      } else {
        console.log('No valid session found');
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up a new employer
   */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      orgName: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('Signing up:', email);

        const result = await authService.signup({
          email,
          password,
          name: orgName, // Use org name as user name for employers
          organisationName: orgName,
        });

        if (result.success && result.data) {
          setUser(result.data.user);
          setOrganisation(result.data.organisation as OrganisationData);
          console.log('Signup successful');
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

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('Signing in:', email);

        const result = await authService.login({ email, password });

        if (result.success && result.data) {
          setUser(result.data.user);
          setOrganisation(result.data.organisation as OrganisationData);
          console.log('Login successful');
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

  /**
   * Sign in with key-pass (for employees)
   */
  const signInWithKeyPass = useCallback(
    async (email: string, keyPassCode: string): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('Signing in with key-pass:', keyPassCode);

        const result = await apiService.post<any>(
          API_CONFIG.ENDPOINTS.KEYPASSES.USE,
          { code: keyPassCode, email, name: email.split('@')[0] },
          { requiresAuth: false }
        );

        if (result.success && result.data?.accessToken && result.data?.refreshToken) {
          await apiService.setTokens(result.data.accessToken, result.data.refreshToken);
        }

        if (result.success && result.data?.user && result.data?.organisation) {
          setUser(result.data.user);
          setOrganisation(result.data.organisation as OrganisationData);
          return { success: true };
        }

        return {
          success: false,
          error: result.error?.message || 'Invalid key-pass code',
        };
      } catch (error) {
        console.error('Key-pass sign in error:', error);
        return { success: false, error: 'Failed to validate key-pass' };
      }
    },
    []
  );

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setOrganisation(null);
      setKeyPasses([]);
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  /**
   * Update organisation data
   */
  const updateOrganisation = useCallback(
    async (updates: Partial<OrganisationData>) => {
      if (!organisation) return;

      try {
        // Update local state immediately for better UX
        const updated: OrganisationData = { ...organisation, ...updates };
        setOrganisation(updated);
        console.log('Organisation updated locally');

        // TODO: Sync with backend
        // await apiService.patch(`/api/v1/organisations/${organisation.organisationId}`, updates);
      } catch (error) {
        console.error('Failed to update organisation:', error);
      }
    },
    [organisation]
  );

  /**
   * Allocate key-passes (after package purchase)
   */
  const allocateKeyPasses = useCallback(
    async (packageType: string, employeeCount: EmployeeCount | null): Promise<{ success: boolean; error?: string }> => {
      if (!organisation) return { success: false, error: 'No organisation found' };

      try {
        console.log('Allocating key-passes for package:', packageType);

        const allocation = employeeCount === '1-10' || employeeCount === '11-50' ? 100 : 250;

        const result = await apiService.post<any>(
          API_CONFIG.ENDPOINTS.KEYPASSES.ALLOCATE,
          { quantity: allocation, expiresInDays: 90 },
          { requiresAuth: true }
        );

        if (result.success && Array.isArray(result.data?.codes)) {
          setKeyPasses(result.data.codes.map((code: string) => ({ code, status: 'unused' } as any)));
        } else {
          return { success: false, error: result.error?.message || 'Failed to allocate access codes' };
        }

        await updateOrganisation({
          packageType: packageType as any,
          keyPassesAllocated: allocation,
          keyPassesUsed: 0,
        });

        console.log(`Allocated ${allocation} key-passes`);
        return { success: true };
      } catch (error) {
        console.error('Failed to allocate key-passes:', error);
        return { success: false, error: 'Failed to allocate access codes' };
      }
    },
    [organisation, updateOrganisation]
  );

  return {
    user,
    organisation,
    isLoading,
    isAuthenticated: !!user,
    keyPasses,
    signUp,
    signIn,
    signInWithKeyPass,
    signOut,
    updateOrganisation,
    allocateKeyPasses,
  };
});
