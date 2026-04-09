import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, OrderStatus, OrderItem } from '../types';
import { INITIAL_ORDERS } from '../constants';
import { canChangeStatus } from '../utils/permissions';
import {
  hasUnweighedKGProducts as hasUnweighedKGProductsRule,
  calculateEstimatedTotal as calculateEstimatedTotalRule,
  calculateActualTotalFromRules,
} from '../config/businessRules';

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id'>, userId: string, userName: string, userRole: string) => void;
  updateOrder: (id: string, order: Partial<Order>, userId: string, userName: string, userRole: string) => void;
  deleteOrder: (id: string, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  changeOrderStatus: (id: string, newStatus: OrderStatus, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => boolean;
  updateOrderWeights: (id: string, weights: { [productId: string]: number }, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => boolean;
  calculateActualTotal: (orderItems: OrderItem[]) => number;
  hasUnweighedKGProducts: (order: Order) => boolean;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const generateOrderId = (): string => {
    const lastOrder = orders[orders.length - 1];
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.id.replace('#ORD-', ''));
      return `#ORD-${String(lastNumber + 1).padStart(3, '0')}`;
    }
    return '#ORD-001';
  };

  const calculateEstimatedTotal = (orderItems: OrderItem[]): number =>
    calculateEstimatedTotalRule(orderItems);

  const calculateActualTotal = (orderItems: OrderItem[]): number =>
    calculateActualTotalFromRules(orderItems);

  const hasUnweighedKGProducts = (order: Order): boolean =>
    hasUnweighedKGProductsRule(order);

  const addOrder = (orderData: Omit<Order, 'id'>, userId: string, userName: string, userRole: string) => {
    // Calcular estimatedTotal: solo productos por Unidad
    // Si viene en orderData, usarlo; sino calcularlo
    const estimatedTotal = orderData.estimatedTotal !== undefined 
      ? orderData.estimatedTotal 
      : calculateEstimatedTotal(orderData.orderItems || []);
    
    // Calcular items count (suma de todas las cantidades, incluyendo unidades de productos KG)
    const itemsCount = orderData.orderItems?.reduce((count, item) => count + item.estimatedQuantity, 0) || orderData.items || 0;
    
    const newOrder: Order = {
      ...orderData,
      id: generateOrderId(),
      estimatedTotal,
      total: estimatedTotal, // Total inicial es parcial (solo productos por Unidad)
      items: itemsCount,
      orderItems: orderData.orderItems || [],
      actualTotal: undefined, // No hay total real hasta que se ingresen pesos
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const updateOrder = (id: string, orderData: Partial<Order>, userId: string, userName: string, userRole: string) => {
    setOrders(prev =>
      prev.map(order => (order.id === id ? { ...order, ...orderData } : order))
    );
  };

  const deleteOrder = (id: string, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => {
    const order = orders.find(o => o.id === id);
    setOrders(prev => prev.filter(order => order.id !== id));
    
    // Registrar en auditoría
    if (order) {
      onAuditLog({
        user: userName,
        role: userRole,
        action: 'Eliminado',
        reference: id,
        details: `Pedido eliminado. Cliente: ${order.client}`,
      });
    }
  };

  const updateOrderWeights = (
    id: string,
    weights: { [productId: string]: number },
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ): boolean => {
    const order = orders.find(o => o.id === id);
    if (!order) {
      return false;
    }

    // Actualizar orderItems con los pesos reales
    const updatedOrderItems: OrderItem[] = order.orderItems.map(item => {
      if (item.unit === 'KG' && weights[item.productId] !== undefined) {
        return {
          ...item,
          actualWeight: weights[item.productId],
        };
      }
      return item;
    });

    // Calcular actualTotal
    const actualTotal = calculateActualTotal(updatedOrderItems);

    // Actualizar el pedido
    setOrders(prev =>
      prev.map(o => 
        o.id === id 
          ? { 
              ...o, 
              orderItems: updatedOrderItems,
              actualTotal,
              total: actualTotal, // Actualizar total para usar actualTotal
            } 
          : o
      )
    );

    // Registrar en auditoría
    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Modificado',
      reference: id,
      details: `Pesos reales ingresados. Total actualizado de $${order.estimatedTotal.toFixed(2)} a $${actualTotal.toFixed(2)}`,
    });

    return true;
  };

  const changeOrderStatus = (
    id: string,
    newStatus: OrderStatus,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ): boolean => {
    const order = orders.find(o => o.id === id);
    if (!order) {
      return false;
    }

    // Validar que la transición sea permitida
    if (!canChangeStatus(userRole as 'Admin' | 'Vendedor' | 'Logística' | 'Facturación', order.status, newStatus)) {
      return false;
    }

    const oldStatus = order.status;
    
    // Actualizar el estado
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: newStatus } : o))
    );

    // Registrar en auditoría
    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Cambio de Estado',
      reference: id,
      details: `Estado actualizado de ${oldStatus} a ${newStatus}`,
    });

    return true;
  };

  return (
    <OrdersContext.Provider value={{ 
      orders, 
      addOrder, 
      updateOrder, 
      deleteOrder, 
      changeOrderStatus,
      updateOrderWeights,
      calculateActualTotal,
      hasUnweighedKGProducts,
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders debe usarse dentro de OrdersProvider');
  }
  return context;
};
