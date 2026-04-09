import { UserRole } from '../types';
import {
  VIEW_MATRIX,
  PATH_TO_VIEW,
  DEFAULT_ROUTES_BY_ROLE,
  type ViewKey,
} from '../config/businessRules';

// Re-exportar ViewKey para mantener API pública
export type { ViewKey } from '../config/businessRules';

/**
 * Verifica si un rol puede acceder a una vista determinada.
 * Fuente: config/businessRules.ts
 */
export const canAccessView = (role: UserRole, view: ViewKey): boolean => {
  return VIEW_MATRIX[view][role] ?? false;
};

// Re-exportar PATH_TO_VIEW para mantener compatibilidad
export { PATH_TO_VIEW } from '../config/businessRules';

/**
 * Obtiene la clave de vista para una ruta.
 * Para rutas como /pedidos/123, devuelve 'orders'.
 */
export const getViewFromPath = (pathname: string): ViewKey | null => {
  const normalized =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (PATH_TO_VIEW[normalized]) {
    return PATH_TO_VIEW[normalized];
  }
  if (normalized.startsWith('/pedidos')) {
    return 'orders';
  }
  return null;
};

/**
 * Ruta por defecto para cada rol cuando no tiene acceso a la ruta solicitada.
 * Fuente: config/businessRules.ts
 */
export const getDefaultRouteForRole = (role: UserRole): string => {
  return DEFAULT_ROUTES_BY_ROLE[role];
};
