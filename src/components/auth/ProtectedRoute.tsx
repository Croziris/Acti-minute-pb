import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

type AllowedRole = UserRole;

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}

const isRoleAllowed = (userRole: UserRole, allowedRoles: AllowedRole[]) => {
  if (userRole === 'sportif') {
    return allowedRoles.includes('sportif');
  }

  return allowedRoles.includes(userRole);
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isRoleAllowed(user.role, allowedRoles)) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
