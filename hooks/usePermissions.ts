import { useAuth } from './useAuth';
import { OrderStatus } from '../types';
import {
  canCreateOrder,
  canEditOrder,
  canDeleteOrder,
  canChangeStatus,
  canChangeOrderStatus,
  getAvailableStatusTransitions,
  canToggleLogisticsCheck,
  canToggleFacturacionCheck,
  canToggleAdminCheck,
} from '../utils/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  if (!user) {
    return {
      canCreateOrder: () => false,
      canEditOrder: () => false,
      canDeleteOrder: () => false,
      canChangeStatus: () => false,
      canChangeOrderStatus: () => false,
      getAvailableStatusTransitions: () => [],
      canToggleLogisticsCheck: () => false,
      canToggleFacturacionCheck: () => false,
      canToggleAdminCheck: () => false,
    };
  }

  return {
    canCreateOrder: () => canCreateOrder(user.role),
    canEditOrder: (status: OrderStatus) => canEditOrder(user.role, status),
    canDeleteOrder: (status: OrderStatus) => canDeleteOrder(user.role, status),
    canChangeStatus: (currentStatus: OrderStatus, newStatus: OrderStatus) =>
      canChangeStatus(user.role, currentStatus, newStatus),
    canChangeOrderStatus: (status: OrderStatus) =>
      canChangeOrderStatus(user.role, status),
    getAvailableStatusTransitions: (status: OrderStatus) =>
      getAvailableStatusTransitions(user.role, status),
    canToggleLogisticsCheck: () => canToggleLogisticsCheck(user.role),
    canToggleFacturacionCheck: () => canToggleFacturacionCheck(user.role),
    canToggleAdminCheck: () => canToggleAdminCheck(user.role),
  };
};
