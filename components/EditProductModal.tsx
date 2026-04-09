import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useProducts } from '../contexts/ProductsContext';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (product: Partial<Product>) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const { categories, brands } = useProducts();
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    price: 0,
    unit: 'KG' as 'KG' | 'Unidad',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product && isOpen) {
      setForm({
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        unit: product.unit,
      });
      setErrors({});
    }
  }, [product, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (!form.brand.trim()) {
      newErrors.brand = 'La marca es obligatoria';
    }
    if (!form.category.trim()) {
      newErrors.category = 'La categoría es obligatoria';
    }
    if (form.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !product) return;
    
    onSave({
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      price: form.price,
      unit: form.unit,
    });
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Editar Producto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Código</label>
            <input
              type="text"
              value={product.id}
              readOnly
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre del Producto <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Ej: Queso Cremoso"
              className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Marca <span className="text-red-500">*</span></label>
            <select
              value={form.brand}
              onChange={(e) => {
                setForm({ ...form, brand: e.target.value });
                if (errors.brand) setErrors({ ...errors, brand: '' });
              }}
              className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                errors.brand ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">Seleccionar marca...</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.brand && <p className="text-xs text-red-500">{errors.brand}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categoría <span className="text-red-500">*</span></label>
            <select
              value={form.category}
              onChange={(e) => {
                setForm({ ...form, category: e.target.value });
                if (errors.category) setErrors({ ...errors, category: '' });
              }}
              className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                errors.category ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Precio <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => {
                    setForm({ ...form, price: parseFloat(e.target.value) || 0 });
                    if (errors.price) setErrors({ ...errors, price: '' });
                  }}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                    errors.price ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Unidad de Venta</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent"
                    name="unit"
                    type="radio"
                    checked={form.unit === 'KG'}
                    onChange={() => setForm({ ...form, unit: 'KG' })}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">KG</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent"
                    name="unit"
                    type="radio"
                    checked={form.unit === 'Unidad'}
                    onChange={() => setForm({ ...form, unit: 'Unidad' })}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Unidad</span>
                </label>
              </div>
            </div>
          </div>
        </form>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
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

export default EditProductModal;
