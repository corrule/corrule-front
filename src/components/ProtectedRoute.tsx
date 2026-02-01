import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, canAccessPanel } from '@/lib/permissions';
import type { UserRole, Permission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission;
  requiredPanel?: 'admin' | 'moderator' | 'contributor';
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  requiredPanel,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role as UserRole) || 'USER';

  // Check required role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole)) {
      return fallback || <Navigate to="/" replace />;
    }
  }

  // Check required permission
  if (requiredPermission) {
    if (!hasPermission(userRole, requiredPermission)) {
      return fallback || <Navigate to="/" replace />;
    }
  }

  // Check required panel access
  if (requiredPanel) {
    if (!canAccessPanel(userRole, requiredPanel)) {
      return fallback || <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
