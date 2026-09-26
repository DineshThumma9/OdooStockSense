import type { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

interface AuthGuardProps {
  children?: ReactNode;
}

/**
 * Wraps protected routes — redirects to /login if no token is found.
 * Preserves the attempted path so we can redirect back after login.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const token = localStorage.getItem('stocksense_token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
