
import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, ShoppingCart, Car } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useTranslation } from 'react-i18next';

const QuickActionButton = ({ icon: IconComponent, label, category, onClick }) => (
    <button
        onClick={() => onClick('expense', category)}
        className="flex flex-col items-center gap-2 min-w-[80px] group"
    >
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-zinc-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm group-active:scale-95">
            <IconComponent size={24} className="text-zinc-700 group-hover:text-indigo-600" strokeWidth={2} />
        </div>
        <span className="text-xs font-bold text-zinc-500 group-hover:text-indigo-600 transition-colors text-center max-w-[80px] truncate">
            {label}
        </span>
    </button>
);

export default function QuickActions({ onAction }) {
    const { t } = useTranslation();
    const { getTopUsedCategories } = useFinanceStore();
    const topCategories = getTopUsedCategories(6);

    // Default actions
    const defaultActions = [
        { icon: Coffee, label: t('category_names.cafe'), category: t('category_names.cafe') },
        { icon: ShoppingCart, label: t('category_names.groceries'), category: t('category_names.groceries') },
        { icon: Car, label: t('category_names.transport'), category: t('category_names.transport') },
    ];

    return (
        <section>
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-lg font-bold text-zinc-900">{t('dashboard.quick_actions.title')}</h2>
            </div>
            <div className="flex overflow-x-auto gap-3 pb-4 px-1 custom-scrollbar">
                {/* Render Defaults first */}
                {defaultActions.map((action, idx) => (
                    <QuickActionButton
                        key={`def - ${idx} `}
                        {...action}
                        onClick={onAction}
                        label={action.label}
                    />
                ))}

                {/* Render Dynamic from store */}
                {topCategories.map((cat, idx) => (
                    <motion.button
                        key={cat.categoryId || idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => onAction('expense', cat.name)}
                        className="flex flex-col items-center gap-2 min-w-[80px] group"
                    >
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border-2 border-zinc-200 hover:border-primary hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all shadow-sm group-active:scale-95">
                            <span className="text-2xl">{cat.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-600 group-hover:text-primary transition-colors text-center max-w-[80px] truncate">
                            {cat.name}
                        </span>
                    </motion.button>
                ))}
            </div>
        </section>
    );
}