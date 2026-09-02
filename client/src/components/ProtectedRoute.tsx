import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-950 text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-white">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
