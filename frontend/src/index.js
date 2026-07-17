import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import App from './App';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <App />

          <ToastContainer
            position="top-right"
            autoClose={3000}
          />
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);