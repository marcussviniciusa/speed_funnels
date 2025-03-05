import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../services/authService';

const ProtectedRoute = ({ allowedRoles }) => {
  const authenticated = isAuthenticated();
  const currentUser = getCurrentUser();
  
  // Verificar se o usuário está autenticado
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar se o usuário tem o papel necessário
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute; 