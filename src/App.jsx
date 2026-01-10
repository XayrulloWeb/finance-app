import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useFinanceStore } from './store/useFinanceStore';
import { supabase } from './supabaseClient';
import { ToastProvider, toast } from './components/ui/Toast';
import GlassCard from './components/ui/GlassCard';
import Button from './components/ui/Button';
import Layout from './components/Layout';

// Eager load Dashboard for LCP
import Dashboard from './pages/Dashboard';

// Lazy load other pages
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
  <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] text-zinc-900 transition-colors duration-300">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>
);

export default function App() {
  const { user, checkUser, isAuthChecked, settings } = useFinanceStore();

  useEffect(() => {
    // Apply theme
    if (settings.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check user & subscription
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') checkUser();
    });
    return () => subscription.unsubscribe();
  }, [settings.dark_mode]);

  if (!isAuthChecked) return <FullScreenLoader />;

  return (
    <ToastProvider>
      {!user ? (
        <LoginScreen />
      ) : (
        <BrowserRouter>
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
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      )}
    </ToastProvider>
  );
}

function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isReg, setIsReg] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = isReg
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      toast.success(isReg ? 'Регистрация успешна!' : 'С возвращением!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-300">
      <GlassCard className="w-full max-w-md p-8 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 shadow-2xl relative overflow-hidden">
        {/* Background blobs for mood */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/20 mb-5 animate-pulse-glow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            Finance Empire
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {isReg ? 'Создание профиля' : 'Вход в систему'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
            <input
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 dark:text-white placeholder-gray-400 transition-all"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Пароль</label>
            <input
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 dark:text-white placeholder-gray-400 transition-all"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full py-4 text-lg font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform"
            loading={loading}
          >
            {isReg ? 'Зарегистрироваться' : 'Войти'}
          </Button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {isReg ? 'Уже есть аккаунт?' : 'Впервые здесь?'}
          </div>
          <button
            onClick={() => setIsReg(!isReg)}
            className="text-blue-600 dark:text-blue-400 font-black hover:underline text-lg transition-colors"
          >
            {isReg ? 'Войти в систему' : 'Создать аккаунт'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}