
export enum OrderStatus {
  PENDIENTE_ARMADO = 'Pendiente de Armado',
  PENDIENTE_FACTURACION = 'Pendiente de Facturación',
  FACTURADO = 'Facturado',
  ENTREGADO = 'Entregado'
}

export interface OrderItem {
  productId: string;
  estimatedQuantity: number; // Cantidad estimada para KG, cantidad real para Unidad
  actualWeight?: number; // Peso real en KG, solo para productos por KG, opcional
  price: number; // Precio unitario
  unit: 'KG' | 'Unidad'; // Para saber si requiere peso real
  /** Marcado por logística cuando el artículo está listo/completado */
  completed?: boolean;
  /** Marcado por Facturación cuando el artículo está facturado/completado */
  billedByFacturacion?: boolean;
  /** Marcado por Admin cuando comprueba que logística agregó lo facturado */
  verifiedByAdmin?: boolean;
}

export interface Order {
  id: string;
  client: string;
  rut?: string;
  date: string;
  items: number; // Mantener para compatibilidad
  total: number; // Mantener para compatibilidad (usar actualTotal si existe, sino estimatedTotal)
  status: OrderStatus;
  orderItems: OrderItem[]; // Lista detallada de items
  estimatedTotal: number; // Total estimado inicial
  actualTotal?: number; // Total real después de ingresar pesos, opcional
  /** Observaciones específicas del pedido */
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  unit: 'KG' | 'Unidad';
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  address: string;
  status: 'Activo' | 'Inactivo' | 'Pendiente';
  /** Contacto y observaciones (opcionales, no se muestran en la tabla) */
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
}

export type UserRole = 'Admin' | 'Vendedor' | 'Logística' | 'Facturación';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: boolean;
  avatar?: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  role: string;
  action: 'Creado' | 'Modificado' | 'Eliminado' | 'Cambio de Estado' | 'Acceso';
  reference: string;
  details: string;
  date: string;
  time: string;
}
