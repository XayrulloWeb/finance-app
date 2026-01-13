import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toast } from '../ui/Toast';

export default function TransactionModal({
                                             isOpen,
                                             onClose,
                                             initialType = 'expense',
                                             initialCategoryName = null,
                                             initialAccountId = null,
                                             editingTransaction = null // <-- НОВЫЙ ПРОП
                                         }) {
    const store = useFinanceStore();
    const [loading, setLoading] = useState(false);

    // Режимы: Выбор категории или контрагента
    const [txMode, setTxMode] = useState('category');

    const [form, setForm] = useState({
        type: 'expense',
        amount: '',
        account_id: '',
        category_id: '',
        counterparty_id: '',
        comment: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Инициализация при открытии
    useEffect(() => {
        if (isOpen) {
            if (editingTransaction) {
                // РЕЖИМ РЕДАКТИРОВАНИЯ
                setForm({
                    type: editingTransaction.type,
                    amount: editingTransaction.amount,
                    account_id: editingTransaction.account_id,
                    category_id: editingTransaction.category_id || '',
                    counterparty_id: editingTransaction.counterparty_id || '',
                    comment: editingTransaction.comment || '',
                    date: editingTransaction.date.split('T')[0]
                });
                setTxMode(editingTransaction.counterparty_id ? 'counterparty' : 'category');
            } else {
                // РЕЖИМ СОЗДАНИЯ
                let categoryId = '';
                if (initialCategoryName) {
                    const found = store.categories.find(c => c.name.toLowerCase().includes(initialCategoryName.toLowerCase()) && c.type === initialType);
                    if (found) categoryId = found.id;
                }

                setForm({
                    type: initialType,
                    amount: '',
                    account_id: initialAccountId || store.accounts[0]?.id || '',
                    category_id: categoryId,
                    counterparty_id: '',
                    comment: '',
                    date: new Date().toISOString().split('T')[0]
                });
                setTxMode('category');
            }
        }
    }, [isOpen, editingTransaction, initialType, initialCategoryName, initialAccountId, store.accounts, store.categories]);

    // Фильтруем категории по типу (Income/Expense)
    const categories = store.categories.filter(c => c.type === form.type);

    const handleSubmit = async () => {
        // --- ВАЛИДАЦИЯ ---
        if (!form.account_id) return toast.error('Выберите счет');
        if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Введите корректную сумму');

        if (form.type === 'expense' && txMode === 'category' && !form.category_id) {
            return toast.error('Выберите категорию');
        }

        setLoading(true);

        // Подготовка данных
        const payload = {
            ...form,
            // Если выбран режим категории, очищаем контрагента и наоборот
            counterparty_id: txMode === 'counterparty' ? form.counterparty_id : null,
            category_id: txMode === 'category' ? form.category_id : null
        };

        let success = false;

        if (editingTransaction) {
            success = await store.updateTransaction(editingTransaction.id, payload);
        } else {
            success = await store.addTransaction(payload);
        }

        setLoading(false);

        if (success) {
            onClose();
        }
    };

    const title = editingTransaction
        ? 'Редактирование операции'
        : (form.type === 'income' ? 'Новый Доход' : 'Новый Расход');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                {/* Переключатель Типа (Блокируем при редактировании для простоты, или можно разрешить) */}
                <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                    <button
                        onClick={() => setForm(p => ({ ...p, type: 'expense', category_id: '', counterparty_id: '' }))}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${form.type === 'expense' ? 'bg-white shadow-sm text-error ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Расход
                    </button>
                    <button
                        onClick={() => setForm(p => ({ ...p, type: 'income', category_id: '', counterparty_id: '' }))}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${form.type === 'income' ? 'bg-white shadow-sm text-success ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Доход
                    </button>
                </div>

                {/* Ввод Суммы */}
                <div className="relative">
                    <input
                        type="number"
                        autoFocus={!editingTransaction} // Не фокусируем при редактировании, чтобы не скакало на мобилках
                        className={`w-full text-5xl font-black p-4 bg-transparent border-b-2 outline-none text-center tabular-nums transition-colors ${form.type === 'expense' ? 'text-error border-error/30 focus:border-error' : 'text-success border-success/30 focus:border-success'}`}
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        placeholder="0"
                    />
                    <div className="text-center text-xs font-bold text-zinc-400 mt-2 uppercase tracking-wide">Сумма ({store.accounts.find(a => a.id === form.account_id)?.currency})</div>
                </div>

                <div className="space-y-4">
                    {/* Выбор Счета */}
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Счет</label>
                        <select className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })}>
                            {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(a.id))} {a.currency})</option>)}
                        </select>
                    </div>

                    {/* Выбор Категории / Контрагента */}
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase">{form.type === 'expense' ? 'На что / Кому' : 'Откуда'}</label>
                        <div className="flex gap-2 mb-2">
                            <button onClick={() => setTxMode('category')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${txMode === 'category' ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>Категория</button>
                            <button onClick={() => setTxMode('counterparty')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${txMode === 'counterparty' ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>Контрагент</button>
                        </div>

                        {txMode === 'category' ? (
                            <select className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer" value={form.category_id || ''} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                                <option value="">Выберите категорию...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select>
                        ) : (
                            <select className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer" value={form.counterparty_id || ''} onChange={e => setForm({ ...form, counterparty_id: e.target.value })}>
                                <option value="">Выберите контрагента...</option>
                                {store.counterparties.map(c => <option key={c.id} value={c.id}>{c.icon || '👤'} {c.name}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Дата и Комментарий */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Дата</label>
                            <input type="date" className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Комментарий</label>
                            <input type="text" placeholder="..." className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
                        </div>
                    </div>
                </div>

                <Button onClick={handleSubmit} loading={loading} variant={form.type === 'expense' ? 'danger' : 'success'} className="w-full py-4 text-lg shadow-xl shadow-gray-200">
                    {editingTransaction ? 'Сохранить изменения' : (form.type === 'expense' ? 'Списать' : 'Зачислить')}
                </Button>
            </div>
        </Modal>
    );
}