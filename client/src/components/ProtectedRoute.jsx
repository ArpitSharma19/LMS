import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { token, adminToken, user, loading, isStudent, isEducator, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admin routes check
  if (role === 'admin') {
    if (!adminToken || !isAdmin) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // Auth check for non-admin routes
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Specific role checks
  if (role === 'student' && !isStudent) {
    return <Navigate to="/" replace />;
  }

  if (role === 'educator' && !isEducator) {
    return <Navigate to="/" replace />;
  }

  // Default protected (logged in) but no specific role constraint
  if (!role && !user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
