import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Target, Trophy, Clock, DollarSign, Trash2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { toast } from '../components/ui/Toast';

export default function Goals() {
    const { goals, addGoal, deleteGoal, addMoneyToGoal, accounts, settings } = useFinanceStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [topUpGoal, setTopUpGoal] = useState(null); // Goal object to top up

    // Forms
    const [createForm, setCreateForm] = useState({ name: '', target_amount: '', deadline: '', icon: '🎯', color: '#2563eb' });
    const [topUpAmount, setTopUpAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');

    const handleCreate = async () => {
        if (!createForm.name || !createForm.target_amount) return toast.error('Заполните обязательные поля');

        await addGoal(createForm);
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', target_amount: '', deadline: '', icon: '🎯', color: '#2563eb' });
    };

    const handleTopUp = async () => {
        if (!topUpAmount || !selectedAccount || !topUpGoal) return toast.error('Заполните сумму и выберите счет');

        await addMoneyToGoal(topUpGoal.id, topUpAmount, selectedAccount);
        setTopUpAmount('');
        setTopUpGoal(null);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm('Удалить эту цель? Накопленные средства не вернутся на счет (нужно создать доход вручную).')) {
            await deleteGoal(id);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('uz-UZ').format(amount);

    return (
        <div className="space-y-8 animate-fade-in pb-24 custom-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Target strokeWidth={2.5} /></span>
                        Финансовые цели
                    </h1>
                    <p className="text-zinc-500 mt-1">Визуализируйте и достигайте мечты</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>Новая цель</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal, idx) => {
                    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
                    const isCompleted = goal.current_amount >= goal.target_amount;

                    return (
                        <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <GlassCard className="relative group min-h-[220px] flex flex-col justify-between hover:border-indigo-300 transition-all cursor-default">
                                {isCompleted && (
                                    <div className="absolute -top-3 -right-3 bg-yellow-400 text-white p-2 rounded-full shadow-lg animate-bounce z-10">
                                        <Trophy size={20} strokeWidth={2.5} fill="currentColor" />
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-zinc-100 bg-white">
                                            {goal.icon}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, goal.id)}
                                            className="text-zinc-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold text-zinc-900 mb-1 line-clamp-1">{goal.name}</h3>

                                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                                        {formatCurrency(goal.target_amount)} {settings.base_currency}
                                    </div>

                                    {daysLeft !== null && !isCompleted && (
                                        <div className={`mt-2 text-xs font-bold flex items-center gap-1 ${daysLeft < 0 ? 'text-rose-500' : 'text-indigo-500'}`}>
                                            <Clock size={12} strokeWidth={2.5} />
                                            {daysLeft < 0 ? `Просрочено на ${Math.abs(daysLeft)} дн.` : `Осталось ${daysLeft} дн.`}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-zinc-400">{Math.round(progress)}%</span>
                                            <span className="text-zinc-900">{formatCurrency(goal.current_amount)}</span>
                                        </div>
                                        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={`h-full rounded-full ${isCompleted ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`}
                                            />
                                        </div>
                                    </div>

                                    {!isCompleted && (
                                        <Button
                                            size="sm"
                                            className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
                                            onClick={() => setTopUpGoal(goal)}
                                        >
                                            Пополнить
                                        </Button>
                                    )}
                                    {isCompleted && (
                                        <div className="w-full py-2 text-center text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                                            Цель достигнута!
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}

                {/* Empty State */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="min-h-[220px] rounded-3xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-4 text-zinc-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold">Создать новую цель</span>
                </button>
            </div>

            {/* MODAL: CREATE GOAL */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Новая цель">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Название</label>
                        <input
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm"
                            placeholder="Например: Новый MacBook"
                            value={createForm.name}
                            onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Целевая сумма</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full p-4 pl-12 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 text-xl shadow-sm"
                                placeholder="0"
                                value={createForm.target_amount}
                                onChange={e => setCreateForm({ ...createForm, target_amount: e.target.value })}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{settings.base_currency}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Дедлайн (опц.)</label>
                            <input
                                type="date"
                                className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm"
                                value={createForm.deadline}
                                onChange={e => setCreateForm({ ...createForm, deadline: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Иконка</label>
                            <select
                                className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm appearance-none"
                                value={createForm.icon}
                                onChange={e => setCreateForm({ ...createForm, icon: e.target.value })}
                            >
                                <option value="🎯">🎯 Цель</option>
                                <option value="🚗">🚗 Авто</option>
                                <option value="🏠">🏠 Дом</option>
                                <option value="💻">💻 Техника</option>
                                <option value="✈️">✈️ Отдых</option>
                                <option value="🎓">🎓 Обучение</option>
                                <option value="💰">💰 Подушка</option>
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleCreate} className="w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-700 text-white">Создать цель</Button>
                </div>
            </Modal>

            {/* MODAL: TOP UP */}
            <Modal isOpen={!!topUpGoal} onClose={() => setTopUpGoal(null)} title="Пополнить цель">
                <div className="space-y-6">
                    <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-4 border border-indigo-100">
                        <div className="text-4xl">{topUpGoal?.icon}</div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900">{topUpGoal?.name}</h3>
                            <p className="text-zinc-500 text-xs font-bold uppercase">Осталось накопить: {topUpGoal ? formatCurrency(topUpGoal.target_amount - topUpGoal.current_amount) : 0}</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Списать со счета</label>
                        <select
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500"
                            value={selectedAccount}
                            onChange={e => setSelectedAccount(e.target.value)}
                        >
                            <option value="">Выберите счет</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance || 0)})</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <input
                            type="number"
                            autoFocus
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none focus:border-emerald-500 text-3xl text-center text-emerald-600 shadow-sm tabular-nums"
                            placeholder="0"
                            value={topUpAmount}
                            onChange={e => setTopUpAmount(e.target.value)}
                        />
                        <div className="text-center text-xs font-bold text-zinc-400 mt-2 uppercase">Сумма пополнения</div>
                    </div>

                    <Button onClick={handleTopUp} variant="success" className="w-full py-4 text-lg">
                        Внести средства
                    </Button>
                </div>
            </Modal>
        </div>
    );
}