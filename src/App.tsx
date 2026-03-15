import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement';
import OrderManagement from './components/OrderManagement';
import CustomerManagement from './components/CustomerManagement';
import FinanceManagement from './components/FinanceManagement';
import SupplierManagement from './components/SupplierManagement';
import Settings from './components/Settings';
import Auth from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';

import Inventory from './components/InventoryManagement';
import Marketing from './components/MarketingManagement';
import Reports from './components/Reports';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <Auth />
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders" element={<OrderManagement />} />
                <Route path="/products" element={<ProductManagement />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/customers" element={<CustomerManagement />} />
                <Route path="/suppliers" element={<SupplierManagement />} />
                <Route path="/finance" element={<FinanceManagement />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
