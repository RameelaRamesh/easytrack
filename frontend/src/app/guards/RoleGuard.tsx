import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: (UserRole | string)[];
  requireFinanceAccess?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, requireFinanceAccess = false }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h1 className="text-3xl font-bold text-red-600">403 Forbidden</h1>
        <p className="mt-2 text-gray-600 max-w-md">
          You do not have permission to access this page. Please contact your system administrator.
        </p>
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'ceo' || user.role === 'operations_head';
  const hasFinance = Boolean(user.is_owner || user.finance_access);

  let roleAllowed = allowedRoles.includes(user.role);
  if (!roleAllowed && isAdmin) {
    // Admin covers ceo and operations_head
    if (allowedRoles.includes('admin') || allowedRoles.includes('ceo') || allowedRoles.includes('operations_head')) {
      roleAllowed = true;
    }
  }

  if (!roleAllowed || (requireFinanceAccess && !hasFinance)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h1 className="text-3xl font-bold text-red-600">403 Forbidden</h1>
        <p className="mt-2 text-gray-600 max-w-md">
          {requireFinanceAccess && !hasFinance 
            ? "Finance Access permission is required to view this section. Please contact your administrator."
            : "You do not have permission to access this page. Please contact your system administrator."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
