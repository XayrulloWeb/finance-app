import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useFinanceStore } from './store/useFinanceStore';
import { supabase } from './supabaseClient';

// Импорт страниц
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Counterparties from './pages/Counterparties';
import Settings from './pages/Settings';
import History from './pages/History';

// Компонент загрузчика (можно вынести в отдельный файл)
const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function App() {
  // Достаем новый флаг isAuthChecked
  const { user, checkUser, isAuthChecked } = useFinanceStore();

  useEffect(() => {
    // 1. Запускаем проверку при загрузке
    checkUser();

    // 2. Слушаем изменения (вход/выход/обновление токена)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Если произошло событие входа или выхода, обновляем состояние
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        await checkUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ВАЖНО: Пока проверка не прошла, показываем лоадер, а не экран входа!
  if (!isAuthChecked) {
    return <FullScreenLoader />;
  }

  // Если проверки прошли и юзера нет -> экран входа
  if (!user) {
    return <LoginScreen />;
  }

  // Если юзер есть -> приложение
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="counterparties" element={<Counterparties />} />
          <Route path="settings" element={<Settings />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
// --- ИСПРАВЛЕННЫЙ КОМПОНЕНТ ВХОДА ---
function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isReg, setIsReg] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;

      // ВАЖНО: Вызываем функции напрямую, чтобы не терять контекст!
      if (isReg) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      const { data, error: authError } = result;

      if (authError) {
        // Понятные сообщения об ошибках
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('❌ Этот email уже зарегистрирован! Попробуй войти.');
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('❌ Неверный email или пароль!');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('❌ Подтверди email! Проверь почту.');
        } else {
          setError(`❌ Ошибка: ${authError.message}`);
        }
      } else if (isReg) {
        // Успешная регистрация
        // Проверяем нужно ли подтверждение email
        if (data.user && !data.session) {
          // Email confirmation требуется
          setSuccess('✅ Регистрация успешна! Проверь почту для подтверждения.');
        } else {
          // Автоматический вход после регистрации
          setSuccess('✅ Регистрация успешна! Теперь можешь войти.');
        }
        setIsReg(false); // Переключаем на вкладку входа
        setEmail('');
        setPassword('');
      } else {
        setSuccess('✅ Вход успешен!');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(`❌ Ошибка: ${err.message || 'Что-то пошло не так'}`);
    } finally {
      // ВАЖНО: всегда выключаем loading
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-3xl font-bold mb-2">Finance Empire</h1>
        <p className="text-gray-400 mb-6">Управляй своими деньгами</p>

        {/* Сообщения об ошибках */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Сообщения об успехе */}
        {success && (
          <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-xl text-green-200 text-sm animate-fade-in">
            {success}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 bg-gray-800 rounded-xl outline-none focus:ring-2 ring-blue-600 transition"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="w-full p-4 bg-gray-800 rounded-xl outline-none focus:ring-2 ring-blue-600 transition"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition flex justify-center"
          >
            {loading ? 'Загрузка...' : (isReg ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <button
          onClick={() => {
            setIsReg(!isReg);
            setError('');
            setSuccess('');
          }}
          className="mt-6 text-sm text-gray-400 w-full text-center hover:text-white transition"
        >
          {isReg ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
        </button>
      </div>
    </div>
  );
}