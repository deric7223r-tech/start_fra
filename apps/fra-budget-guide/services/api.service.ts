/**
 * API Service for Budget Guide
 * Handles HTTP requests to the backend API with token management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/constants/api';
import { createLogger } from '@/utils/logger';
const logger = createLogger('ApiService');

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
  timeout?: number;
  retried?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokensLoadedPromise: Promise<void>;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.tokensLoadedPromise = this.loadTokens();
  }

  private async ensureTokensLoaded(): Promise<void> {
    await this.tokensLoadedPromise;
  }

  private async loadTokens(): Promise<void> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken'),
      ]);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      logger.error('Failed to load tokens', error);
    }
  }

  private async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    await Promise.all([
      AsyncStorage.setItem('accessToken', accessToken),
      AsyncStorage.setItem('refreshToken', refreshToken),
    ]);
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    await Promise.all([
      AsyncStorage.removeItem('accessToken'),
      AsyncStorage.removeItem('refreshToken'),
      AsyncStorage.removeItem('user'),
    ]);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    await this.ensureTokensLoaded();
    const {
      requiresAuth = false,
      timeout = API_CONFIG.TIMEOUT,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    if (requiresAuth && this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data: ApiResponse<T> = await response.json();

      // Handle 401 — try refresh (once only)
      if (response.status === 401 && requiresAuth && this.refreshToken && !options?.retried) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.makeRequest<T>(endpoint, { ...options, retried: true });
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}`,
          },
        };
      }

      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: { code: 'TIMEOUT', message: 'Request timed out' } };
      }

      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: (error instanceof Error ? error.message : 'Network request failed') },
      };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.accessToken && data.data.refreshToken) {
          await this.saveTokens(data.data.accessToken, data.data.refreshToken);
          return true;
        }
      }

      await this.clearTokens();
      return false;
    } catch {
      await this.clearTokens();
      return false;
    }
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, data?: Record<string, unknown>, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async patch<T>(endpoint: string, data?: Record<string, unknown>, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.saveTokens(accessToken, refreshToken);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const apiService = new ApiService();
export default apiService;
