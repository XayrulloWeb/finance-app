import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Star, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

export default function CounterpartyCard({ counterparty, onEdit }) {
    const { deleteCounterparty, toggleFavorite, getCounterpartyStats } = useFinanceStore();
    const stats = getCounterpartyStats(counterparty.id);

    const handleDelete = async () => {
        if (confirm(`Удалить контрагента "${counterparty.name}"?`)) {
            await deleteCounterparty(counterparty.id);
        }
    };

    const handleToggleFavorite = async () => {
        await toggleFavorite(counterparty.id);
    };

    const typeLabels = {
        person: '👤 Человек',
        company: '🏢 Компания',
        organization: '🏛️ Организация'
    };

    return (
        <div
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative"
            style={{ borderTopColor: counterparty.color, borderTopWidth: '3px' }}
        >
            {/* Иконка избранного */}
            <button
                onClick={handleToggleFavorite}
                className={`absolute top-3 right-3 transition ${counterparty.favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                    }`}
            >
                <Star size={20} fill={counterparty.favorite ? 'currentColor' : 'none'} />
            </button>

            {/* Заголовок */}
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${counterparty.color}20` }}
                >
                    {counterparty.icon}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{counterparty.name}</h3>
                    <p className="text-sm text-gray-500">{typeLabels[counterparty.type] || counterparty.type}</p>
                </div>
            </div>

            {/* Статистика */}
            {stats.transactionCount > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {stats.totalIncome > 0 && (
                        <div className="bg-green-50 p-3 rounded-xl">
                            <div className="flex items-center gap-1 text-green-600 text-sm mb-1">
                                <TrendingUp size={14} />
                                <span className="font-medium">Получено</span>
                            </div>
                            <div className="font-bold text-green-700">
                                {stats.totalIncome.toLocaleString()} UZS
                            </div>
                        </div>
                    )}
                    {stats.totalExpense > 0 && (
                        <div className="bg-red-50 p-3 rounded-xl">
                            <div className="flex items-center gap-1 text-red-600 text-sm mb-1">
                                <TrendingDown size={14} />
                                <span className="font-medium">Заплачено</span>
                            </div>
                            <div className="font-bold text-red-700">
                                {stats.totalExpense.toLocaleString()} UZS
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Заметки */}
            {counterparty.notes && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{counterparty.notes}</p>
            )}

            {/* Кнопки действий */}
            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(counterparty)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition"
                >
                    <Edit2 size={16} />
                    Изменить
                </button>
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Количество транзакций */}
            {stats.transactionCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
                    {stats.transactionCount} {stats.transactionCount === 1 ? 'транзакция' : 'транзакций'}
                </div>
            )}
        </div>
    );
}
