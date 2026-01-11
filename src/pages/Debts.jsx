import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, CheckCircle, ArrowUpRight, ArrowDownLeft, Calendar, User, Wallet } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

export default function Debts() {
    const { debts, addDebt, payDebt, deleteDebt, accounts } = useFinanceStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [payModalDebt, setPayModalDebt] = useState(null);
    const [viewHistoryDebt, setViewHistoryDebt] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [payAccountId, setPayAccountId] = useState(accounts?.[0]?.id || '');

    const [form, setForm] = useState({ name: '', amount: '', type: 'i_owe', due_date: '', contact_phone: '' });

    const handleCreate = async () => {
        if (!form.name || !form.amount) return;

        await addDebt(form);
        setIsCreateModalOpen(false);
        setForm({ name: '', amount: '', type: 'i_owe', due_date: '', contact_phone: '' });
        toast.success('Долг добавлен');
    };

    const handlePay = async () => {
        if (!payAmount || !payModalDebt) return;
        await payDebt(payModalDebt.id, payAmount, payAccountId);
        setPayModalDebt(null);
        setPayAmount('');
        // toast handles in store
    };

    const handleDelete = async (id) => {
        if (confirm('Удалить запись о долге?')) {
            await deleteDebt(id);
            toast.success('Удалено');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('uz-UZ').format(val);

    const activeDebts = debts.filter(d => !d.is_closed);


    const totalIOwe = activeDebts.filter(d => d.type === 'i_owe').reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);
    const totalOwesMe = activeDebts.filter(d => d.type === 'owes_me').reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);

    return (
        <div className="space-y-6 animate-fade-in custom-scrollbar pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Wallet strokeWidth={2.5} /></span>
                        Долги
                    </h1>
                    <p className="text-zinc-500 mt-1">Управление займами и кредитами</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>Новая запись</Button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="bg-gradient-to-br from-rose-50 to-white border-rose-100 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-500 font-bold mb-2">
                        <ArrowDownLeft size={20} strokeWidth={2.5} /> Я должен
                    </div>
                    <div className="text-3xl font-black text-zinc-900">
                        {formatCurrency(totalIOwe)} <span className="text-lg opacity-50 font-medium">UZS</span>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2">
                        <ArrowUpRight size={20} strokeWidth={2.5} /> Мне должны
                    </div>
                    <div className="text-3xl font-black text-zinc-900">
                        {formatCurrency(totalOwesMe)} <span className="text-lg opacity-50 font-medium">UZS</span>
                    </div>
                </GlassCard>
            </div>

            {/* ACTIVE DEBTS LIST */}
            <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
                <CheckCircle size={20} className="text-indigo-600" strokeWidth={2.5} /> Активные
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {activeDebts.map(debt => {
                        const remaining = debt.amount - debt.paid_amount;
                        const percent = (debt.paid_amount / debt.amount) * 100;
                        const isIOwe = debt.type === 'i_owe';

                        return (
                            <motion.div
                                key={debt.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                            >
                                <GlassCard className="relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isIOwe ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-600'}`}>
                                                <User size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-zinc-900">{debt.name}</div>
                                                <div className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                                                    {debt.due_date && (
                                                        <span className="flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-600">
                                                            <Calendar size={10} strokeWidth={2.5} /> {debt.due_date}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`font-black text-xl ${isIOwe ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                {formatCurrency(remaining)}
                                            </div>
                                            <div className="text-xs text-zinc-400 font-bold">
                                                из {formatCurrency(debt.amount)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-zinc-100 rounded-full mb-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            className={`h-full ${isIOwe ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => setViewHistoryDebt(debt)}
                                            className="p-2 bg-zinc-100 rounded-lg text-zinc-400 hover:text-indigo-600"
                                            title="История"
                                        >
                                            <Calendar size={18} strokeWidth={2.5} />
                                        </button>
                                        <Button size="sm" onClick={() => setPayModalDebt(debt)} className="flex-1">
                                            Внести платеж
                                        </Button>
                                        <button
                                            onClick={() => handleDelete(debt.id)}
                                            className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {activeDebts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-20" strokeWidth={1} />
                        <p>У вас нет активных долгов. Отлично!</p>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Новая запись">
                <div className="space-y-4">
                    <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                        <button
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'i_owe' ? 'bg-white shadow text-rose-500' : 'text-zinc-500'}`}
                            onClick={() => setForm({ ...form, type: 'i_owe' })}
                        >
                            Я должен
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'owes_me' ? 'bg-white shadow text-emerald-600' : 'text-zinc-500'}`}
                            onClick={() => setForm({ ...form, type: 'owes_me' })}
                        >
                            Мне должны
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Имя / Контакт</label>
                        <input
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm"
                            placeholder="Имя человека"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Сумма</label>
                        <input
                            type="number"
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-xl text-zinc-900 focus:border-indigo-500 shadow-sm"
                            placeholder="0"
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Дата возврата (опц.)</label>
                        <input
                            type="date"
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm"
                            value={form.due_date}
                            onChange={e => setForm({ ...form, due_date: e.target.value })}
                        />
                    </div>

                    <Button onClick={handleCreate} className="w-full py-4 text-lg bg-primary hover:bg-primary/90">Создать</Button>
                </div>
            </Modal>

            {/* PAY MODAL */}
            <Modal isOpen={!!payModalDebt} onClose={() => setPayModalDebt(null)} title="Внести платеж">
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="text-zinc-500 text-sm">Остаток долга</div>
                        <div className="text-2xl font-black text-zinc-900">
                            {payModalDebt && formatCurrency(payModalDebt.amount - payModalDebt.paid_amount)} UZS
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Сумма</label>
                        <input
                            type="number"
                            autoFocus
                            placeholder="Сумма платежа"
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-center text-xl text-zinc-900 focus:border-emerald-500 shadow-sm"
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Счет списания/зачисления</label>
                        <select
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
                            onChange={(e) => setPayAccountId(e.target.value)}
                        >
                            {useFinanceStore(s => s.accounts).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                            ))}
                        </select>
                    </div>

                    <Button onClick={handlePay} className="w-full py-4 bg-success hover:bg-success/90 text-slate-900">
                        Подтвердить оплату
                    </Button>
                </div>
            </Modal >

            {/* HISTORY MODAL */}
            <Modal isOpen={!!viewHistoryDebt} onClose={() => setViewHistoryDebt(null)} title={`История: ${viewHistoryDebt?.name}`}>
                <div className="max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {useFinanceStore.getState().transactions
                        .filter(t => t.comment && t.comment.includes(`Возврат долга: ${viewHistoryDebt?.name}`))
                        .map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-white border border-zinc-200 rounded-xl shadow-sm">
                                <div>
                                    <div className="text-zinc-900 font-bold text-sm">{t.comment}</div>
                                    <div className="text-xs text-zinc-400">{new Date(t.date).toLocaleDateString('ru-RU')}</div>
                                </div>
                                <div className={`font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </div>
                            </div>
                        ))
                    }
                    {viewHistoryDebt && useFinanceStore.getState().transactions.filter(t => t.comment && t.comment.includes(`Возврат долга: ${viewHistoryDebt.name}`)).length === 0 && (
                        <div className="text-center text-zinc-400 py-6">Нет истории платежей</div>
                    )}
                </div>
            </Modal>
        </div >
    );
}