import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/workshop';
import { Layout } from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

/** Package tier hierarchy: pkg_basic < pkg_training < pkg_full */
const PACKAGE_HIERARCHY: Record<string, number> = {
  pkg_basic: 1,
  pkg_training: 2,
  pkg_full: 3,
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  requiredUserRole?: string | string[];
  /** Minimum package tier required (e.g. 'pkg_training' blocks pkg_basic users) */
  requiredPackage?: string;
}

export function ProtectedRoute({ children, requiredRole, requiredUserRole, requiredPackage }: ProtectedRouteProps) {
  const { user, isLoading, hasRole, activePackage } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredUserRole) {
    const allowed = Array.isArray(requiredUserRole) ? requiredUserRole : [requiredUserRole];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requiredPackage) {
    const userTier = PACKAGE_HIERARCHY[activePackage ?? ''] ?? 0;
    const requiredTier = PACKAGE_HIERARCHY[requiredPackage] ?? 0;
    if (userTier < requiredTier) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
