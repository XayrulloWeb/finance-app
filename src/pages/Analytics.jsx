import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { eachDayOfInterval, format, subDays, isSameDay, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TrendingUp, PieChart as PieIcon, Calculator, ArrowUpRight, ArrowDownRight, Wallet, Target, CreditCard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Semantic Colors (Deep & Rich) ---
const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#64748b'];

// --- Components ---

const SummaryWidget = ({ title, amount, icon: Icon, trend, colorClass, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <GlassCard className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-zinc-500 font-bold text-sm uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight font-money">{amount}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 backdrop-blur-md`}>
                    <Icon size={24} className={colorClass.replace('bg-', 'text-')} strokeWidth={2.5} />
                </div>
            </div>
            {/* Background Blob */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${colorClass} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
        </GlassCard>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label, currency }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-xl shadow-indigo-500/10">
                <p className="font-bold text-zinc-400 text-xs mb-1 uppercase tracking-wide">{label}</p>
                {payload.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
                        <span className="font-bold text-zinc-800 text-lg font-money">
                            {new Intl.NumberFormat('ru-RU').format(p.value)} <span className="text-xs text-zinc-400">{currency}</span>
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Analytics() {
    const store = useFinanceStore();

    // UI State
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ categoryId: '', amount: '' });
    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
    const [drilldownCategory, setDrilldownCategory] = useState(null);
    const [drilldownDate, setDrilldownDate] = useState(null);

    // Helpers
    const currency = store.settings?.base_currency || 'UZS';
    const formatCurrency = (val) => new Intl.NumberFormat('ru-RU').format(Math.round(val));

    // --- DATA PREPARATION ---

    // 1. Totals (Current Month)
    const totals = useMemo(() => {
        if (!store.transactions) return { income: 0, expense: 0, savings: 0 };
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const monthlyTxs = store.transactions.filter(t => {
            const d = parseISO(t.date);
            return isValid(d) && d >= start && d <= end;
        });

        const income = monthlyTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthlyTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        return { income, expense, savings: income - expense };
    }, [store.transactions]);

    // 2. Expense Structure (Pie)
    const expenseData = useMemo(() => {
        if (!store.categories || !store.transactions) return [];
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return store.categories
            .filter(c => c.type === 'expense')
            .map(c => {
                const amount = store.transactions
                    .filter(t => {
                        const tDate = parseISO(t.date);
                        return t.category_id === c.id && t.type === 'expense' && isValid(tDate) && tDate >= start && tDate <= end;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
                return { name: c.name, value: amount, color: c.color, icon: c.icon, id: c.id };
            })
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [store.categories, store.transactions]);

    // 3. Trend (Area)
    const trendData = useMemo(() => {
        if (!store.transactions) return [];
        const today = new Date();
        const start = subDays(today, 30);
        const days = eachDayOfInterval({ start, end: today });

        return days.map(day => {
            const dayTxs = store.transactions.filter(t => {
                const tDate = parseISO(t.date);
                return isValid(tDate) && isSameDay(tDate, day);
            });
            return {
                date: format(day, 'd MMM', { locale: ru }),
                fullDate: format(day, 'yyyy-MM-dd'),
                income: dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                expense: dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            };
        });
    }, [store.transactions]);

    // 4. Drilldown List
    const drilldownData = useMemo(() => {
        if (!store.transactions) return [];
        return store.transactions
            .filter(t => {
                const tDate = parseISO(t.date);
                if (!isValid(tDate)) return false;
                if (drilldownCategory) {
                    const now = new Date();
                    return t.category_id === drilldownCategory.id && t.type === 'expense' && tDate >= startOfMonth(now) && tDate <= endOfMonth(now);
                }
                if (drilldownDate) return isSameDay(tDate, parseISO(drilldownDate));
                return false;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort newest first
            .slice(0, 50);
    }, [store.transactions, drilldownCategory, drilldownDate]);

    // Handlers
    const handleSaveBudget = async () => {
        if (!budgetForm.categoryId || !budgetForm.amount) return;
        await store.saveBudget(budgetForm.categoryId, budgetForm.amount);
        setIsBudgetModalOpen(false);
        setBudgetForm({ categoryId: '', amount: '' });
    };

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-600 mb-2">
                        Аналитика
                    </h1>
                    <p className="text-zinc-500 font-medium">Финансовый пульс за этот месяц</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Текущий баланс</div>
                    <div className="text-2xl font-black text-indigo-600 font-money">
                        {formatCurrency(store.accounts.reduce((sum, a) => sum + a.balance, 0))} <span className="text-sm">{currency}</span>
                    </div>
                </div>
            </div>

            {/* 1. SUMMARY WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryWidget
                    title="Доходы"
                    amount={`+${formatCurrency(totals.income)}`}
                    icon={ArrowUpRight}
                    colorClass="text-emerald-500 bg-emerald-500"
                    delay={0.1}
                />
                <SummaryWidget
                    title="Расходы"
                    amount={`-${formatCurrency(totals.expense)}`}
                    icon={ArrowDownRight}
                    colorClass="text-rose-500 bg-rose-500"
                    delay={0.2}
                />
                <SummaryWidget
                    title="Накопления"
                    amount={`${totals.savings >= 0 ? '+' : ''}${formatCurrency(totals.savings)}`}
                    icon={Wallet}
                    colorClass={totals.savings >= 0 ? "text-indigo-500 bg-indigo-500" : "text-amber-500 bg-amber-500"}
                    delay={0.3}
                />
            </div>

            {/* 2. MAIN BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LARGE: SPEND TREND */}
                <GlassCard className="col-span-1 lg:col-span-2 min-h-[450px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-xl text-zinc-900 flex items-center gap-2">
                                <TrendingUp className="text-indigo-600" size={20} />
                                Динамика
                            </h3>
                            <p className="text-xs text-zinc-400 font-bold mt-1">Доходы и расходы за 30 дней</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} onMouseDown={(e) => {
                                if (e && e.activePayload) {
                                    setDrilldownDate(e.activePayload[0].payload.fullDate);
                                    setDrilldownCategory(null);
                                    setIsDrilldownOpen(true);
                                }
                            }}>
                                <defs>
                                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                    minTickGap={30}
                                />
                                <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    name="Доход"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    fill="url(#gradIncome)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    name="Расход"
                                    stroke="#f43f5e"
                                    strokeWidth={4}
                                    fill="url(#gradExpense)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* SMALL: CATEGORY PIE */}
                <GlassCard className="col-span-1 min-h-[450px] flex flex-col">
                    <div className="mb-6">
                        <h3 className="font-bold text-xl text-zinc-900 flex items-center gap-2">
                            <PieIcon className="text-purple-600" size={20} />
                            Структура
                        </h3>
                        <p className="text-xs text-zinc-400 font-bold mt-1">Куда уходят деньги?</p>
                    </div>

                    <div className="flex-1 relative">
                        {expenseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        onClick={(data) => {
                                            const cat = store.categories.find(c => c.name === data.name);
                                            if (cat) {
                                                setDrilldownCategory(cat);
                                                setDrilldownDate(null);
                                                setIsDrilldownOpen(true);
                                            }
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity stroke-white stroke-2" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip currency={currency} />} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 opacity-50">
                                <Wallet size={48} strokeWidth={1} />
                                <span className="mt-2 font-medium">Нет расходов</span>
                            </div>
                        )}

                        {/* Center Stats */}
                        {expenseData.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-zinc-900 font-money">{Math.round(totals.expense / (totals.income || 1) * 100)}%</div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">от дохода</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 max-h-32 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {expenseData.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                                    <span className="text-zinc-600 font-medium truncate max-w-[100px]">{item.name}</span>
                                </div>
                                <span className="font-bold text-zinc-900 font-money">{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* 3. BUDGETS & TOP EXPENSES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* BUDGETS */}
                <section>
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <Target className="text-rose-500" />
                            Бюджеты
                        </h2>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="text-xs !py-1.5 !px-3 rounded-lg border-dashed"
                        >
                            + Создать
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {store.budgets.length > 0 ? store.budgets.map(b => {
                            const cat = store.categories.find(c => c.id === b.category_id);
                            if (!cat) return null;
                            const progress = store.getBudgetProgress ? store.getBudgetProgress(cat.id) : { percent: 0, spent: 0, limit: b.amount, isOver: false, remaining: b.amount };

                            return (
                                <GlassCard key={b.id} className="!p-4 bg-white/60 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-6 z-10 relative">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
                                            {cat.icon}
                                        </div>
                                        <div onClick={() => { setBudgetForm({ categoryId: b.category_id, amount: b.amount }); setIsBudgetModalOpen(true); }} className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded-lg">
                                            <Calculator size={16} className="text-zinc-400" />
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <h4 className="font-bold text-zinc-900 mb-0.5">{cat.name}</h4>
                                        <div className="text-xs text-zinc-500 font-medium mb-3">Лимит: {formatCurrency(b.amount)}</div>

                                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(progress.percent, 100)}%` }}
                                                className={`h-full rounded-full ${progress.isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs font-bold">
                                            <span className={progress.isOver ? 'text-rose-600' : 'text-emerald-600'}>{progress.percent}%</span>
                                            <span className="text-zinc-400">{formatCurrency(progress.remaining)} ост.</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        }) : (
                            <div className="col-span-full border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-400 hover:border-indigo-300 hover:bg-indigo-50/10 transition-colors cursor-pointer" onClick={() => setIsBudgetModalOpen(true)}>
                                <Target className="mb-2 opacity-50" />
                                <span className="text-sm font-bold">Добавить бюджет</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* TOP EXPENSES */}
                <section>
                    <div className="flex items-center mb-4 px-2">
                        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <CreditCard className="text-amber-500" />
                            Топ траты
                        </h2>
                    </div>
                    <GlassCard className="!p-0 overflow-hidden">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {expenseData.slice(0, 10).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm">{item.name}</div>
                                            <div className="text-xs text-zinc-400 font-bold">{Math.round((item.value / totals.expense) * 100)}% от расходов</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-zinc-900 font-money">
                                        {formatCurrency(item.value)}
                                    </div>
                                </div>
                            ))}
                            {expenseData.length === 0 && <div className="p-8 text-center text-zinc-400 text-sm">Нет данных</div>}
                        </div>
                    </GlassCard>
                </section>
            </div>

            {/* MODALS */}

            <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Бюджет">
                <div className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Категория</label>
                        <select
                            className="w-full p-4 bg-zinc-50 border-none rounded-2xl font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Лимит</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full p-4 bg-zinc-50 border-none rounded-2xl font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 outline-none font-money"
                            value={budgetForm.amount}
                            onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                        />
                    </div>
                    <Button onClick={handleSaveBudget} className="w-full py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40">
                        Сохранить
                    </Button>
                </div>
            </Modal>

            <Modal
                isOpen={isDrilldownOpen}
                onClose={() => setIsDrilldownOpen(false)}
                title={drilldownCategory ? drilldownCategory.name : 'Детализация'}
            >
                <div className="max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar p-1">
                    {drilldownData.length > 0 ? drilldownData.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 transition-all border border-transparent hover:border-zinc-100">
                            <div>
                                <div className="font-bold text-zinc-900 text-sm">{t.comment || 'Без описания'}</div>
                                <div className="text-xs text-zinc-400 font-bold">{format(parseISO(t.date), 'd MMM HH:mm', { locale: ru })}</div>
                            </div>
                            <div className="font-bold text-zinc-900 font-money">
                                {formatCurrency(t.amount)}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-zinc-400 py-8 font-medium">Нет операций</div>
                    )}
                </div>
            </Modal>
        </div>
    );
}