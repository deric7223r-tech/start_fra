/**
 * API Configuration
 * Central configuration for backend API endpoints
 */

import { Platform } from 'react-native';

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // For Expo development
  if (__DEV__) {
    if (envUrl) {
      return envUrl;
    }

    // For iOS simulator and Android emulator
    // Use localhost for web, 10.0.2.2 for Android emulator, or your machine's IP
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }

    return 'http://localhost:3000';
  }

  // Production API URL
  return envUrl || 'https://api.fraud-risk.co.uk';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    // Authentication
    AUTH: {
      SIGNUP: '/api/v1/auth/signup',
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout',
      REFRESH: '/api/v1/auth/refresh',
      ME: '/api/v1/auth/me',
    },
    // Assessments
    ASSESSMENTS: {
      CREATE: '/api/v1/assessments',
      GET: (id: string) => `/api/v1/assessments/${id}`,
      UPDATE: (id: string) => `/api/v1/assessments/${id}`,
      SUBMIT: (id: string) => `/api/v1/assessments/${id}/submit`,
      RISK_REGISTER: (id: string) => `/api/v1/assessments/${id}/risk-register`,
      BY_ORG: (orgId: string) => `/api/v1/assessments/organisation/${orgId}`,
    },
    // Key-passes
    KEYPASSES: {
      USE: '/api/v1/keypasses/use',
      ALLOCATE: '/api/v1/keypasses/allocate',
      BY_ORG: (orgId: string) => `/api/v1/keypasses/organisation/${orgId}`,
      STATS: (orgId: string) => `/api/v1/keypasses/organisation/${orgId}/stats`,
      REVOKE: '/api/v1/keypasses/revoke',
    },
    // Packages & Payments
    PACKAGES: {
      LIST: '/api/v1/packages',
      RECOMMENDED: '/api/v1/packages/recommended',
    },
    PURCHASES: {
      CREATE: '/api/v1/purchases',
      CONFIRM: (id: string) => `/api/v1/purchases/${id}/confirm`,
      GET: (id: string) => `/api/v1/purchases/${id}`,
      BY_ORG: (orgId: string) => `/api/v1/purchases/organisation/${orgId}`,
    },
    // Health check
    HEALTH: '/health',
  },
  TIMEOUT: 30000, // 30 seconds
};

export default API_CONFIG;
