import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderItem } from '../types';
import { useOrders } from '../contexts/OrdersContext';
import { useClients } from '../contexts/ClientsContext';
import { useProducts } from '../contexts/ProductsContext';
import { ORDER_STATUSES } from '../config/businessRules';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (order: Partial<Order>) => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ isOpen, onClose, order, onSave }) => {
  const { clients } = useClients();
  const { products } = useProducts();
  const [form, setForm] = useState({
    client: '',
    rut: '',
    date: '',
    status: OrderStatus.PENDIENTE_ARMADO,
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (order && isOpen) {
      const client = clients.find(c => c.name === order.client);
      setForm({
        client: client?.id || '',
        rut: order.rut || '',
        date: order.date.split('/').reverse().join('-').split('-').map((v, i) => {
          if (i === 1) return String(parseInt(v) - 1).padStart(2, '0');
          return v;
        }).join('-'),
        status: order.status,
      });
      setOrderItems(order.orderItems || []);
      setErrors({});
    }
  }, [order, isOpen, clients]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleAddProduct = () => {
    setOrderItems([...orderItems, { productId: '', estimatedQuantity: 1, price: 0, unit: 'Unidad' }]);
  };

  const handleRemoveProduct = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof OrderItem, value: string | number | undefined) => {
    const updatedItems = [...orderItems];
    if (value === undefined && field === 'actualWeight') {
      const next = { ...updatedItems[index] };
      delete next.actualWeight;
      updatedItems[index] = next;
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].price = product.price;
        updatedItems[index].unit = product.unit;
        updatedItems[index].estimatedQuantity = 1;
        delete updatedItems[index].actualWeight;
      }
    }
    
    setOrderItems(updatedItems);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.client) {
      newErrors.client = 'Debes seleccionar un cliente';
    }
    if (orderItems.length === 0) {
      newErrors.items = 'Debes agregar al menos un producto';
    }
    
    orderItems.forEach((item, index) => {
      const product = products.find(p => p.id === item.productId);
      if (!item.productId) {
        newErrors[`product_${index}`] = 'Debes seleccionar un producto';
      }
      if (item.estimatedQuantity <= 0) {
        newErrors[`quantity_${index}`] = 'La cantidad debe ser mayor a 0';
      }
      if (product?.unit === 'KG' && item.actualWeight !== undefined && item.actualWeight !== null && item.actualWeight <= 0) {
        newErrors[`weight_${index}`] = 'El peso debe ser mayor a 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !order) return;
    
    const selectedClient = clients.find(c => c.id === form.client);
    if (!selectedClient) return;

    const updatedOrderItems: OrderItem[] = orderItems.map(item => ({
      productId: item.productId,
      estimatedQuantity: item.estimatedQuantity,
      price: item.price,
      unit: item.unit,
      ...(item.actualWeight != null && item.actualWeight > 0 && { actualWeight: item.actualWeight }),
      ...(item.completed !== undefined && { completed: item.completed }),
      ...(item.billedByFacturacion !== undefined && { billedByFacturacion: item.billedByFacturacion }),
      ...(item.verifiedByAdmin !== undefined && { verifiedByAdmin: item.verifiedByAdmin }),
    }));

    onSave({
      client: selectedClient.name,
      rut: form.rut || undefined,
      date: formatDate(form.date),
      status: form.status,
      orderItems: updatedOrderItems,
    });
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Editar Pedido</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                ID Pedido
              </label>
              <input
                type="text"
                value={order.id}
                readOnly
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as OrderStatus })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={form.client}
                onChange={(e) => {
                  setForm({ ...form, client: e.target.value });
                  if (errors.client) setErrors({ ...errors, client: '' });
                }}
                className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white ${
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
              {errors.client && <p className="text-xs text-red-500">{errors.client}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                RUT (Opcional)
              </label>
              <input
                type="text"
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                placeholder="Ej: 76.444.333-1"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Fecha del Pedido <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white"
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
            {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                <p>No hay productos agregados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                          className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white ${
                            errors[`product_${index}`] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="">Seleccionar producto...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.brand}) - ${product.price.toFixed(2)} / {product.unit}
                            </option>
                          ))}
                        </select>
                        {errors[`product_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`product_${index}`]}</p>}
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Cantidad</label>
                        <input
                          type="number"
                          min={product?.unit === 'KG' ? 0.1 : 1}
                          step={product?.unit === 'KG' ? 0.1 : 1}
                          value={item.estimatedQuantity ?? ''}
                          onChange={(e) => {
                            const val = product?.unit === 'KG' ? (parseFloat(e.target.value) || 0) : (parseInt(e.target.value, 10) || 0);
                            handleProductChange(index, 'estimatedQuantity', val);
                          }}
                          className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white ${
                            errors[`quantity_${index}`] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                        {errors[`quantity_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`quantity_${index}`]}</p>}
                      </div>
                      {product && product.unit === 'KG' && (
                        <div className="w-28">
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Peso (kg)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.actualWeight ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0);
                              handleProductChange(index, 'actualWeight', val);
                            }}
                            placeholder="—"
                            className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white ${
                              errors[`weight_${index}`] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                          {errors[`weight_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`weight_${index}`]}</p>}
                        </div>
                      )}
                      {product && product.unit === 'KG' && (
                        <div className="w-28 flex flex-col justify-end">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Subtotal</span>
                          {item.actualWeight != null && item.actualWeight > 0 ? (
                            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold text-slate-900 dark:text-white">
                              ${(item.actualWeight * item.price).toFixed(2)}
                            </span>
                          ) : (
                            <span className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm font-semibold text-amber-700 dark:text-amber-400">Pendiente</span>
                          )}
                        </div>
                      )}
                      <div className="w-10 flex items-end shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="flex items-center justify-center w-10 h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 transition-all active:scale-95">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
