import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Wallet } from 'lucide-react';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            toast.success(isReg ? 'Проверьте почту!' : 'С возвращением!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col justify-center p-6 relative overflow-hidden bg-[#f3f4f6]">
            {/* Декоративные мягкие блики из вашего CSS */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[30%] bg-amber-50/40 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="w-full max-w-sm mx-auto"
            >
                {/* Логотип */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-white shadow-xl rounded-[20px] flex items-center justify-center mb-6 border border-white">
                        <Wallet className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-center">Finance Empire</h1>
                    <p className="mt-2 text-zinc-500 font-medium text-center">
                        {isReg ? 'Создайте свой цифровой капитал' : 'Ваши активы под контролем'}
                    </p>
                </div>

                {/* Основная карточка (используем ваш .glass-panel) */}
                {/* Поле Email */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                        Электронная почта
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                            <Mail className="w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type="email"
                            placeholder="name@empire.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="!pl-12 w-full py-4 bg-white border border-zinc-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
                        />
                    </div>
                </div>

                {/* Поле Пароль */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                        Пароль
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                            <Lock className="w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="!pl-12 !pr-12 w-full py-4 bg-white border border-zinc-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-indigo-600 transition-colors z-10"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Футер формы */}
                <div className="mt-10 text-center">
                    <p className="text-zinc-500 font-medium">
                        {isReg ? 'Уже в системе?' : 'Новый участник?'}
                    </p>
                    <button
                        onClick={() => setIsReg(!isReg)}
                        className="mt-2 text-zinc-900 font-bold text-lg hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                    >
                        {isReg ? 'Войти в аккаунт' : 'Создать профиль'}
                    </button>
                </div>

                <p className="text-center mt-12 text-[10px] text-zinc-400 uppercase tracking-[0.3em] font-bold">
                    © 2024 FINANCE EMPIRE PLATINUM
                </p>
            </motion.div>
        </div>
    );
}