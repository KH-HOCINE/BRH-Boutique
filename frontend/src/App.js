import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { initMetaPixel } from './utils/metaPixel';
import { SearchProvider } from './context/SearchContext';
import { LanguageProvider } from './context/LanguageContext'; // ← Ajout
import CustomizerPage from './pages/CustomizerPage';
// ...

// Pages boutique
import HomePage      from './pages/HomePage';
import ShopPage      from './pages/ShopPage';
import ProductPage   from './pages/ProductPage';
import CartPage      from './pages/CartPage';
import CheckoutPage  from './pages/CheckoutPage';
import OrderSuccess  from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';

// Pages admin
import AdminLogin     from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts  from './pages/AdminProducts';
import AdminOrders    from './pages/AdminOrders';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  return admin ? children : <Navigate to="/admin/login" />;
};

function App() {
  useEffect(() => {
    initMetaPixel();
  }, []);

  return (
    <LanguageProvider>          {/* ← Enveloppe tout : gère la langue active + RTL */}
      <SearchProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Boutique ── */}
            <Route path="/"               element={<HomePage />} />
            <Route path="/boutique"       element={<ShopPage />} />
            <Route path="/produit/:id"    element={<ProductPage />} />
            <Route path="/panier"         element={<CartPage />} />
            <Route path="/commande"       element={<CheckoutPage />} />
            <Route path="/merci/:orderNumber" element={<OrderSuccess />} />
            <Route path="/suivi"          element={<OrderTracking />} />
            <Route path="/customiser" element={<CustomizerPage />} />


            {/* ── Admin ── */}
            <Route path="/admin/login"    element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/produits" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/commandes" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </SearchProvider>
    </LanguageProvider>
  );
}

export default App;