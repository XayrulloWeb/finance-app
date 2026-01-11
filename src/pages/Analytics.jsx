import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { eachDayOfInterval, format, subMonths, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TrendingUp, PieChart as PieIcon, Calendar, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

// Semantic Colors from CSS variables
const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#6366f1'];

export default function Analytics() {
    const store = useFinanceStore();
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ categoryId: '', amount: '' });
    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
    const [drilldownCategory, setDrilldownCategory] = useState(null);
    const [drilldownDate, setDrilldownDate] = useState(null);

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

    // Memoize Drilldown Data
    const drilldownData = useMemo(() => {
        return store.transactions
            .filter(t => {
                if (drilldownCategory) return t.category_id === drilldownCategory.id && t.type === 'expense';
                if (drilldownDate) return t.date.startsWith(drilldownDate);
                return false;
            })
            .slice(0, 50);
    }, [store.transactions, drilldownCategory, drilldownDate]);

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
                    <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><PieIcon strokeWidth={2.5} /></span>
                        Аналитика
                    </h1>
                    <p className="text-zinc-500 mt-1">Визуализация ваших финансов</p>
                </div>
            </div>

            {/* 1. MAIN CHARTS ROW */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* EXPENSE PIE CHART */}
                <GlassCard className="min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-zinc-900">
                        <PieIcon size={18} className="text-indigo-600" strokeWidth={2.5} /> Структура расходов
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
                                        onClick={(data) => {
                                            const cat = store.categories.find(c => c.name === data.name);
                                            if (cat) {
                                                // Trigger modal with transactions for this category in current month
                                                // We will need a generic TransactionListModal or filter History?
                                                // For now, let's filter History by redirecting? 
                                                // Or better: Show a dedicated modal here.
                                                // Let's implement a simple modal state for drilldown.
                                                setDrilldownCategory(cat);
                                                setIsDrilldownOpen(true);
                                            }
                                        }}
                                        className="cursor-pointer outline-none focus:outline-none"
                                    >
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val) + ' UZS'}
                                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', color: '#18181b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#18181b' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">Нет данных</div>
                        )}
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-xs text-zinc-400 font-bold uppercase">Всего</div>
                                <div className="text-xl font-black text-zinc-900 mt-8">{formatCurrency(expenseData.reduce((s, i) => s + i.value, 0))}</div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* TREND AREA CHART */}
                <GlassCard className="min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-zinc-900">
                        <TrendingUp size={18} className="text-emerald-500" strokeWidth={2.5} /> Динамика за 30 дней
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={trendData}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        const dateStr = data.activePayload[0].payload.date; // "YYYY-MM-DD"
                                        setDrilldownCategory(null);
                                        setDrilldownDate(dateStr);
                                        setIsDrilldownOpen(true);
                                    }
                                }}
                                className="cursor-pointer"
                            >
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#18181b' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Доход" />
                                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Расход" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* 2. BUDGETS SECTION */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900"><CheckCircle className="text-indigo-600" strokeWidth={2.5} /> Бюджеты</h2>
                    <Button size="sm" onClick={() => setIsBudgetModalOpen(true)} icon={Plus}>Добавить</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {store.budgets
                        .map(b => {
                            const cat = store.categories.find(c => c.id === b.category_id);
                            if (!cat) return null;
                            const progress = store.getBudgetProgress(cat.id);
                            return { ...b, cat, progress };
                        })
                        .filter(b => b && b.progress)
                        .sort((a, b) => b.progress.percent - a.progress.percent) // Sort by usage descending
                        .map(b => (
                            <GlassCard key={b.id} className="relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{b.cat.icon}</div>
                                        <div>
                                            <div className="font-bold text-zinc-900">{b.cat.name}</div>
                                            <div className="text-xs text-zinc-500">Лимит: {formatCurrency(b.amount)}</div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${b.progress.isOver ? 'text-error' : 'text-success'}`}>
                                        {Math.round(b.progress.percent)}%
                                    </div>
                                </div>

                                <div className="h-3 bg-zinc-100 rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(b.progress.percent, 100)}%` }}
                                        className={`h-full ${b.progress.isOver ? 'bg-error' : 'bg-success'}`}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-medium text-zinc-500 mb-2">
                                    <span>{formatCurrency(b.progress.spent)}</span>
                                    <span>Ост. {formatCurrency(b.progress.remaining)}</span>
                                </div>

                                {/* EDIT/DELETE ACTIONS */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setBudgetForm({ categoryId: b.category_id, amount: b.amount }); setIsBudgetModalOpen(true); }}
                                        className="p-1.5 bg-white shadow-sm border border-zinc-200 rounded-lg text-zinc-400 hover:text-indigo-600"
                                    >
                                        <div className="w-4 h-4">✎</div>
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm('Удалить бюджет?')) {
                                                const { error } = await store.deleteBudget(b.id);
                                            }
                                        }}
                                        className="p-1.5 bg-white shadow-sm border border-zinc-200 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500"
                                    >
                                        <div className="w-4 h-4">✕</div>
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    {store.budgets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-400 bg-white/50 rounded-2xl border-2 border-dashed border-zinc-300">
                            <Plus className="mx-auto mb-2 opacity-50" strokeWidth={1} />
                            <p>Настройте бюджеты, чтобы контролировать расходы</p>
                        </div>
                    )}
                </div>
            </section >

            {/* 3. TOP EXPENSES LIST */}
            < section >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-900"><AlertTriangle className="text-amber-500" strokeWidth={2.5} /> Топ расходов</h2>
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-2 border border-white/60 shadow-xl shadow-indigo-500/5">
                    {expenseData.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition-colors cursor-default">
                            <div className="flex items-center gap-4">
                                <div className="font-black text-zinc-400 w-6 text-center">#{idx + 1}</div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                                    {store.categories.find(c => c.name === item.name)?.icon || '💸'}
                                </div>
                                <span className="font-bold text-zinc-700">{item.name}</span>
                            </div>
                            <div className="font-black text-zinc-900 tabular-nums">
                                {formatCurrency(item.value)}
                            </div>
                        </div>
                    ))}
                </div>
            </section >

            {/* MODAL: ADD BUDGET */}
            < Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)
            } title="Настроить бюджет" >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Категория</label>
                        <select
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm"
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
                        <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Лимит суммы (в месяц)</label>
                        <input
                            type="number"
                            placeholder="Например: 1 000 000"
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm"
                            value={budgetForm.amount}
                            onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                        />
                    </div>
                    <Button onClick={handleSaveBudget} className="w-full py-4 text-lg bg-primary hover:bg-primary/90">Сохранить бюджет</Button>
                </div>
            </Modal >

            {/* MODAL: DRILLDOWN (Category or Date) */}
            <Modal isOpen={isDrilldownOpen} onClose={() => setIsDrilldownOpen(false)} title={drilldownCategory ? `История: ${drilldownCategory.name}` : `История: ${drilldownDate ? format(new Date(drilldownDate), 'd MMMM', { locale: ru }) : ''}`}>
                <div className="max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {drilldownData.map(t => {
                        const cat = store.categories.find(c => c.id === t.category_id);
                        return (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-white border border-zinc-100 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{cat?.icon || '📄'}</div>
                                    <div>
                                        <div className="text-zinc-900 font-bold">{t.comment || cat?.name || 'Без названия'}</div>
                                        <div className="text-xs text-zinc-400">{format(new Date(t.date), 'd MMM HH:mm', { locale: ru })}</div>
                                    </div>
                                </div>
                                <div className={`font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-zinc-900'}`}>
                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                </div>
                            </div>
                        );
                    })
                    }
                    {((drilldownCategory && store.transactions.filter(t => t.category_id === drilldownCategory.id).length === 0) ||
                        (drilldownDate && store.transactions.filter(t => t.date.startsWith(drilldownDate)).length === 0)) && (
                            <div className="text-center text-zinc-400 py-10">Нет операций</div>
                        )}
                </div>
            </Modal >
        </div >
    );
}