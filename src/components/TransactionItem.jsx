import React from 'react';
import { ArrowLeftRight, User, Trash, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import GlassCard from './ui/GlassCard';
import { useFinanceStore } from '../store/useFinanceStore';
import { toast } from './ui/Toast';

export default function TransactionItem({ transaction, category, account, counterparty, onEdit }) {
    const { deleteTransaction } = useFinanceStore();
    const isExpense = transaction.type === 'expense' || transaction.type === 'transfer_out';
    const isIncome = transaction.type === 'income' || transaction.type === 'transfer_in';
    const isTransfer = transaction.type.includes('transfer');

    const formattedDate = format(parseISO(transaction.date), 'HH:mm', { locale: ru });
    const formattedAmount = new Intl.NumberFormat('ru-RU').format(Math.abs(transaction.amount));

    // Swipe Logic
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
    const editOpacity = useTransform(x, [50, 100], [0, 1]);
    const xSpring = useSpring(x, { stiffness: 500, damping: 50 });

    const handleDragEnd = async (_, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset < -100 || (offset < -50 && velocity < -500)) {
            // Delete
            if (window.confirm('Удалить эту операцию?')) {
                await deleteTransaction(transaction.id);
            } else {
                x.set(0); // Return
            }
        } else if (offset > 100 || (offset > 50 && velocity > 500)) {
            // Edit
            if (onEdit) onEdit(transaction);
            x.set(0); // Return after triggering edit
        }
    };

    return (
        <div className="relative mb-3 group select-none touch-pan-y">
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between rounded-2xl px-4 bg-zinc-100">
                <motion.div style={{ opacity: editOpacity }} className="flex items-center gap-2 text-indigo-600 font-bold">
                    <Pencil size={20} />
                    <span>Ред.</span>
                </motion.div>
                <motion.div style={{ opacity: deleteOpacity }} className="flex items-center gap-2 text-rose-600 font-bold">
                    <span>Удалить</span>
                    <Trash size={20} />
                </motion.div>
            </div>

            {/* Foreground Card */}
            <GlassCard
                className="relative bg-white z-10 active:cursor-grabbing"
                hover={false}
                style={{ x: xSpring }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                dragElastic={0.7}
                // Также открываем по клику, если это не свайп (опционально, но лучше оставить клик на саму карточку)
                // onClick={() => onEdit && onEdit(transaction)}
            >
                <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-4 overflow-hidden">
                        {/* ICON BOX */}
                        <div className={`
                            w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl shadow-sm
                            ${isTransfer ? 'bg-indigo-50 text-indigo-600' : ''}
                            ${transaction.type === 'expense' ? 'bg-rose-50 text-rose-600' : ''}
                            ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-600' : ''}
                        `}>
                            {category?.icon || (isTransfer ? <ArrowLeftRight strokeWidth={2.5} size={20} /> : (counterparty ? counterparty.icon : '💰'))}
                        </div>

                        {/* DETAILS */}
                        <div className="min-w-0">
                            <div className="font-bold text-zinc-900 truncate text-base leading-tight mb-0.5">
                                {isTransfer
                                    ? 'Перевод'
                                    : (category?.name || (counterparty ? counterparty.name : 'Без категории'))}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wide">
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span className="truncate max-w-[100px]">{account?.name}</span>
                            </div>
                            {transaction.comment && (
                                <div className="text-xs text-zinc-500 mt-1 truncate italic">
                                    {transaction.comment}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AMOUNT */}
                    <div className={`text-right font-black whitespace-nowrap text-lg ${isExpense ? 'text-zinc-900' : 'text-emerald-600'}`}>
                        {isExpense ? '-' : '+'}{formattedAmount}
                        <span className="text-xs text-zinc-400 ml-1 font-bold">{account?.currency}</span>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}