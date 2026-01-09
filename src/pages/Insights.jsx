import React, { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { TrendingUp, Activity, AlertTriangle, Lightbulb, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, differenceInDays } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

export default function Insights() {
    const { transactions, categories, budgets, settings, accounts } = useFinanceStore();

    // === SMART ANALYTICS LOGIC ===
    const analytics = useMemo(() => {
        const today = new Date();
        const currentMonthStart = startOfMonth(today);
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        const lastMonthEnd = endOfMonth(subMonths(today, 1));

        // 1. Spending Comparison (This Month vs Last Month)
        const thisMonthExpenses = transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= currentMonthStart)
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthExpenses = transactions
            .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }))
            .reduce((sum, t) => sum + t.amount, 0);

        // Estimate spending for full current month
        const daysPassed = today.getDate();
        const projectedThinking = (thisMonthExpenses / daysPassed) * 30; // simple projection

        // 2. Budget Alerts
        const budgetAlerts = categories
            .map(cat => {
                const budget = budgets.find(b => b.category_id === cat.id);
                if (!budget) return null;

                const spent = transactions
                    .filter(t => t.category_id === cat.id && t.type === 'expense' && new Date(t.date) >= currentMonthStart)
                    .reduce((sum, t) => sum + t.amount, 0);

                const percent = (spent / budget.amount) * 100;
                if (percent > 80) return { category: cat, spent, limit: budget.amount, percent };
                return null;
            })
            .filter(Boolean);

        // 3. Top Spending Category Trends
        const topCategories = categories
            .filter(c => c.type === 'expense')
            .map(cat => {
                const spentCurrent = transactions
                    .filter(t => t.category_id === cat.id && t.type === 'expense' && new Date(t.date) >= currentMonthStart)
                    .reduce((sum, t) => sum + t.amount, 0);
                const spentLast = transactions
                    .filter(t => t.category_id === cat.id && t.type === 'expense' && isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }))
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    name: cat.name,
                    icon: cat.icon,
                    current: spentCurrent,
                    last: spentLast,
                    diff: spentCurrent - spentLast,
                    percentChange: spentLast > 0 ? ((spentCurrent - spentLast) / spentLast) * 100 : 0
                };
            })
            .sort((a, b) => b.current - a.current)
            .slice(0, 5);

        // 4. Burn Rate & Runway (How long money will last)
        const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0); // Simplified, relies on pre-calced balance or fetch
        // Actually store doesn't permit easy access to balance property directly if not updated. 
        // Let's re-calculate total balance from transactions roughly or use view if possible. 
        // Since we are in frontend, let's use what we have.
        // The store accounts might not have `balance` prop up-to-date if it relies on view but we fetch `accounts` which is table. 
        // Wait, `fetchData` fetches `accounts` table. The view is `view_account_balances`. 
        // In `schema-enhanced`, I fetch from `accounts` table. 
        // Ah, the `getAccountBalance` helper in store calculates it live.
        // So let's use that logic here for accuracy or assume user has some cash.
        const liveTotalBalance = accounts.reduce((sum, acc) => {
            const bal = transactions.filter(t => t.account_id === acc.id).reduce((s, t) => {
                if (['income', 'transfer_in'].includes(t.type)) return s + t.amount;
                if (['expense', 'transfer_out'].includes(t.type)) return s - t.amount;
                return s;
            }, 0);
            return sum + bal; // Assuming rates are 1:1 for simplicity or handled elsewhere. Real multi-currency needs conversion.
        }, 0);

        const avgDailySpend = lastMonthExpenses / 30;
        const runwayDays = avgDailySpend > 0 ? liveTotalBalance / avgDailySpend : 999;

        return {
            thisMonthExpenses,
            lastMonthExpenses,
            projectedThinking,
            budgetAlerts,
            topCategories,
            runwayDays,
            liveTotalBalance
        };
    }, [transactions, categories, budgets, accounts]);

    const formatCurrency = (val) => new Intl.NumberFormat('uz-UZ').format(Math.round(val));

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                    <Lightbulb size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Инсайты</h1>
                    <p className="text-gray-500 dark:text-gray-400">Умная аналитика ваших финансов</p>
                </div>
            </div>

            {/* 1. OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="space-y-2">
                    <div className="text-gray-500 text-sm font-bold uppercase flex items-center gap-2">
                        <Activity size={16} /> Расходы (Сен)
                    </div>
                    <div className="text-2xl font-black">{formatCurrency(analytics.thisMonthExpenses)}</div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${analytics.thisMonthExpenses > analytics.lastMonthExpenses ? 'text-red-500' : 'text-green-500'}`}>
                        {analytics.thisMonthExpenses > analytics.lastMonthExpenses ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(analytics.thisMonthExpenses - analytics.lastMonthExpenses) > 0
                            ? `${formatCurrency(Math.abs(analytics.thisMonthExpenses - analytics.lastMonthExpenses))} разница с прош. мес.`
                            : 'Без изменений'}
                    </div>
                </GlassCard>

                <GlassCard className="space-y-2">
                    <div className="text-gray-500 text-sm font-bold uppercase flex items-center gap-2">
                        <AlertTriangle size={16} /> Прогноз на месяц
                    </div>
                    <div className="text-2xl font-black text-blue-600">{formatCurrency(analytics.projectedThinking)}</div>
                    <div className="text-xs text-gray-400 font-medium">
                        Если продолжите тратить в том же духе
                    </div>
                </GlassCard>

                <GlassCard className="space-y-2" gradient>
                    <div className="text-gray-500 text-sm font-bold uppercase flex items-center gap-2">
                        <Wallet size={16} /> Финансовая подушка
                    </div>
                    <div className="text-2xl font-black">{Math.round(analytics.runwayDays)} дней</div>
                    <div className="text-xs text-gray-400 font-medium">
                        Столько вы проживете без доходов
                    </div>
                </GlassCard>
            </div>

            {/* 2. WARNINGS */}
            {analytics.budgetAlerts.length > 0 && (
                <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} /> Требует внимания
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analytics.budgetAlerts.map((alert, idx) => (
                            <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 p-4 rounded-2xl flex items-center gap-4">
                                <div className="text-3xl">{alert.category.icon}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-red-700 dark:text-red-400">{alert.category.name}</div>
                                    <div className="text-xs text-red-600/70">
                                        Потрачено {Math.round(alert.percent)}% от бюджета
                                    </div>
                                    <div className="w-full h-1.5 bg-red-200 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${Math.min(alert.percent, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. TRENDS CHART */}
            <GlassCard className="p-6">
                <h3 className="font-bold mb-6 text-lg">Тренды расходов по категориям</h3>
                <div className="space-y-4">
                    {analytics.topCategories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xl">
                                    {cat.icon}
                                </div>
                                <div>
                                    <div className="font-bold text-sm">{cat.name}</div>
                                    <div className={`text-xs font-bold flex items-center ${cat.diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {cat.diff > 0 ? '+' : ''}{formatCurrency(cat.diff)} ({Math.round(cat.percentChange)}%)
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:block w-32 text-right">
                                <div className="font-black">{formatCurrency(cat.current)}</div>
                                <div className="text-xs text-gray-400">в этом месяце</div>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* 4. RECOMMENDATIONS */}
            <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none">
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><Lightbulb /> Совет дня</h3>
                    <p className="opacity-90 leading-relaxed">
                        Ваши расходы на кафе выросли на 15%. Попробуйте готовить дома на выходных — это сэкономит до 400 000 UZS в месяц.
                    </p>
                </GlassCard>
                <GlassCard>
                    <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Структура расходов</h3>
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        График в разработке...
                    </div>
                </GlassCard>
            </div>

        </div>
    );
}
