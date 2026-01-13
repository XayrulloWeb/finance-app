import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from '../components/ui/Toast';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isReg, setIsReg] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = isReg
                ? await supabase.auth.signUp({ email, password })
                : await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;
            toast.success(isReg ? 'Регистрация успешна! Проверьте почту.' : 'С возвращением!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-300">
            <GlassCard className="w-full max-w-md p-8 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 shadow-2xl relative overflow-hidden">
                {/* Background blobs */}
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