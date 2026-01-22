export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Package types
export interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  keyPassCount: number;
  features: string[];
  isActive: boolean;
}

// Purchase types
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface Purchase {
  id: string;
  organisationId: string;
  packageId: number;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  stripePaymentId?: string;
  keyPassCount: number;
  createdAt: string;
  completedAt?: string;
}

// Dashboard types
export interface DashboardMetrics {
  organisationId: string;
  totalAssessments: number;
  completedAssessments: number;
  averageRiskScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  keyPassesUsed: number;
  keyPassesRemaining: number;
}

// Feedback types
export interface Feedback {
  id: string;
  userId: string;
  assessmentId?: string;
  rating: number;
  comment?: string;
  category: 'general' | 'usability' | 'content' | 'technical';
  createdAt: string;
}

// Signature types
export interface Signature {
  id: string;
  assessmentId: string;
  userId: string;
  signatureUrl: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
}
