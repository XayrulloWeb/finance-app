import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useTranslation } from 'react-i18next';

export default function BalanceCard() {
    const { t, i18n } = useTranslation();
    const { settings, togglePrivacy, getTotalBalanceInBaseCurrency, getIncomeByPeriod, getExpenseByPeriod } = useFinanceStore();

    const totalBalance = getTotalBalanceInBaseCurrency ? getTotalBalanceInBaseCurrency() : 0;
    const isPrivacy = settings.isPrivacyEnabled;
    const currency = settings.base_currency;

    const formatNumber = (val) => new Intl.NumberFormat(i18n.language === 'ru' ? 'ru-RU' : 'en-US').format(Math.round(val || 0));

    return (
        <GlassCard
            gradient
            className="relative overflow-hidden min-h-[220px] flex flex-col justify-center text-white p-8 shadow-2xl shadow-indigo-500/20"
        >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 opacity-90">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                            <Wallet size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold tracking-wider uppercase">{t('dashboard.balance_card.total_capital')}</span>
                    </div>
                    <button onClick={togglePrivacy} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        {isPrivacy ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl sm:text-6xl font-black mb-6 tracking-tight tabular-nums"
                >
                    {isPrivacy ? '••••••' : formatNumber(totalBalance)}
                    <span className="text-3xl opacity-60 ml-3 font-bold">{currency}</span>
                </motion.div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-success/20 rounded-lg border border-success/30 backdrop-blur-md">
                        <TrendingUp size={16} className="text-success" strokeWidth={2.5} />
                        <span className="text-emerald-100 font-bold text-sm tabular-nums">
                            {isPrivacy ? '•••' : `+${formatNumber(getIncomeByPeriod('today'))}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-error/20 rounded-lg border border-error/30 backdrop-blur-md">
                        <TrendingDown size={16} className="text-error" strokeWidth={2.5} />
                        <span className="text-rose-100 font-bold text-sm tabular-nums">
                            {isPrivacy ? '•••' : `-${formatNumber(getExpenseByPeriod('today'))}`}
                        </span>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}