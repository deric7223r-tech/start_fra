import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (__DEV__) {
    if (envUrl) return envUrl;
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
  }

  return envUrl || 'https://api.fraud-risk.co.uk';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout',
      ME: '/api/v1/auth/me',
      REFRESH: '/api/v1/auth/refresh',
    },
    KEYPASSES: {
      USE: '/api/v1/keypasses/use',
    },
    WORKSHOP: {
      PROGRESS: '/api/v1/workshop/progress',
      SESSIONS: '/api/v1/workshop/sessions',
      CERTIFICATES: '/api/v1/workshop/certificates',
      ACTION_PLANS: '/api/v1/workshop/action-plans',
    },
  },
  TIMEOUT: 30000,
};

export default API_CONFIG;
