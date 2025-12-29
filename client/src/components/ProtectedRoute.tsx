import { Redirect, useLocation } from "wouter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'facilitator' | 'contributor' | 'viewer';
}

/**
 * Protects routes that require authentication
 * Redirects to login if not authenticated
 * Optionally checks for required role
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useSupabaseAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(location);
    return <Redirect to={`/login?redirect=${returnUrl}`} />;
  }

  // TODO: Add role checking when useUserRole is integrated
  // if (requiredRole) {
  //   const { data: userRole } = useUserRole();
  //   if (userRole?.key !== requiredRole && userRole?.key !== 'admin') {
  //     return <Redirect to="/unauthorized" />;
  //   }
  // }

  return <>{children}</>;
}

/**
 * Redirects authenticated users away from public-only routes (like login)
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

