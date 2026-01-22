export type UserRole = 'employer' | 'employee' | 'admin';

export type OrgSector = 'public' | 'charity' | 'private';

export type OrgSize =
  | 'micro'      // 1-9 employees
  | 'small'      // 10-49 employees
  | 'medium'     // 50-249 employees
  | 'large';     // 250+ employees

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organisationId?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organisation {
  id: string;
  name: string;
  sector: OrgSector;
  size: OrgSize;
  employeeCount?: number;
  annualTurnover?: number;
  address?: string;
  postcode?: string;
  contactEmail: string;
  contactPhone?: string;
  registrationNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeyPass {
  id: string;
  code: string;
  organisationId: string;
  purchaseId: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organisationId?: string;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface KeyPassLogin {
  code: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}
