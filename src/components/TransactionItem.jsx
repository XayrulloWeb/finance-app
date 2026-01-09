import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

export default function TransactionItem({ transaction, category, account, counterparty }) {
    const getTypeIcon = () => {
        switch (transaction.type) {
            case 'income':
                return <ArrowUpRight className="text-green-600" size={20} />;
            case 'expense':
                return <ArrowDownRight className="text-red-600" size={20} />;
            case 'transfer':
                return <ArrowLeftRight className="text-blue-600" size={20} />;
            default:
                return null;
        }
    };

    const getAmountClass = () => {
        switch (transaction.type) {
            case 'income':
                return 'text-green-600';
            case 'expense':
                return 'text-red-600';
            case 'transfer':
                return 'text-blue-600';
            default:
                return 'text-gray-900';
        }
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'd MMM, HH:mm', { locale: ru });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in border border-gray-100">
            <div className="flex items-center gap-3">
                <div className="text-3xl">
                    {category?.icon || '💰'}
                </div>
                <div>
                    <div className="font-bold text-gray-900">
                        {category?.name || 'Без категории'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        {getTypeIcon()}
                        <span>{formatDate(transaction.date)}</span>
                        {counterparty && (
                            <>
                                <span>•</span>
                                <span>{counterparty.icon} {counterparty.name}</span>
                            </>
                        )}
                        {transaction.comment && (
                            <>
                                <span>•</span>
                                <span className="italic">{transaction.comment}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={`font-bold text-lg ${getAmountClass()}`}>
                {transaction.type === 'expense' && '-'}
                {transaction.type === 'income' && '+'}
                {new Intl.NumberFormat('uz-UZ').format(transaction.amount)}
                <span className="text-xs ml-1 text-gray-400">UZS</span>
            </div>
        </div>
    );
}
