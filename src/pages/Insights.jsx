import React, { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Lightbulb, Wallet } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';

export default function Insights() {
    // 1. Используем селекторы для подписки только на нужные части стора
    const fetchInsights = useFinanceStore(s => s.fetchInsights);
    const insights = useFinanceStore(s => s.insightsData);
    const isLoading = useFinanceStore(s => s.isInsightsLoading);

    // 2. Загружаем данные при первом рендере компонента
    useEffect(() => {
        // Загружаем данные только если их еще нет в сторе
        if (!insights) {
            fetchInsights();
        }
    }, [fetchInsights, insights]);

    const formatCurrency = (val) => new Intl.NumberFormat('uz-UZ').format(Math.round(val || 0));

    // 3. Добавляем состояние загрузки для лучшего UX
    if (isLoading || !insights) {
        return (
            <div className="space-y-6 animate-fade-in pb-20">
                <SkeletonLoader type="text" count={2} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonLoader type="card" count={2} />
                </div>
                <SkeletonLoader type="chart" />
            </div>
        );
    }

    // 4. Используем готовые, посчитанные на сервере данные
    const { thisMonthExpenses, lastMonthExpenses, topCategories } = insights;

    return (
        <div className="space-y-6 animate-fade-in pb-20 custom-scrollbar">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <Lightbulb size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900">Инсайты</h1>
                    <p className="text-zinc-500">Умная аналитика ваших финансов</p>
                </div>
            </div>

            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="space-y-2">
                    <div className="text-zinc-500 text-sm font-bold uppercase flex items-center gap-2">
                        <Activity size={16} strokeWidth={2.5} /> Расходы (Этот месяц)
                    </div>
                    <div className="text-2xl font-black text-zinc-900">{formatCurrency(thisMonthExpenses)}</div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${thisMonthExpenses > lastMonthExpenses ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {thisMonthExpenses > lastMonthExpenses ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                        {`${formatCurrency(Math.abs(thisMonthExpenses - lastMonthExpenses))} разница с прошлым месяцем`}
                    </div>
                </GlassCard>
                <GlassCard className="space-y-2 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white" hover={false}>
                    <div className="text-indigo-100 text-sm font-bold uppercase flex items-center gap-2">
                        <Wallet size={16} strokeWidth={2.5} /> Совет дня
                    </div>
                    <p className="text-sm text-indigo-200 font-medium">
                        Проанализируйте топ-5 категорий расходов. Возможно, есть потенциал для экономии на второстепенных тратах.
                    </p>
                </GlassCard>
            </div>

            {/* TRENDS */}
            <GlassCard className="p-6">
                <h3 className="font-bold mb-6 text-lg text-zinc-900">Топ-5 категорий расходов в этом месяце</h3>
                <div className="space-y-4">
                    {(topCategories || []).map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between group p-2 hover:bg-zinc-50 rounded-xl transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl border border-zinc-200">
                                    {cat.icon}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-zinc-900">{cat.name}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-zinc-900">{formatCurrency(cat.current)}</div>
                            </div>
                        </div>
                    ))}
                    {(!topCategories || topCategories.length === 0) && (
                        <p className="text-center text-zinc-400 py-4">Нет расходов в этом месяце.</p>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}