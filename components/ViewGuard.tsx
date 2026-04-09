import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getViewFromPath, canAccessView, getDefaultRouteForRole } from '../utils/views';

interface ViewGuardProps {
  children: React.ReactNode;
}

/**
 * Redirige al usuario a la ruta por defecto de su rol si intenta
 * acceder a una vista para la que no tiene permiso.
 */
const ViewGuard: React.FC<ViewGuardProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const view = getViewFromPath(location.pathname);
  if (!view) return <>{children}</>;

  if (!canAccessView(user.role, view)) {
    const defaultRoute = getDefaultRouteForRole(user.role);
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};

export default ViewGuard;
