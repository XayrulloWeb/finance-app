import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2 } from 'lucide-react';

export default function BudgetCard({ category }) {
    const { getBudgetProgress, deleteBudget, budgets } = useFinanceStore();
    const budget = budgets.find(b => b.category_id === category.id);
    const status = getBudgetProgress(category.id);

    if (!status) return null;

    let progressColor = 'bg-emerald-500';
    if (status.percent > 75) progressColor = 'bg-amber-500';
    if (status.percent >= 100) progressColor = 'bg-red-500';

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="text-2xl bg-gray-50 p-2 rounded-xl">{category.icon}</div>
                    <div>
                        <div className="font-bold text-gray-900">{category.name}</div>
                        <div className="text-xs text-gray-500">Лимит на месяц</div>
                    </div>
                </div>
                <button
                    onClick={() => confirm('Удалить бюджет?') && deleteBudget(budget.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex justify-between items-end mb-2">
                <div className="text-lg font-bold">
                    {new Intl.NumberFormat('uz-UZ').format(status.spent)}
                </div>
                <div className="text-sm text-gray-400">
                    из {new Intl.NumberFormat('uz-UZ').format(status.limit)}
                </div>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${progressColor} transition-all duration-700 ease-out`} style={{ width: `${Math.min(status.percent, 100)}%` }} />
            </div>

            <div className="mt-2 text-xs font-medium text-right">
                {status.isOver ? (
                    <span className="text-red-500">Превышение на {new Intl.NumberFormat('uz-UZ').format(status.spent - status.limit)}!</span>
                ) : (
                    <span className="text-emerald-600">Осталось: {new Intl.NumberFormat('uz-UZ').format(status.remaining)}</span>
                )}
            </div>
        </div>
    );
}