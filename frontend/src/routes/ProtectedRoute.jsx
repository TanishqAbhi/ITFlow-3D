import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    if (allowedRoles.includes('ADMIN')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    } else if (allowedRoles.includes('STAFF')) {
      return <Navigate to="/staff/login" state={{ from: location }} replace />;
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized, redirect to appropriate home
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'STAFF') {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
