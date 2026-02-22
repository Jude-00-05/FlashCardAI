import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
  const { isAuthenticated, isLoading } = useAuth();

  if (skipAuth) {
    return <Outlet />;
  }

  if (isLoading) {
    return <div className="saas-container py-12 text-sm text-slate-500">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
