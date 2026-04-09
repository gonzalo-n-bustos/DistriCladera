import React, { useState, useEffect } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import { useClients } from '../contexts/ClientsContext';
import { useProducts } from '../contexts/ProductsContext';
import { useAuth } from '../hooks/useAuth';
import { useAudit } from '../contexts/AuditContext';
import { OrderStatus, OrderItem, Product } from '../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose }) => {
  const { addOrder, orders } = useOrders();
  const { clients } = useClients();
  const { products } = useProducts();
  const { user } = useAuth();
  const { addAuditEntry } = useAudit();
  const [selectedClient, setSelectedClient] = useState('');
  const [clientRut, setClientRut] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [searchQueryByItem, setSearchQueryByItem] = useState<Record<number, string>>({});
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Resetear formulario cuando se cierra
      setSelectedClient('');
      setClientRut('');
      setOrderDate(new Date().toISOString().split('T')[0]);
      setOrderItems([]);
      setErrors({});
      setSearchQueryByItem({});
      setOpenDropdownIndex(null);
    }
  }, [isOpen]);

  const getFilteredProducts = (query: string): Product[] => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.id.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  };

  const getProductLabel = (p: Product) =>
    `${p.name} (${p.brand}) - $${p.price.toFixed(2)} / ${p.unit}`;

  const handleAddProduct = () => {
    setOrderItems([...orderItems, { productId: '', estimatedQuantity: 1, price: 0, unit: 'Unidad' }]);
  };

  const handleRemoveProduct = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Si cambia el producto, actualizar el precio y la unidad
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].price = product.price;
        updatedItems[index].unit = product.unit;
        // Para productos KG: cantidad de unidades (ej: 3 quesos)
        // Para productos Unidad: cantidad normal
        updatedItems[index].estimatedQuantity = 1; // Valor inicial
        // Limpiar actualWeight si cambia el producto
        delete updatedItems[index].actualWeight;
      }
    }
    
    setOrderItems(updatedItems);
  };

  const calculateEstimatedTotal = () => {
    return orderItems.reduce((total, item) => {
      // Solo incluir productos por Unidad en el total estimado
      // Productos por KG no tienen peso aún, por lo que su subtotal es $0
      if (item.unit === 'KG') {
        return total; // No sumar productos KG sin peso
      }
      return total + (item.price * item.estimatedQuantity);
    }, 0);
  };

  const calculateItemsCount = () => {
    return orderItems.reduce((count, item) => {
      // Para productos por KG, contar la cantidad estimada
      // Para productos por Unidad, contar la cantidad real
      return count + item.estimatedQuantity;
    }, 0);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    
    if (!selectedClient) {
      newErrors.client = 'Debes seleccionar un cliente';
    }
    
    if (orderItems.length === 0) {
      newErrors.items = 'Debes agregar al menos un producto';
    }
    
    orderItems.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`product_${index}`] = 'Debes seleccionar un producto';
      }
      const product = products.find(p => p.id === item.productId);
      if (item.estimatedQuantity <= 0) {
        newErrors[`quantity_${index}`] = 'La cantidad debe ser mayor a 0';
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const selectedClientData = clients.find(c => c.id === selectedClient);
    if (!selectedClientData) return;
    
    if (!user) {
      setErrors({ ...errors, general: 'No hay usuario autenticado' });
      return;
    }

    // Crear orderItems sin actualWeight (se agregará después por Logística)
    const orderItemsForOrder: OrderItem[] = orderItems.map(item => ({
      productId: item.productId,
      estimatedQuantity: item.estimatedQuantity,
      price: item.price,
      unit: item.unit,
      // actualWeight no se incluye aquí, será agregado por Logística
    }));

    const estimatedTotal = calculateEstimatedTotal();
    
    const newOrder = {
      client: selectedClientData.name,
      rut: clientRut || undefined,
      date: formatDate(orderDate),
      items: calculateItemsCount(),
      total: estimatedTotal, // Total estimado inicial
      status: OrderStatus.PENDIENTE_ARMADO,
      orderItems: orderItemsForOrder,
      estimatedTotal: estimatedTotal,
      // actualTotal no se incluye aquí, será calculado después por Logística
    };
    
    addOrder(newOrder, user.id, user.name, user.role);
    
    // Registrar en auditoría
    addAuditEntry({
      user: user.name,
      role: user.role,
      action: 'Creado',
      reference: `#ORD-${String(orders.length + 1).padStart(3, '0')}`,
      details: `Nuevo pedido creado para ${selectedClientData.name} con ${calculateItemsCount()} items. Total estimado: $${estimatedTotal.toFixed(2)}`,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Crear Nuevo Pedido</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  const client = clients.find(c => c.id === e.target.value);
                  setClientRut('');
                  setErrors({ ...errors, client: '' });
                }}
                className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                  errors.client ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.filter(c => c.status === 'Activo').map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.client && (
                <p className="text-xs text-red-500">{errors.client}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                RUT (Opcional)
              </label>
              <input
                type="text"
                value={clientRut}
                onChange={(e) => setClientRut(e.target.value)}
                placeholder="Ej: 76.444.333-1"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Fecha del Pedido <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Productos <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Agregar Producto
              </button>
            </div>
            
            {errors.items && (
              <p className="text-xs text-red-500 mb-2">{errors.items}</p>
            )}
            
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                <p>No hay productos agregados</p>
                <p className="text-xs mt-1">Haz clic en "Agregar Producto" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 relative">
                        <div
                          className={`flex w-full items-center rounded-lg border bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary text-sm text-slate-900 dark:text-white ${
                            errors[`product_${index}`] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="pl-3 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                          <input
                            type="text"
                            value={
                              searchQueryByItem[index] !== undefined && searchQueryByItem[index] !== ''
                                ? searchQueryByItem[index]
                                : item.productId && product
                                  ? getProductLabel(product)
                                  : ''
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.trim() && item.productId) {
                                handleProductChange(index, 'productId', '');
                              }
                              setSearchQueryByItem((prev) => ({ ...prev, [index]: value }));
                            }}
                            onFocus={() => setOpenDropdownIndex(index)}
                            onBlur={() => setTimeout(() => setOpenDropdownIndex(null), 200)}
                            placeholder="Buscar por ID, nombre, marca o categoría..."
                            className="w-full min-w-0 py-2 pr-3 pl-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
                          />
                        </div>
                        {openDropdownIndex === index && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                            {(() => {
                              const query = searchQueryByItem[index] ?? '';
                              const filtered = getFilteredProducts(query);
                              if (filtered.length === 0) {
                                return (
                                  <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                                    {query.trim()
                                      ? 'Ningún producto coincide con la búsqueda'
                                      : 'Escribí para buscar productos'}
                                  </div>
                                );
                              }
                              return (
                                <ul className="py-1">
                                  {filtered.map((p) => (
                                    <li key={p.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleProductChange(index, 'productId', p.id);
                                          setSearchQueryByItem((prev) => {
                                            const next = { ...prev };
                                            delete next[index];
                                            return next;
                                          });
                                          setOpenDropdownIndex(null);
                                          setErrors((prev) => ({ ...prev, [`product_${index}`]: '' }));
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                      >
                                        {getProductLabel(p)}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              );
                            })()}
                          </div>
                        )}
                        {errors[`product_${index}`] && (
                          <p className="text-xs text-red-500 mt-1">{errors[`product_${index}`]}</p>
                        )}
                      </div>
                      
                      <div className="w-32">
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min={product && product.unit === 'KG' ? 0.1 : 1}
                          step={product && product.unit === 'KG' ? 0.1 : 1}
                          value={item.estimatedQuantity ?? ''}
                          onChange={(e) => {
                            const product = products.find(p => p.id === orderItems[index].productId);
                            const raw = e.target.value;
                            const num = product?.unit === 'KG' ? (parseFloat(raw) || 0) : (parseInt(raw, 10) || 0);
                            handleProductChange(index, 'estimatedQuantity', num);
                          }}
                          className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white ${
                            errors[`quantity_${index}`] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                          placeholder={product && product.unit === 'KG' ? 'Ej: 1,5' : ''}
                        />
                        {errors[`quantity_${index}`] && (
                          <p className="text-xs text-red-500 mt-1">{errors[`quantity_${index}`]}</p>
                        )}
                        {product && product.unit === 'KG' && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Peso (kg) se ingresa al preparar/facturar</p>
                        )}
                      </div>
                      
                      <div className="w-32">
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Precio Unit.</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      
                      <div className="w-32 flex items-end">
                        <div className="w-full">
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                            {product && product.unit === 'KG' ? 'Subtotal' : 'Subtotal'}
                          </label>
                          {product && product.unit === 'KG' ? (
                            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm font-semibold text-amber-700 dark:text-amber-400">
                              $0.00
                              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Pendiente</p>
                            </div>
                          ) : (
                            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold text-slate-900 dark:text-white">
                              ${(item.price * item.estimatedQuantity).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="flex items-center justify-center w-10 h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex justify-end items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total de Items</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{calculateItemsCount()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Parcial</p>
                <p className="text-2xl font-bold text-primary">${calculateEstimatedTotal().toFixed(2)}</p>
                {orderItems.some(item => {
                  const product = products.find(p => p.id === item.productId);
                  return product && product.unit === 'KG';
                }) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    * Total parcial. El total real se calculará después del pesaje de productos por KG
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            Crear Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;
