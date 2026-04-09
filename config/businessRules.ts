/**
 * Fuente única de verdad para reglas de negocio.
 * Referencia: docs/REGLAS-DE-NEGOCIO.md
 */

import { OrderStatus, UserRole } from '../types';
import type { Order, OrderItem } from '../types';

// --- Estados del pedido ---

export const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDIENTE_ARMADO,
  OrderStatus.PENDIENTE_FACTURACION,
  OrderStatus.FACTURADO,
  OrderStatus.ENTREGADO,
];

// --- Colores por estado (elimina duplicación en StatusBadge y ChangeStatusModal) ---

export interface StatusColorsBadge {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export interface StatusColorsModalOption {
  border: string;
  bg: string;
  dot: string;
}

export const STATUS_COLORS: Record<
  OrderStatus,
  {
    badge: StatusColorsBadge;
    getModalOption: (isSelected: boolean) => StatusColorsModalOption;
  }
> = {
  [OrderStatus.PENDIENTE_ARMADO]: {
    badge: {
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-100 dark:border-orange-800',
      dot: 'bg-orange-500',
    },
    getModalOption: (isSelected) => ({
      border: isSelected ? 'border-orange-500' : 'border-slate-200 dark:border-slate-700',
      bg: isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : '',
      dot: 'bg-orange-500',
    }),
  },
  [OrderStatus.PENDIENTE_FACTURACION]: {
    badge: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-100 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    getModalOption: (isSelected) => ({
      border: isSelected ? 'border-blue-500' : 'border-slate-200 dark:border-slate-700',
      bg: isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : '',
      dot: 'bg-blue-500',
    }),
  },
  [OrderStatus.FACTURADO]: {
    badge: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-100 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    getModalOption: (isSelected) => ({
      border: isSelected ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-700',
      bg: isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : '',
      dot: 'bg-emerald-500',
    }),
  },
  [OrderStatus.ENTREGADO]: {
    badge: {
      bg: 'bg-teal-50 dark:bg-teal-900/30',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-100 dark:border-teal-800',
      dot: 'bg-teal-500',
    },
    getModalOption: (isSelected) => ({
      border: isSelected ? 'border-teal-500' : 'border-slate-200 dark:border-slate-700',
      bg: isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : '',
      dot: 'bg-teal-500',
    }),
  },
};

// Estado por defecto para colores desconocidos
const DEFAULT_STATUS_COLORS = {
  badge: {
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-100 dark:border-slate-800',
    dot: 'bg-slate-500',
  },
  getModalOption: (isSelected: boolean) => ({
    border: isSelected ? 'border-slate-500' : 'border-slate-200 dark:border-slate-700',
    bg: isSelected ? 'bg-slate-50 dark:bg-slate-900/20' : '',
    dot: 'bg-slate-500',
  }),
};

export const getStatusColorsForBadge = (status: OrderStatus): StatusColorsBadge =>
  STATUS_COLORS[status]?.badge ?? DEFAULT_STATUS_COLORS.badge;

export const getStatusColorsForModalOption = (
  status: OrderStatus,
  isSelected: boolean
): StatusColorsModalOption =>
  STATUS_COLORS[status]?.getModalOption(isSelected) ??
  DEFAULT_STATUS_COLORS.getModalOption(isSelected);

// --- Transiciones de estado por rol ---

export const STATUS_TRANSITIONS_BY_ROLE: Record<
  UserRole,
  Partial<Record<OrderStatus, OrderStatus[]>>
> = {
  Admin: undefined, // Admin puede ir a cualquier estado
  Vendedor: {}, // No puede cambiar estado
  Logística: {
    [OrderStatus.PENDIENTE_ARMADO]: [OrderStatus.PENDIENTE_FACTURACION],
    [OrderStatus.PENDIENTE_FACTURACION]: [OrderStatus.PENDIENTE_ARMADO],
    [OrderStatus.FACTURADO]: [OrderStatus.ENTREGADO],
    [OrderStatus.ENTREGADO]: [OrderStatus.FACTURADO],
  },
  Facturación: {
    [OrderStatus.PENDIENTE_ARMADO]: [],
    [OrderStatus.PENDIENTE_FACTURACION]: [OrderStatus.FACTURADO],
    [OrderStatus.FACTURADO]: [OrderStatus.PENDIENTE_FACTURACION],
    [OrderStatus.ENTREGADO]: [],
  },
};

// --- Matriz de permisos por acción ---

export const PERMISSIONS_MATRIX = {
  createOrder: ['Admin', 'Vendedor', 'Facturación'] as UserRole[],
  editOrderBlockedStatuses: [OrderStatus.FACTURADO, OrderStatus.ENTREGADO] as OrderStatus[],
  editOrderBlockedRoles: ['Facturación'] as UserRole[],
  editOrderAllowedRoles: ['Admin', 'Vendedor', 'Logística'] as UserRole[],
  deleteOrderBlockedStatuses: [OrderStatus.FACTURADO, OrderStatus.ENTREGADO] as OrderStatus[],
  deleteOrderAllowedRoles: ['Admin', 'Vendedor'] as UserRole[],
  toggleLogisticsCheck: ['Logística', 'Admin'] as UserRole[],
  toggleFacturacionCheck: ['Facturación', 'Admin'] as UserRole[],
  toggleAdminCheck: ['Admin'] as UserRole[],
};

// --- Vistas por rol ---

export type ViewKey =
  | 'dashboard'
  | 'products'
  | 'clients'
  | 'orders'
  | 'users'
  | 'audit';

export const VIEW_MATRIX: Record<ViewKey, Record<UserRole, boolean>> = {
  dashboard: {
    Admin: true,
    Vendedor: true,
    'Logística': false,
    'Facturación': true,
  },
  products: {
    Admin: true,
    Vendedor: true,
    'Logística': false,
    'Facturación': true,
  },
  clients: {
    Admin: true,
    Vendedor: true,
    'Logística': false,
    'Facturación': true,
  },
  orders: {
    Admin: true,
    Vendedor: true,
    'Logística': true,
    'Facturación': true,
  },
  users: {
    Admin: true,
    Vendedor: false,
    'Logística': false,
    'Facturación': false,
  },
  audit: {
    Admin: true,
    Vendedor: false,
    'Logística': false,
    'Facturación': false,
  },
};

export const PATH_TO_VIEW: Record<string, ViewKey> = {
  '/': 'dashboard',
  '/productos': 'products',
  '/clientes': 'clients',
  '/pedidos': 'orders',
  '/usuarios': 'users',
  '/auditoria': 'audit',
};

export const DEFAULT_ROUTES_BY_ROLE: Record<UserRole, string> = {
  Admin: '/',
  Vendedor: '/',
  'Logística': '/pedidos',
  'Facturación': '/',
};

// --- Reglas de validación ---

/**
 * Estado que requiere que todos los productos KG tengan peso real.
 * No se puede pasar a este estado si hay productos KG sin pesar.
 */
export const STATUS_REQUIRING_KG_WEIGHTS = OrderStatus.PENDIENTE_FACTURACION;

/**
 * Indica si un pedido tiene productos por KG sin peso real ingresado.
 * Regla: No se puede pasar a Pendiente de Facturación con productos KG sin pesar.
 */
export function hasUnweighedKGProducts(order: Order): boolean {
  return order.orderItems.some(
    (item) =>
      item.unit === 'KG' &&
      (item.actualWeight === undefined || item.actualWeight === 0)
  );
}

/**
 * Indica si se requiere ingreso de pesos antes de una transición.
 * Transición a Pendiente de Facturación exige todos los KG con peso.
 */
export function requiresWeightInputBeforeTransition(
  newStatus: OrderStatus,
  order: Order
): boolean {
  return (
    newStatus === STATUS_REQUIRING_KG_WEIGHTS && hasUnweighedKGProducts(order)
  );
}

// --- Cálculo de totales (reglas de negocio) ---

/**
 * Total estimado: solo productos por Unidad. Productos KG sin peso = $0.
 */
export function calculateEstimatedTotal(orderItems: OrderItem[]): number {
  return orderItems.reduce((total, item) => {
    if (item.unit === 'KG') return total;
    return total + item.price * item.estimatedQuantity;
  }, 0);
}

/**
 * Total real: Unidad (estimatedQuantity) + KG (actualWeight).
 * Productos KG sin peso = $0.
 */
export function calculateActualTotalFromRules(orderItems: OrderItem[]): number {
  return orderItems.reduce((total, item) => {
    if (item.unit === 'KG') {
      if (
        item.actualWeight !== undefined &&
        item.actualWeight !== null &&
        item.actualWeight > 0
      ) {
        return total + item.price * item.actualWeight;
      }
      return total;
    }
    return total + item.price * item.estimatedQuantity;
  }, 0);
}
