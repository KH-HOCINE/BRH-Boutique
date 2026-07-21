import { createContext, useContext, useRef, useCallback } from 'react';
import api from '../utils/api';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const cache = useRef(new Map()); // id -> product
  const featuredCache = useRef(null);

  const getFeatured = useCallback(async () => {
    if (featuredCache.current) return featuredCache.current;
    const res = await api.get('/products?featured=true');
    const data = res.data.slice(0, 4);
    featuredCache.current = data;
    data.forEach(p => cache.current.set(p._id, p));
    return data;
  }, []);

  const getProduct = useCallback(async (id) => {
    if (cache.current.has(id)) return cache.current.get(id);
    const res = await api.get(`/products/${id}`);
    cache.current.set(id, res.data);
    return res.data;
  }, []);

  return (
    <ProductsContext.Provider value={{ getFeatured, getProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts doit être utilisé dans ProductsProvider');
  return ctx;
}