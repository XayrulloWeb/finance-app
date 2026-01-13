import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFinanceStore } from './store/useFinanceStore';
import { supabase } from './supabaseClient';
import ToastProvider from './components/ui/ToastProvider';
import Layout from './components/Layout';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

// Lazy Pages
const Analytics = lazy(() => import('./pages/Analytics'));
const Debts = lazy(() => import('./pages/Debts'));
const Counterparties = lazy(() => import('./pages/Counterparties'));
const Settings = lazy(() => import('./pages/Settings'));
const History = lazy(() => import('./pages/History'));
const Recurring = lazy(() => import('./pages/Recurring'));
const Goals = lazy(() => import('./pages/Goals'));
const Insights = lazy(() => import('./pages/Insights'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Notifications = lazy(() => import('./pages/Notifications'));

const FullScreenLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] text-zinc-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
);

export default function App() {
    const user = useFinanceStore(s => s.user);
    const checkUser = useFinanceStore(s => s.checkUser);
    const isAuthChecked = useFinanceStore(s => s.isAuthChecked);
    const settings = useFinanceStore(s => s.settings);
    const updateCurrencyRatesIfNeeded = useFinanceStore(s => s.updateCurrencyRatesIfNeeded);

  useEffect(() => {
    // Theme
    if (settings.dark_mode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // Auth Check
    checkUser();
    updateCurrencyRatesIfNeeded();

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') checkUser();
    });

    return () => subscription.unsubscribe();
  }, [checkUser, settings.dark_mode,updateCurrencyRatesIfNeeded]);

  if (!isAuthChecked) return <FullScreenLoader />;

  return (
      <ToastProvider>
        <BrowserRouter>
          {!user ? (
              <Auth />
          ) : (
              <Suspense fallback={<FullScreenLoader />}>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="debts" element={<Debts />} />
                    <Route path="counterparties" element={<Counterparties />} />
                    <Route path="recurring" element={<Recurring />} />
                    <Route path="history" element={<History />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="insights" element={<Insights />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
          )}
        </BrowserRouter>
      </ToastProvider>
  );
}