import React, { useState, useMemo } from 'react';
import { useProducts } from '../contexts/ProductsContext';
import { useAuth } from '../hooks/useAuth';
import { useAudit } from '../contexts/AuditContext';
import { Product } from '../types';
import EditProductModal from '../components/EditProductModal';
import CategoriesAndBrandsModal from '../components/CategoriesAndBrandsModal';

const Products: React.FC = () => {
  const { products, categories, brands, addProduct, updateProduct, deleteProduct } = useProducts();
  const { user } = useAuth();
  const { addAuditEntry } = useAudit();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<'KG' | 'Unidad' | ''>('');
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [isCategoriesBrandsModalOpen, setIsCategoriesBrandsModalOpen] = useState(false);

  // Formulario para nuevo producto
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    brand: '',
    category: '',
    price: 0,
    unit: 'KG' as 'KG' | 'Unidad',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtrado y búsqueda
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const matchesSearch = 
        prod.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || prod.category === categoryFilter;
      const matchesUnit = !unitFilter || prod.unit === unitFilter;
      return matchesSearch && matchesCategory && matchesUnit;
    });
  }, [products, searchTerm, categoryFilter, unitFilter]);

  // Agrupar por categoría
  const groupedProducts = useMemo(() => {
    if (!groupByCategory) {
      return { 'Todos': filteredProducts };
    }
    
    const grouped: Record<string, Product[]> = {};
    filteredProducts.forEach(prod => {
      if (!grouped[prod.category]) {
        grouped[prod.category] = [];
      }
      grouped[prod.category].push(prod);
    });
    
    // Ordenar categorías
    const sortedCategories = Object.keys(grouped).sort();
    const sorted: Record<string, Product[]> = {};
    sortedCategories.forEach(cat => {
      sorted[cat] = grouped[cat];
    });
    
    return sorted;
  }, [filteredProducts, groupByCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
  };

  const handleUnitFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnitFilter(e.target.value as 'KG' | 'Unidad' | '');
  };

  const handleCreateProduct = () => {
    setNewProductForm({ name: '', brand: '', category: '', price: 0, unit: 'KG' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateNewProduct = (): boolean => {
    const errors: Record<string, string> = {};
    if (!newProductForm.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    if (!newProductForm.brand.trim()) {
      errors.brand = 'La marca es obligatoria';
    }
    if (!newProductForm.category.trim()) {
      errors.category = 'La categoría es obligatoria';
    }
    if (newProductForm.price <= 0) {
      errors.price = 'El precio debe ser mayor a 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveNewProduct = () => {
    if (!validateNewProduct() || !user) return;
    
    addProduct(
      {
        name: newProductForm.name.trim(),
        brand: newProductForm.brand.trim(),
        category: newProductForm.category.trim(),
        price: newProductForm.price,
        unit: newProductForm.unit,
      },
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );
    
    setIsModalOpen(false);
    setNewProductForm({ name: '', brand: '', category: '', price: 0, unit: 'KG' });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = (updatedProduct: Partial<Product>) => {
    if (!editingProduct || !user) return;
    
    updateProduct(
      editingProduct.id,
      updatedProduct,
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );
    
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    if (!user) return;
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el producto ${product.id}?\n\n${product.name} - ${product.brand}\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    deleteProduct(
      product.id,
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );
  };

  return (
    <div className="container mx-auto max-w-7xl flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="mb-2 flex items-center text-sm">
        <a className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium" href="#">Inicio</a>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white font-medium">Productos</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Administración de Productos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Administra el catálogo de productos y precios.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a2634] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150" 
            placeholder="Buscar por código, nombre o marca..." 
            type="text" 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative min-w-[160px] flex-1 sm:flex-none">
            <select 
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none text-slate-700 dark:text-slate-300"
            >
              <option value="">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
          </div>
          <div className="relative min-w-[140px] flex-1 sm:flex-none">
            <select 
              value={unitFilter}
              onChange={handleUnitFilterChange}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none text-slate-700 dark:text-slate-300"
            >
              <option value="">Todas las Unidades</option>
              <option value="KG">KG</option>
              <option value="Unidad">Unidad</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
          </div>
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              groupByCategory
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">category</span>
            <span>Agrupar por Categoría</span>
          </button>
          <button
            onClick={() => setIsCategoriesBrandsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">label</span>
            <span>Categorías y Marcas</span>
          </button>
          <button 
            onClick={handleCreateProduct}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Crear Producto</span>
          </button>
        </div>
      </div>

      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <div key={category} className="bg-white dark:bg-[#1a2634] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {groupByCategory && (
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{category}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{categoryProducts.length} producto{categoryProducts.length !== 1 ? 's' : ''}</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Marca</th>
                  {!groupByCategory && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoría</th>
                  )}
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unidad</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {categoryProducts.length === 0 ? (
                  <tr>
                    <td colSpan={groupByCategory ? 6 : 7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  categoryProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary">{prod.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{prod.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{prod.brand}</span>
                      </td>
                      {!groupByCategory && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {prod.category}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">${prod.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prod.unit === 'KG' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {prod.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditProduct(prod)}
                            className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" 
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" 
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modal para crear producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Crear Nuevo Producto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre del Producto <span className="text-red-500">*</span></label>
                <input 
                  className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                    formErrors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  placeholder="Ej: Queso Cremoso" 
                  type="text" 
                  value={newProductForm.name}
                  onChange={(e) => {
                    setNewProductForm({ ...newProductForm, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                />
                {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Marca <span className="text-red-500">*</span></label>
                <select
                  value={newProductForm.brand}
                  onChange={(e) => {
                    setNewProductForm({ ...newProductForm, brand: e.target.value });
                    if (formErrors.brand) setFormErrors({ ...formErrors, brand: '' });
                  }}
                  className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                    formErrors.brand ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Seleccionar marca...</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {formErrors.brand && <p className="text-xs text-red-500">{formErrors.brand}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categoría <span className="text-red-500">*</span></label>
                <select
                  value={newProductForm.category}
                  onChange={(e) => {
                    setNewProductForm({ ...newProductForm, category: e.target.value });
                    if (formErrors.category) setFormErrors({ ...formErrors, category: '' });
                  }}
                  className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                    formErrors.category ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {formErrors.category && <p className="text-xs text-red-500">{formErrors.category}</p>}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Precio <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">$</span>
                    <input 
                      className={`w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 dark:text-white ${
                        formErrors.price ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="0.00" 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={newProductForm.price || ''}
                      onChange={(e) => {
                        setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 });
                        if (formErrors.price) setFormErrors({ ...formErrors, price: '' });
                      }}
                    />
                  </div>
                  {formErrors.price && <p className="text-xs text-red-500">{formErrors.price}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Unidad de Venta</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" 
                        name="unit" 
                        type="radio" 
                        checked={newProductForm.unit === 'KG'}
                        onChange={() => setNewProductForm({ ...newProductForm, unit: 'KG' })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">KG</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" 
                        name="unit" 
                        type="radio" 
                        checked={newProductForm.unit === 'Unidad'}
                        onChange={() => setNewProductForm({ ...newProductForm, unit: 'Unidad' })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Unidad</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={handleSaveNewProduct} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 transition-all active:scale-95">Guardar Producto</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar producto */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSaveEditProduct}
      />

      {/* Modal Categorías y Marcas */}
      <CategoriesAndBrandsModal
        isOpen={isCategoriesBrandsModalOpen}
        onClose={() => setIsCategoriesBrandsModalOpen(false)}
      />
    </div>
  );
};

export default Products;
