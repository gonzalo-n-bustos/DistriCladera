import React, { useState } from 'react';
import { useProducts } from '../contexts/ProductsContext';

interface CategoriesAndBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoriesAndBrandsModal: React.FC<CategoriesAndBrandsModalProps> = ({ isOpen, onClose }) => {
  const { categories, brands, addCategory, removeCategory, addBrand, removeBrand, products } = useProducts();
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [brandError, setBrandError] = useState('');
  const [removeError, setRemoveError] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    setRemoveError('');
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setCategoryError('Escribí el nombre de la categoría.');
      return;
    }
    if (categories.includes(trimmed)) {
      setCategoryError('Esa categoría ya existe.');
      return;
    }
    addCategory(trimmed);
    setNewCategory('');
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    setBrandError('');
    setRemoveError('');
    const trimmed = newBrand.trim();
    if (!trimmed) {
      setBrandError('Escribí el nombre de la marca.');
      return;
    }
    if (brands.includes(trimmed)) {
      setBrandError('Esa marca ya existe.');
      return;
    }
    addBrand(trimmed);
    setNewBrand('');
  };

  const handleRemoveCategory = (name: string) => {
    setRemoveError('');
    const ok = removeCategory(name);
    if (!ok) {
      setRemoveError(`No se puede eliminar "${name}" porque hay productos que la usan.`);
    }
  };

  const handleRemoveBrand = (name: string) => {
    setRemoveError('');
    const ok = removeBrand(name);
    if (!ok) {
      setRemoveError(`No se puede eliminar "${name}" porque hay productos que la usan.`);
    }
  };

  const countProductsByCategory = (category: string) =>
    products.filter(p => p.category === category).length;
  const countProductsByBrand = (brand: string) =>
    products.filter(p => p.brand === brand).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Categorías y Marcas</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {removeError && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {removeError}
            </div>
          )}

          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Categorías</h3>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={e => {
                  setNewCategory(e.target.value);
                  setCategoryError('');
                }}
                placeholder="Nueva categoría (ej: Bebidas)"
                className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Agregar
              </button>
            </form>
            {categoryError && <p className="text-sm text-red-500 mb-2">{categoryError}</p>}
            <ul className="space-y-2">
              {categories.length === 0 ? (
                <li className="text-sm text-slate-500 dark:text-slate-400">No hay categorías. Agregá una arriba.</li>
              ) : (
                categories.map(cat => {
                  const count = countProductsByCategory(cat);
                  const canRemove = count === 0;
                  return (
                    <li
                      key={cat}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{cat}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {count} producto{count !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          disabled={!canRemove}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={canRemove ? 'Eliminar categoría' : 'Hay productos con esta categoría'}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Marcas</h3>
            <form onSubmit={handleAddBrand} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newBrand}
                onChange={e => {
                  setNewBrand(e.target.value);
                  setBrandError('');
                }}
                placeholder="Nueva marca (ej: Coca-Cola)"
                className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Agregar
              </button>
            </form>
            {brandError && <p className="text-sm text-red-500 mb-2">{brandError}</p>}
            <ul className="space-y-2">
              {brands.length === 0 ? (
                <li className="text-sm text-slate-500 dark:text-slate-400">No hay marcas. Agregá una arriba.</li>
              ) : (
                brands.map(brand => {
                  const count = countProductsByBrand(brand);
                  const canRemove = count === 0;
                  return (
                    <li
                      key={brand}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{brand}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {count} producto{count !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBrand(brand)}
                          disabled={!canRemove}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={canRemove ? 'Eliminar marca' : 'Hay productos con esta marca'}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesAndBrandsModal;
