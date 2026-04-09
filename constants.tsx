
import { Order, OrderStatus, Product, Client, User, AuditEntry } from './types';

export const INITIAL_ORDERS: Order[] = [
  { 
    id: '#ORD-001', 
    client: 'Distribuidora Central', 
    rut: '76.444.333-1', 
    date: '24/10/2023', 
    items: 7,
    total: 28.00, 
    status: OrderStatus.PENDIENTE_FACTURACION,
    estimatedTotal: 5.00, // Solo productos Unidad: 2 × $2.50 = $5.00
    actualTotal: 28.00, // Productos Unidad + productos KG: 5.00 + (2.5 × 8.50) = 5.00 + 21.25 = 26.25
    orderItems: [
      { productId: 'PD-1001', estimatedQuantity: 3, actualWeight: 2.5, price: 8.50, unit: 'KG' }, // Queso Cremoso
      { productId: 'PD-1004', estimatedQuantity: 2, price: 2.50, unit: 'Unidad' }, // Leche Entera
    ]
  },
  { 
    id: '#ORD-002', 
    client: 'Supermercado El Sol', 
    rut: '98.123.456-K', 
    date: '24/10/2023', 
    items: 6,
    total: 6.00,
    status: OrderStatus.PENDIENTE_ARMADO,
    estimatedTotal: 6.00, // Solo productos Unidad: 3 × $2.50 = $7.50
    orderItems: [
      { productId: 'PD-1002', estimatedQuantity: 2, price: 12.00, unit: 'KG' }, // Queso Dambo sin pesar
      { productId: 'PD-1004', estimatedQuantity: 3, price: 2.50, unit: 'Unidad' }, // Leche Entera
    ]
  },
  { 
    id: '#ORD-003', 
    client: 'Tienda Los Hermanos', 
    rut: '12.345.678-9', 
    date: '24/10/2023', 
    items: 2,
    total: 30.00, 
    status: OrderStatus.FACTURADO,
    estimatedTotal: 30.00,
    actualTotal: 30.00,
    orderItems: [
      { productId: 'PD-1012', estimatedQuantity: 2, price: 15.00, unit: 'KG' }, // Jamón Cocido
    ]
  },
  { 
    id: '#ORD-004', 
    client: 'Mini Market Apolo', 
    rut: '14.555.222-3', 
    date: '24/10/2023', 
    items: 8,
    total: 10.00,
    status: OrderStatus.PENDIENTE_ARMADO,
    estimatedTotal: 10.00,
    orderItems: [
      { productId: 'PD-1007', estimatedQuantity: 3, price: 1.50, unit: 'KG' }, // Harina 000 sin pesar
      { productId: 'PD-1004', estimatedQuantity: 5, price: 2.50, unit: 'Unidad' }, // Leche Entera
    ]
  },
  { 
    id: '#ORD-005', 
    client: 'Bodega San Juan', 
    rut: '18.999.000-1', 
    date: '24/10/2023', 
    items: 3,
    total: 30.28, 
    status: OrderStatus.FACTURADO,
    estimatedTotal: 5.00,
    actualTotal: 30.28,
    orderItems: [
      { productId: 'PD-1012', estimatedQuantity: 1, actualWeight: 1.1, price: 15.00, unit: 'KG' }, // Jamón Cocido
      { productId: 'PD-1004', estimatedQuantity: 2, price: 2.50, unit: 'Unidad' }, // Leche Entera
    ]
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Lácteos y Quesos
  { id: 'PD-1001', name: 'Queso Cremoso', brand: 'La Serenísima', category: 'Lácteos y Quesos', price: 8.50, unit: 'KG' },
  { id: 'PD-1002', name: 'Queso Dambo', brand: 'La Serenísima', category: 'Lácteos y Quesos', price: 12.00, unit: 'KG' },
  { id: 'PD-1003', name: 'Queso Tybo', brand: 'Verónica', category: 'Lácteos y Quesos', price: 10.50, unit: 'KG' },
  { id: 'PD-1004', name: 'Leche Entera', brand: 'La Serenísima', category: 'Lácteos y Quesos', price: 2.50, unit: 'Unidad' },
  { id: 'PD-1005', name: 'Yogur Natural', brand: 'La Serenísima', category: 'Lácteos y Quesos', price: 1.80, unit: 'Unidad' },
  { id: 'PD-1006', name: 'Manteca', brand: 'La Serenísima', category: 'Lácteos y Quesos', price: 3.20, unit: 'Unidad' },
  
  // Harinas
  { id: 'PD-1007', name: 'Harina 000', brand: 'Cañuelas', category: 'Harinas', price: 1.50, unit: 'KG' },
  { id: 'PD-1008', name: 'Harina 0000', brand: 'Cañuelas', category: 'Harinas', price: 1.60, unit: 'KG' },
  { id: 'PD-1009', name: 'Harina Integral', brand: 'Cañuelas', category: 'Harinas', price: 2.10, unit: 'KG' },
  { id: 'PD-1010', name: 'Harina de Maíz', brand: 'Morixe', category: 'Harinas', price: 1.80, unit: 'KG' },
  { id: 'PD-1011', name: 'Premezcla para Pizza', brand: 'Cañuelas', category: 'Harinas', price: 3.50, unit: 'KG' },
  
  // Fiambres
  { id: 'PD-1012', name: 'Jamón Cocido', brand: 'Paladini', category: 'Fiambres', price: 15.00, unit: 'KG' },
  { id: 'PD-1013', name: 'Salame Tipo Milán', brand: 'Paladini', category: 'Fiambres', price: 18.50, unit: 'KG' },
  { id: 'PD-1014', name: 'Mortadela', brand: 'Paladini', category: 'Fiambres', price: 12.00, unit: 'KG' },
  { id: 'PD-1015', name: 'Panceta Ahumada', brand: 'Swift', category: 'Fiambres', price: 20.00, unit: 'KG' },
  { id: 'PD-1016', name: 'Queso Cremoso', brand: 'Cremoso', category: 'Fiambres', price: 8.50, unit: 'KG' },
];

export const INITIAL_CATEGORIES: string[] = [
  'Lácteos y Quesos',
  'Harinas',
  'Fiambres',
  'Bebidas',
  'Carnes',
  'Frutas y Verduras',
  'Panadería',
  'Congelados',
  'Limpieza',
  'Otros',
];

export const INITIAL_BRANDS: string[] = [
  'La Serenísima',
  'Verónica',
  'Cañuelas',
  'Morixe',
  'Paladini',
  'Swift',
  'Cremoso',
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'CL-001', name: 'Distribuidora Central', initials: 'DC', address: 'Av. Libertador 1234, CABA', status: 'Activo' },
  { id: 'CL-002', name: 'Market Express', initials: 'ME', address: 'Calle Falsa 123, Springfield', status: 'Activo' },
  { id: 'CL-003', name: 'Supermercados Norte', initials: 'SN', address: 'Ruta 5 Km 40, Córdoba', status: 'Inactivo' },
  { id: 'CL-004', name: 'Almacén Doña Rosa', initials: 'AD', address: 'Calle 9 de Julio 550, Mendoza', status: 'Activo' },
  { id: 'CL-005', name: 'Tech Solutions Ltd', initials: 'TS', address: 'Av. Corrientes 2000, Rosario', status: 'Pendiente' },
];

