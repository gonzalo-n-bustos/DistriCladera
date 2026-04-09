import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Product } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS } from '../constants';

interface ProductsContextType {
  products: Product[];
  categories: string[];
  brands: string[];
  addProduct: (product: Omit<Product, 'id'>, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  updateProduct: (id: string, product: Partial<Product>, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  deleteProduct: (id: string, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => boolean;
  addBrand: (name: string) => void;
  removeBrand: (name: string) => boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(() => {
    const fromProducts = [...new Set(INITIAL_PRODUCTS.map(p => p.category))];
    const combined = new Set([...INITIAL_CATEGORIES, ...fromProducts]);
    return Array.from(combined).sort();
  });
  const [brands, setBrands] = useState<string[]>(() => {
    const fromProducts = [...new Set(INITIAL_PRODUCTS.map(p => p.brand))];
    const combined = new Set([...INITIAL_BRANDS, ...fromProducts]);
    return Array.from(combined).sort();
  });

  const generateProductId = (): string => {
    const lastProduct = products[products.length - 1];
    if (lastProduct) {
      const match = lastProduct.id.match(/^PD-(\d+)$/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        return `PD-${String(lastNumber + 1).padStart(4, '0')}`;
      }
    }
    return 'PD-1026';
  };

  const addProduct = (
    productData: Omit<Product, 'id'>,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const newProduct: Product = {
      ...productData,
      id: generateProductId(),
    };
    setProducts(prev => [...prev, newProduct]);

    setCategories(prev => {
      const cat = productData.category.trim();
      if (cat && !prev.includes(cat)) {
        return [...prev, cat].sort();
      }
      return prev;
    });
    setBrands(prev => {
      const brand = productData.brand.trim();
      if (brand && !prev.includes(brand)) {
        return [...prev, brand].sort();
      }
      return prev;
    });

    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Creado',
      reference: newProduct.id,
      details: `Producto creado: ${newProduct.name} - $${newProduct.price.toFixed(2)}/${newProduct.unit}`,
    });
  };

  const updateProduct = (
    id: string,
    productData: Partial<Product>,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const oldProduct = products.find(p => p.id === id);
    if (!oldProduct) return;

    setProducts(prev =>
      prev.map(product => (product.id === id ? { ...product, ...productData } : product))
    );

    if (productData.category?.trim() && !categories.includes(productData.category.trim())) {
      setCategories(prev => [...prev, productData.category!.trim()].sort());
    }
    if (productData.brand?.trim() && !brands.includes(productData.brand.trim())) {
      setBrands(prev => [...prev, productData.brand!.trim()].sort());
    }

    const changes: string[] = [];
    if (productData.name && productData.name !== oldProduct.name) {
      changes.push(`nombre: "${oldProduct.name}" → "${productData.name}"`);
    }
    if (productData.brand && productData.brand !== oldProduct.brand) {
      changes.push(`marca: "${oldProduct.brand}" → "${productData.brand}"`);
    }
    if (productData.category && productData.category !== oldProduct.category) {
      changes.push(`categoría: "${oldProduct.category}" → "${productData.category}"`);
    }
    if (productData.price !== undefined && productData.price !== oldProduct.price) {
      changes.push(`precio: $${oldProduct.price.toFixed(2)} → $${productData.price.toFixed(2)}`);
    }
    if (productData.unit && productData.unit !== oldProduct.unit) {
      changes.push(`unidad: ${oldProduct.unit} → ${productData.unit}`);
    }

    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Modificado',
      reference: id,
      details: `Producto modificado. Cambios: ${changes.join(', ')}`,
    });
  };

  const deleteProduct = (
    id: string,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setProducts(prev => prev.filter(p => p.id !== id));

    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Eliminado',
      reference: id,
      details: `Producto eliminado: ${product.name}`,
    });
  };

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed].sort()));
  };

  const removeCategory = (name: string): boolean => {
    const inUse = products.some(p => p.category === name);
    if (inUse) return false;
    setCategories(prev => prev.filter(c => c !== name));
    return true;
  };

  const addBrand = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBrands(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed].sort()));
  };

  const removeBrand = (name: string): boolean => {
    const inUse = products.some(p => p.brand === name);
    if (inUse) return false;
    setBrands(prev => prev.filter(b => b !== name));
    return true;
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        categories,
        brands,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        removeCategory,
        addBrand,
        removeBrand,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de ProductsProvider');
  }
  return context;
};
