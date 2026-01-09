import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subMonths, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import GlassCard from '../components/ui/GlassCard'; // Updated to GlassCard
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TrendingUp, PieChart as PieIcon, Calendar, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

// Premium Colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export default function Analytics() {
    const store = useFinanceStore();
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ categoryId: '', amount: '' });

    // --- DATA PREPARATION ---

    // 1. Expense Breakdown (Pie Chart)
    const expenseData = useMemo(() => {
        return store.categories
            .filter(c => c.type === 'expense')
            .map(c => {
                const amount = store.transactions
                    .filter(t => t.category_id === c.id && t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                return { name: c.name, value: amount, color: c.color || '#ccc' };
            })
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [store.categories, store.transactions]);

    // 2. Spending Trend (Area Chart - Last 30 Days)
    const trendData = useMemo(() => {
        const today = new Date();
        const start = subMonths(today, 1);
        const days = eachDayOfInterval({ start, end: today });

        return days.map(day => {
            const income = store.transactions
                .filter(t => t.type === 'income' && isSameDay(new Date(t.date), day))
                .reduce((sum, t) => sum + t.amount, 0);
            const expense = store.transactions
                .filter(t => t.type === 'expense' && isSameDay(new Date(t.date), day))
                .reduce((sum, t) => sum + t.amount, 0);
            return {
                date: format(day, 'd MMM', { locale: ru }),
                income,
                expense
            };
        });
    }, [store.transactions]);

    // Handlers
    const handleSaveBudget = async () => {
        if (!budgetForm.categoryId || !budgetForm.amount) return;
        await store.saveBudget(budgetForm.categoryId, budgetForm.amount);
        setIsBudgetModalOpen(false);
        setBudgetForm({ categoryId: '', amount: '' });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('uz-UZ').format(val);

    return (
        <div className="space-y-8 pb-24 animate-fade-in custom-scrollbar">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><PieIcon /></span>
                        Аналитика
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Визуализация ваших финансов</p>
                </div>
            </div>

            {/* 1. MAIN CHARTS ROW */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* EXPENSE PIE CHART */}
                <GlassCard className="min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <PieIcon size={18} className="text-blue-500" /> Структура расходов
                    </h3>
                    <div className="flex-1 w-full relative">
                        {expenseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val) + ' UZS'}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">Нет данных</div>
                        )}
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-xs text-gray-400 font-bold uppercase">Всего</div>
                                <div className="text-xl font-black">{formatCurrency(expenseData.reduce((s, i) => s + i.value, 0))}</div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* TREND AREA CHART */}
                <GlassCard className="min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-500" /> Динамика за 30 дней
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none' }}
                                    formatter={(val) => formatCurrency(val)}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Доход" />
                                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Расход" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* 2. BUDGETS SECTION */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="text-purple-500" /> Бюджеты</h2>
                    <Button size="sm" onClick={() => setIsBudgetModalOpen(true)} icon={Plus}>Добавить</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {store.budgets.map(b => {
                        const cat = store.categories.find(c => c.id === b.category_id);
                        if (!cat) return null;

                        const progress = store.getBudgetProgress(cat.id);
                        if (!progress) return null;

                        return (
                            <GlassCard key={b.id} className="relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{cat.icon}</div>
                                        <div>
                                            <div className="font-bold">{cat.name}</div>
                                            <div className="text-xs text-gray-400">Лимит: {formatCurrency(b.amount)}</div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${progress.isOver ? 'text-red-500' : 'text-green-500'}`}>
                                        {Math.round(progress.percent)}%
                                    </div>
                                </div>

                                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(progress.percent, 100)}%` }}
                                        className={`h-full ${progress.isOver ? 'bg-red-500' : 'bg-green-500'}`}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-medium text-gray-500">
                                    <span>{formatCurrency(progress.spent)}</span>
                                    <span>Ост. {formatCurrency(progress.remaining)}</span>
                                </div>
                            </GlassCard>
                        );
                    })}
                    {store.budgets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <Plus className="mx-auto mb-2 opacity-50" />
                            <p>Настройте бюджеты, чтобы контролировать расходы</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 3. TOP EXPENSES LIST */}
            <section>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><AlertTriangle className="text-orange-500" /> Топ расходов</h2>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-2">
                    {expenseData.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors cursor-default">
                            <div className="flex items-center gap-4">
                                <div className="font-black text-gray-400 w-6 text-center">#{idx + 1}</div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                                    {store.categories.find(c => c.name === item.name)?.icon || '💸'}
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
                            </div>
                            <div className="font-black text-gray-900 dark:text-white">
                                {formatCurrency(item.value)}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MODAL: ADD BUDGET */}
            <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Настроить бюджет">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Категория</label>
                        <select
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                            value={budgetForm.categoryId}
                            onChange={e => setBudgetForm({ ...budgetForm, categoryId: e.target.value })}
                        >
                            <option value="">Выберите категорию</option>
                            {store.categories.filter(c => c.type === 'expense').map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Лимит суммы (в месяц)</label>
                        <input
                            type="number"
                            placeholder="Например: 1 000 000"
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                            value={budgetForm.amount}
                            onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                        />
                    </div>
                    <Button onClick={handleSaveBudget} className="w-full py-4 text-lg">Сохранить бюджет</Button>
                </div>
            </Modal>
        </div>
    );
}