import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, User, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import GlassCard from './ui/GlassCard';

export default function TransactionItem({ transaction, category, account, counterparty }) {
    const isExpense = transaction.type === 'expense' || transaction.type === 'transfer_out';
    const isIncome = transaction.type === 'income' || transaction.type === 'transfer_in';
    const isTransfer = transaction.type.includes('transfer');

    const formattedDate = format(parseISO(transaction.date), 'HH:mm', { locale: ru });
    const formattedAmount = new Intl.NumberFormat('ru-RU').format(Math.abs(transaction.amount));

    return (
        <GlassCard className="flex items-center justify-between p-4 group hover:scale-[1.01] transition-transform duration-200 cursor-default" hover={false}>
            <div className="flex items-center gap-4 overflow-hidden">
                {/* ICON BOX */}
                <div className={`
                    w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl shadow-sm
                    ${isTransfer ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
                    ${transaction.type === 'expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : ''}
                    ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                `}>
                    {category?.icon || (isTransfer ? <ArrowLeftRight /> : '💰')}
                </div>

                {/* DETAILS */}
                <div className="min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white truncate text-base leading-tight mb-0.5">
                        {category?.name || (isTransfer ? 'Перевод' : 'Без категории')}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="truncate max-w-[100px]">{account?.name}</span>

                        {counterparty && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-blue-500">
                                    <User size={10} /> {counterparty.name}
                                </span>
                            </>
                        )}
                    </div>
                    {transaction.comment && (
                        <div className="text-xs text-gray-500 mt-1 truncate italic">
                            {transaction.comment}
                        </div>
                    )}
                </div>
            </div>

            {/* AMOUNT */}
            <div className={`text-right font-black whitespace-nowrap text-lg ${isExpense ? 'text-gray-900 dark:text-white' : 'text-emerald-500'}`}>
                {isExpense ? '-' : '+'}{formattedAmount}
                <span className="text-xs text-gray-400 ml-1 font-bold">{account?.currency}</span>
            </div>
        </GlassCard>
    );
}
