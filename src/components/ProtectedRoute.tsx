import { useNavigate } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  /**
   * The protected content to render when authenticated.
   */
  children: ReactNode;
  /**
   * Optional redirect path when not authenticated.
   * Defaults to '/login'.
   */
  redirectTo?: string;
  /**
   * Optional required permissions.
   * If provided, user must have ALL listed permissions.
   */
  requiredPermissions?: string[];
}

/**
 * ProtectedRoute
 *
 * Wrapper component that guards routes requiring authentication.
 * - Shows loading spinner while checking auth state
 * - Redirects to login if not authenticated
 * - Optionally checks for required permissions
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requiredPermissions,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: redirectTo });
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect in useEffect
  if (!isAuthenticated) {
    return null;
  }

  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Access Denied
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to view this page.
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
