import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, CheckCircle, ArrowUpRight, ArrowDownLeft, Calendar, User, Wallet } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Debts() {
    const { debts, addDebt, payDebt, deleteDebt } = useFinanceStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [payModalDebt, setPayModalDebt] = useState(null);
    const [payAmount, setPayAmount] = useState('');

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
        await payDebt(payModalDebt.id, payAmount);
        setPayModalDebt(null);
        setPayAmount('');
        toast.success('Платеж внесен');
    };

    const handleDelete = async (id) => {
        if (confirm('Удалить запись о долге?')) {
            await deleteDebt(id);
            toast.success('Удалено');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('uz-UZ').format(val);

    const activeDebts = debts.filter(d => !d.is_closed);
    const closedDebts = debts.filter(d => d.is_closed);

    const totalIOwe = activeDebts.filter(d => d.type === 'i_owe').reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);
    const totalOwesMe = activeDebts.filter(d => d.type === 'owes_me').reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);

    return (
        <div className="space-y-6 animate-fade-in custom-scrollbar pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><Wallet /></span>
                        Долги
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Управление займами и кредитами</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>Новая запись</Button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2">
                        <ArrowDownLeft size={20} /> Я должен
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {formatCurrency(totalIOwe)} <span className="text-lg opacity-50 font-medium">UZS</span>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                        <ArrowUpRight size={20} /> Мне должны
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {formatCurrency(totalOwesMe)} <span className="text-lg opacity-50 font-medium">UZS</span>
                    </div>
                </GlassCard>
            </div>

            {/* ACTIVE DEBTS LIST */}
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <CheckCircle size={20} className="text-blue-500" /> Активные
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
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isIOwe ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-gray-900 dark:text-white">{debt.name}</div>
                                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    {debt.due_date && (
                                                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                                            <Calendar size={10} /> {debt.due_date}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`font-black text-xl ${isIOwe ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {formatCurrency(remaining)}
                                            </div>
                                            <div className="text-xs text-gray-400 font-bold">
                                                из {formatCurrency(debt.amount)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            className={`h-full ${isIOwe ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button size="sm" onClick={() => setPayModalDebt(debt)} className="flex-1">
                                            Внести платеж
                                        </Button>
                                        <button
                                            onClick={() => handleDelete(debt.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {activeDebts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p>У вас нет активных долгов. Отлично!</p>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Новая запись">
                <div className="space-y-4">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <button
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'i_owe' ? 'bg-white dark:bg-gray-600 shadow text-red-500' : 'text-gray-500'}`}
                            onClick={() => setForm({ ...form, type: 'i_owe' })}
                        >
                            Я должен
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${form.type === 'owes_me' ? 'bg-white dark:bg-gray-600 shadow text-emerald-500' : 'text-gray-500'}`}
                            onClick={() => setForm({ ...form, type: 'owes_me' })}
                        >
                            Мне должны
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Имя / Контакт</label>
                        <input
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                            placeholder="Имя человека"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Сумма</label>
                        <input
                            type="number"
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none text-xl"
                            placeholder="0"
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Дата возврата (опц.)</label>
                        <input
                            type="date"
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                            value={form.due_date}
                            onChange={e => setForm({ ...form, due_date: e.target.value })}
                        />
                    </div>

                    <Button onClick={handleCreate} className="w-full py-4 text-lg">Создать</Button>
                </div>
            </Modal>

            {/* PAY MODAL */}
            <Modal isOpen={!!payModalDebt} onClose={() => setPayModalDebt(null)} title="Внести платеж">
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="text-gray-500 text-sm">Остаток долга</div>
                        <div className="text-2xl font-black">
                            {payModalDebt && formatCurrency(payModalDebt.amount - payModalDebt.paid_amount)} UZS
                        </div>
                    </div>

                    <input
                        type="number"
                        autoFocus
                        placeholder="Сумма платежа"
                        className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none text-center text-xl"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                    />

                    <Button onClick={handlePay} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white">
                        Подтвердить оплату
                    </Button>
                </div>
            </Modal>
        </div>
    );
}