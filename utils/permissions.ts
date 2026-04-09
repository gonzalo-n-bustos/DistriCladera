import { UserRole, OrderStatus } from '../types';
import {
  ORDER_STATUSES,
  STATUS_TRANSITIONS_BY_ROLE,
  PERMISSIONS_MATRIX,
} from '../config/businessRules';

/**
 * Matriz de permisos - Crear pedido: Vendedor ✅, Logística ❌, Facturación ✅, Admin ✅
 * Fuente: config/businessRules.ts
 */
export const canCreateOrder = (role: UserRole): boolean => {
  return PERMISSIONS_MATRIX.createOrder.includes(role);
};

/**
 * Matriz de permisos - Editar pedido (no facturado): Vendedor ✅, Logística ✅, Facturación ❌, Admin ✅
 * Fuente: config/businessRules.ts
 */
export const canEditOrder = (role: UserRole, status: OrderStatus): boolean => {
  if (role === 'Admin') return true;
  if (PERMISSIONS_MATRIX.editOrderBlockedRoles.includes(role)) return false;
  if (PERMISSIONS_MATRIX.editOrderAllowedRoles.includes(role)) {
    return !PERMISSIONS_MATRIX.editOrderBlockedStatuses.includes(status);
  }
  return false;
};

/**
 * Matriz de permisos - Eliminar pedido (no facturado): Vendedor ✅, Logística ❌, Facturación ❌, Admin ✅
 * Fuente: config/businessRules.ts
 */
export const canDeleteOrder = (role: UserRole, status: OrderStatus): boolean => {
  if (role === 'Admin') return true;
  if (PERMISSIONS_MATRIX.deleteOrderAllowedRoles.includes(role)) {
    return !PERMISSIONS_MATRIX.deleteOrderBlockedStatuses.includes(status);
  }
  return false;
};

/**
 * Matriz de permisos - Cambios de estado (ver STATUS_TRANSITIONS_BY_ROLE en businessRules)
 * Fuente: config/businessRules.ts
 */
export const canChangeStatus = (
  role: UserRole,
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean => {
  if (role === 'Admin') return true;
  const transitions = STATUS_TRANSITIONS_BY_ROLE[role];
  if (!transitions) return false;
  const allowed = transitions[currentStatus];
  return allowed !== undefined && allowed.includes(newStatus);
};

/**
 * Obtiene los estados disponibles a los que se puede cambiar desde el estado actual
 * según la matriz de permisos. Fuente: config/businessRules.ts
 */
export const getAvailableStatusTransitions = (
  role: UserRole,
  currentStatus: OrderStatus
): OrderStatus[] => {
  if (role === 'Admin') {
    return ORDER_STATUSES.filter((s) => s !== currentStatus);
  }
  const transitions = STATUS_TRANSITIONS_BY_ROLE[role];
  return transitions?.[currentStatus] ?? [];
};

/**
 * Verifica si un rol puede cambiar el estado de un pedido (cualquier cambio)
 */
export const canChangeOrderStatus = (role: UserRole, currentStatus: OrderStatus): boolean => {
  const transitions = getAvailableStatusTransitions(role, currentStatus);
  return transitions.length > 0;
};

/**
 * Verifica si un rol puede marcar/desmarcar el checkbox de logística (artículo listo)
 * Fuente: config/businessRules.ts
 */
export const canToggleLogisticsCheck = (role: UserRole): boolean => {
  return PERMISSIONS_MATRIX.toggleLogisticsCheck.includes(role);
};

/**
 * Verifica si un rol puede marcar/desmarcar el checkbox de facturación (artículo facturado)
 * Fuente: config/businessRules.ts
 */
export const canToggleFacturacionCheck = (role: UserRole): boolean => {
  return PERMISSIONS_MATRIX.toggleFacturacionCheck.includes(role);
};

/**
 * Verifica si un rol puede marcar/desmarcar el checkbox de admin (verificado)
 * Fuente: config/businessRules.ts
 */
export const canToggleAdminCheck = (role: UserRole): boolean => {
  return PERMISSIONS_MATRIX.toggleAdminCheck.includes(role);
};
