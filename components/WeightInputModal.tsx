import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Product } from '../types';

interface WeightInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  products: Product[];
  onConfirm: (weights: { [productId: string]: number }, quantities?: { [productId: string]: number }) => void;
}

const WeightInputModal: React.FC<WeightInputModalProps> = ({
  isOpen,
  onClose,
  order,
  products,
  onConfirm,
}) => {
  const [weights, setWeights] = useState<{ [productId: string]: number }>({});
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      const initialWeights: { [productId: string]: number } = {};
      const initialQuantities: { [productId: string]: number } = {};
      order.orderItems.forEach(item => {
        if (item.unit === 'KG') {
          initialWeights[item.productId] = item.actualWeight || 0;
          initialQuantities[item.productId] = item.estimatedQuantity;
        }
      });
      setWeights(initialWeights);
      setQuantities(initialQuantities);
      setErrors({});
    }
  }, [isOpen, order]);

  const handleWeightChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWeights(prev => ({ ...prev, [productId]: numValue }));
    if (errors[productId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = Math.max(0.1, parseFloat(value) || 0.1);
    setQuantities(prev => ({ ...prev, [productId]: numValue }));
  };

  const calculateItemSubtotal = (item: OrderItem): number => {
    if (item.unit === 'KG') {
      const weight = weights[item.productId] || 0;
      return weight * item.price;
    } else {
      // Para productos por Unidad, usar estimatedQuantity
      return item.estimatedQuantity * item.price;
    }
  };

  const calculateActualTotal = (): number => {
    return order.orderItems.reduce((total, item) => {
      return total + calculateItemSubtotal(item);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    
    // Validar que todos los productos por KG tengan peso real
    order.orderItems.forEach(item => {
      if (item.unit === 'KG') {
        const weight = weights[item.productId];
        if (!weight || weight <= 0) {
          newErrors[item.productId] = 'Debes ingresar un peso real mayor a 0';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const quantityUpdates: { [productId: string]: number } = {};
    kgItems.forEach(item => {
      const q = quantities[item.productId];
      if (q !== undefined && q !== item.estimatedQuantity) quantityUpdates[item.productId] = q;
    });
    onConfirm(weights, Object.keys(quantityUpdates).length > 0 ? quantityUpdates : undefined);
    onClose();
  };

  if (!isOpen) return null;

  const kgItems = order.orderItems.filter(item => item.unit === 'KG');
  const unitItems = order.orderItems.filter(item => item.unit === 'Unidad');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ingresar Pesos Reales</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pedido {order.id} - {order.client}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {kgItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                Productos por KG - Ingresar Peso Real
              </h3>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Fila de encabezados alineados */}
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-2 text-center">Cantidad</div>
                  <div className="col-span-2">Peso Real (KG) <span className="text-red-500">*</span></div>
                  <div className="col-span-2">Precio por KG</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>
                {/* Filas de productos */}
                {kgItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  const weight = weights[item.productId] || 0;
                  const qty = quantities[item.productId] ?? item.estimatedQuantity;
                  const subtotal = calculateItemSubtotal(item);
                  const inputClass = 'w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white min-h-[42px]';
                  const valueClass = 'flex items-center min-h-[42px] px-3 py-2.5 rounded-lg text-sm';
                  return (
                    <div
                      key={item.productId}
                      className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-b border-slate-100 dark:border-slate-800 last:border-b-0 bg-slate-50 dark:bg-slate-900/50"
                    >
                      <div className="col-span-4 flex items-center gap-2 min-h-[42px]">
                        <div className="size-9 shrink-0 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-lg">inventory_2</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{product?.name || 'Producto'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{product?.brand}</p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={qty}
                          onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                          className={`${inputClass} text-center ${
                            errors[`qty-${item.productId}`] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 text-center">cantidad pedida</p>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={weight || ''}
                          onChange={(e) => handleWeightChange(item.productId, e.target.value)}
                          className={`${inputClass} ${
                            errors[item.productId] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Total de las {qty} {qty === 1 ? 'unidad' : 'unidades'}
                        </p>
                        {errors[item.productId] && (
                          <p className="text-xs text-red-500 mt-0.5">{errors[item.productId]}</p>
                        )}
                      </div>
                      <div className={`col-span-2 ${valueClass} bg-slate-100 dark:bg-slate-800 font-medium text-slate-900 dark:text-white`}>
                        ${item.price.toFixed(2)}
                      </div>
                      <div className={`col-span-2 ${valueClass} bg-primary/10 dark:bg-primary/20 font-bold text-primary justify-end`}>
                        ${subtotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {unitItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                Productos por Unidad (Solo Lectura)
              </h3>
              <div className="space-y-3">
                {unitItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  const subtotal = calculateItemSubtotal(item);
                  
                  return (
                    <div key={item.productId} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2">
                            <div className="size-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">inventory_2</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{product?.name || 'Producto'}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{product?.brand} • Cantidad: {item.estimatedQuantity} unidades</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                            Precio Unit.
                          </label>
                          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-900 dark:text-white">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                            Subtotal
                          </label>
                          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-900 dark:text-white">
                            ${subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Estimado Original</p>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 line-through">
                  ${order.estimatedTotal.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Real</p>
                <p className="text-2xl font-bold text-primary">
                  ${calculateActualTotal().toFixed(2)}
                </p>
                {calculateActualTotal() !== order.estimatedTotal && (
                  <p className={`text-xs mt-1 ${
                    calculateActualTotal() > order.estimatedTotal 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {calculateActualTotal() > order.estimatedTotal ? '+' : ''}
                    ${(calculateActualTotal() - order.estimatedTotal).toFixed(2)} vs estimado
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            Confirmar Pesos y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightInputModal;
