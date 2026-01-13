import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ChevronRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { useFinanceStore } from '../../store/useFinanceStore';

export default function MonthlyStats() {
    const store = useFinanceStore();
    const isPrivacy = store.settings.isPrivacyEnabled;

    const stats = [
        {
            label: 'Доходы',
            value: store.getMonthlyIncome(),
            icon: TrendingUp,
            color: 'success', // text-success, bg-success/10
            delay: 0.1
        },
        {
            label: 'Расходы',
            value: store.getMonthlyExpense(),
            icon: TrendingDown,
            color: 'error',
            delay: 0.2
        },
        {
            label: 'Баланс',
            value: store.getMonthlyProfit(),
            icon: Wallet,
            color: store.getMonthlyProfit() >= 0 ? 'success' : 'error',
            delay: 0.3,
            prefix: store.getMonthlyProfit() >= 0 ? '+' : ''
        },
        {
            label: 'Бюджеты',
            value: `${store.getBudgetCompletion()}%`, // Special case for string
            icon: ChevronRight,
            color: 'indigo',
            delay: 0.4,
            isPercent: true
        }
    ];

    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: stat.delay }}
                >
                    <GlassCard className={`group transition-all hover:border-${stat.color === 'indigo' ? 'indigo-500' : stat.color}/50`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-1.5 rounded-lg ${stat.color === 'indigo' ? 'bg-indigo-500/10' : stat.color === 'success' ? 'bg-success/10' : 'bg-error/10'}`}>
                                <stat.icon size={14} className={stat.color === 'indigo' ? 'text-indigo-600' : stat.color === 'success' ? 'text-success' : 'text-error'} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className={`text-2xl font-black tabular-nums ${stat.color === 'indigo' ? 'text-indigo-600' : stat.color === 'success' ? 'text-success' : stat.color === 'error' ? 'text-error' : 'text-zinc-900'}`}>
                            {isPrivacy ? (stat.isPercent ? '••' : '•••••') : (
                                stat.isPercent ? stat.value : `${stat.prefix || ''}${new Intl.NumberFormat('ru-RU').format(Math.round(stat.value))}`
                            )}
                        </div>
                        {!stat.isPercent && <div className="text-[10px] font-bold text-zinc-400 mt-1">За этот месяц</div>}
                        {stat.isPercent && <div className="text-[10px] font-bold text-zinc-400 mt-1">Среднее выполнение</div>}
                    </GlassCard>
                </motion.div>
            ))}
        </section>
    );
}