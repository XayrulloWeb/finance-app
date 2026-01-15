import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowRightLeft, Plus, TrendingUp, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TransactionItem from '../components/TransactionItem';
import GlassCard from '../components/ui/GlassCard';
import { toast } from '../components/ui/Toast';
import SkeletonLoader from '../components/ui/SkeletonLoader';

// Components
import SmartAlerts from '../components/dashboard/SmartAlerts';
import BalanceCard from '../components/dashboard/BalanceCard';
import MonthlyStats from '../components/dashboard/MonthlyStats';
import TrendsChart from '../components/dashboard/TrendsChart';
import QuickActions from '../components/dashboard/QuickActions';
import AccountModal from '../components/modals/AccountModal';
import TransactionModal from '../components/modals/TransactionModal';

import { useTranslation } from 'react-i18next'; // Import hook

export default function Dashboard() {
    const { t } = useTranslation(); // Init hook
    // --- OPTIMIZED ZUSTAND SELECTORS ---
    // Подписываемся только на те части стора, которые используются в этом компоненте
    const loading = useFinanceStore(s => s.loading);
    const accounts = useFinanceStore(s => s.accounts);
    const recentTransactions = useFinanceStore(s => s.recentTransactions);
    const categories = useFinanceStore(s => s.categories);
    const counterparties = useFinanceStore(s => s.counterparties);
    const isPrivacy = useFinanceStore(s => s.settings.isPrivacyEnabled);
    const currency = useFinanceStore(s => s.settings.base_currency);
    const openModal = useFinanceStore(s => s.openModal);

    const getTopExpenseCategories = useFinanceStore(s => s.getTopExpenseCategories);
    const getAccountBalance = useFinanceStore(s => s.getAccountBalance);

    // --- 🔥 ЗАЩИТА: ПОКАЗЫВАЕМ СКЕЛЕТОНЫ ПРИ ЗАГРУЗКЕ ---
    if (loading && accounts.length === 0) {
        return (
            <div className="space-y-8 animate-fade-in pb-20 p-1">
                <div className="space-y-4">
                    <SkeletonLoader type="text" count={1} />
                    <SkeletonLoader type="card" count={1} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SkeletonLoader type="stat" count={4} />
                </div>
                <SkeletonLoader type="chart" count={1} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SkeletonLoader type="card" count={3} />
                </div>
            </div>
        );
    }

    // --- HANDLERS ---
    const openTxModal = (type = 'expense', categoryName = null, accountId = null) => {
        if (accounts.length === 0) return toast.error(t('settings.accounts') + ' required'); // Simple fallback translation
        openModal('transaction', { initialType: type, initialCategoryName: categoryName, initialAccountId: accountId });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">

            <SmartAlerts />
            <BalanceCard />
            <MonthlyStats />

            {/* Top Expense Categories */}
            <section>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">🔥 {t('analytics.top_expenses')}</h2>
                </div>
                <GlassCard>
                    <div className="space-y-4">
                        {getTopExpenseCategories(3).map((cat, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{cat.icon}</div>
                                        <div>
                                            <div className="font-bold text-zinc-900">{cat.name}</div>
                                            <div className="text-xs text-zinc-400">
                                                {isPrivacy ? '•••••' : new Intl.NumberFormat('ru-RU').format(Math.round(cat.amount))} {currency}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-error">{cat.percentage}%</div>
                                    </div>
                                </div>
                                <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
                                    <div style={{ width: `${cat.percentage}%` }} className={`h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500`} />
                                </div>
                            </div>
                        ))}
                        {getTopExpenseCategories(3).length === 0 && <div className="text-center text-zinc-400 py-4 font-medium">{t('analytics.no_expenses')}</div>}
                    </div>
                </GlassCard>
            </section>

            <QuickActions onAction={(type, cat) => openTxModal(type, cat)} />
            <TrendsChart />

            {/* Accounts List */}
            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 px-1 flex gap-2">
                    <CreditCard className="text-primary" strokeWidth={2.5} /> {t('settings.accounts')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((acc) => (
                        <GlassCard
                            key={acc.id}
                            onClick={() => openTxModal('expense', null, acc.id)}
                            className="cursor-pointer hover:border-primary/50 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gray-50 text-indigo-600 border border-gray-100">
                                    {acc.icon}
                                </div>
                                <div className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                                    {acc.currency}
                                </div>
                            </div>
                            <div className="font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors">
                                {acc.name}
                            </div>
                            <div className="text-xl font-black tabular-nums text-zinc-900">
                                {isPrivacy ? '••••' : new Intl.NumberFormat('ru-RU').format(getAccountBalance(acc.id))}
                            </div>
                        </GlassCard>
                    ))}

                    <button
                        onClick={() => openModal('account')}
                        className="min-h-[120px] border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold group"
                    >
                        <div className="p-3 rounded-full bg-zinc-100 group-hover:bg-primary/10 mb-2 transition-colors">
                            <Plus size={24} className="text-zinc-400 group-hover:text-primary transition-colors" />
                        </div>
                        <span> {t('common.add')} {t('settings.accounts')}</span>
                    </button>
                </div>
            </section>

            {/* Recent Transactions */}
            <section>
                <h2 className="text-xl font-bold text-zinc-900 mb-4 px-1">{t('dashboard.recent_activity')}</h2>
                <div className="space-y-3">
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map(t => (
                            <TransactionItem
                                key={t.id}
                                transaction={t}
                                category={categories.find(c => c.id === t.category_id)}
                                account={accounts.find(a => a.id === t.account_id)}
                                counterparty={counterparties.find(cp => cp.id === t.counterparty_id)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50">
                            <p className="font-bold">No transactions</p>
                            <p className="text-sm mt-1">{t('common.add')} first transaction</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