export const INITIAL_USERS: User[] = [
  { id: 'U-001', name: 'Juan Pérez', email: 'juan@seguimiento.com', role: 'Admin', status: true, avatar: 'https://picsum.photos/seed/juan/100/100' },
  { id: 'U-002', name: 'Maria Lopez', email: 'maria@seguimiento.com', role: 'Vendedor', status: true, avatar: 'https://picsum.photos/seed/maria/100/100' },
  { id: 'U-003', name: 'Carlos Ruiz', email: 'carlos@seguimiento.com', role: 'Vendedor', status: false, avatar: 'https://picsum.photos/seed/carlos/100/100' },
  { id: 'U-004', name: 'Ana García', email: 'ana@seguimiento.com', role: 'Logística', status: true, avatar: 'https://picsum.photos/seed/ana/100/100' },
  { id: 'U-005', name: 'Pedro Martínez', email: 'pedro@seguimiento.com', role: 'Facturación', status: true, avatar: 'https://picsum.photos/seed/pedro/100/100' },
];

export const INITIAL_AUDIT: AuditEntry[] = [
  { id: 'A-001', user: 'Maria Garcia', role: 'Gerente de Logística', action: 'Cambio de Estado', reference: '#PED-1024', details: 'Estado actualizado de Pendiente a Enviado', date: '24 Oct 2023', time: '14:30:05' },
  { id: 'A-002', user: 'Carlos Rodriguez', role: 'Almacén', action: 'Creado', reference: '#INV-5502', details: 'Nuevo registro de inventario creado: 50 unidades.', date: '24 Oct 2023', time: '10:15:22' },
  { id: 'A-003', user: 'System Auto', role: 'Bot', action: 'Modificado', reference: '#CFG-SYS', details: 'Sincronización nocturna completada. Stock actualizado.', date: '23 Oct 2023', time: '23:00:00' },
];
