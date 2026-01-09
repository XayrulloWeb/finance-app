import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Target, Trophy, Clock, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

export default function Goals() {
    const { goals, addGoal, deleteGoal, addMoneyToGoal, accounts, settings } = useFinanceStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeGoal, setActiveGoal] = useState(null);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');

    // Form State
    const [form, setForm] = useState({ name: '', target_amount: '', deadline: '', icon: '🎯', color: '#2563eb' });

    const handleCreate = async () => {
        if (!form.name || !form.target_amount) return;
        await addGoal(form);
        setIsModalOpen(false);
        setForm({ name: '', target_amount: '', deadline: '', icon: '🎯', color: '#2563eb' });
    };

    const handleTopUp = async () => {
        if (!topUpAmount || !selectedAccount || !activeGoal) return;
        await addMoneyToGoal(activeGoal.id, topUpAmount, selectedAccount);
        setTopUpAmount('');
        setActiveGoal(null);
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('uz-UZ').format(amount);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><Target /></span>
                        Финансовые цели
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Мечты становятся планами</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon={Plus}>Новая цель</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
                    const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;

                    return (
                        <GlassCard key={goal.id} className="relative group min-h-[200px] flex flex-col justify-between" gradient={goal.is_completed}>
                            {goal.is_completed && (
                                <div className="absolute top-4 right-4 text-yellow-500 animate-bounce">
                                    <Trophy size={32} />
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: goal.color + '20', color: goal.color }}>
                                        {goal.icon}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Цель</div>
                                        <div className="font-black text-lg text-gray-900 dark:text-white">
                                            {formatCurrency(goal.target_amount)} <span className="text-xs text-gray-400">{settings.base_currency}</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{goal.name}</h3>

                                {daysLeft !== null && !goal.is_completed && (
                                    <div className={`text-xs font-bold flex items-center gap-1 ${daysLeft < 0 ? 'text-red-500' : daysLeft < 30 ? 'text-orange-500' : 'text-blue-500'}`}>
                                        <Clock size={12} />
                                        {daysLeft < 0 ? `Просрочено на ${Math.abs(daysLeft)} дн.` : `Осталось ${daysLeft} дн.`}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-gray-500 dark:text-gray-400">
                                        {formatCurrency(goal.current_amount)}
                                    </span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    />
                                </div>

                                {!goal.is_completed && (
                                    <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            className="flex-1"
                                            onClick={() => setActiveGoal(goal)}
                                            icon={Plus}
                                        >
                                            Пополнить
                                        </Button>
                                        <button
                                            onClick={() => deleteGoal(goal.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                                        >
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <Target className="mx-auto mb-4 opacity-20" size={64} />
                        <p className="text-xl font-bold">У вас пока нет целей</p>
                        <p className="mb-6">Создайте первую цель и начните копить мечту!</p>
                        <Button onClick={() => setIsModalOpen(true)} variant="outline">Создать цель</Button>
                    </div>
                )}
            </div>

            {/* MODAL: CREATE GOAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая цель">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Название цели</label>
                        <input
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Например: Новый MacBook"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Сумма цели</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xl"
                                placeholder="0"
                                value={form.target_amount}
                                onChange={e => setForm({ ...form, target_amount: e.target.value })}
                            />
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-500 mb-1 block">Дедлайн (необяз.)</label>
                            <input
                                type="date"
                                className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.deadline}
                                onChange={e => setForm({ ...form, deadline: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-500 mb-1 block">Иконка</label>
                            <select
                                className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                                value={form.icon}
                                onChange={e => setForm({ ...form, icon: e.target.value })}
                            >
                                <option value="🎯">🎯 Цель</option>
                                <option value="🚗">🚗 Авто</option>
                                <option value="🏠">🏠 Дом</option>
                                <option value="💻">💻 Техника</option>
                                <option value="✈️">✈️ Путешествие</option>
                                <option value="🎓">🎓 Обучение</option>
                                <option value="💍">💍 Свадьба</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button onClick={handleCreate} className="w-full py-4 text-lg">Создать цель</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: TOP UP */}
            <Modal isOpen={!!activeGoal} onClose={() => setActiveGoal(null)} title="Пополнить цель">
                <div className="space-y-4">
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-2">{activeGoal?.icon}</div>
                        <h3 className="text-xl font-bold">{activeGoal?.name}</h3>
                        <p className="text-gray-500 text-sm">Осталось: {activeGoal ? formatCurrency(activeGoal.target_amount - activeGoal.current_amount) : 0}</p>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Списать со счета</label>
                        <select
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                            value={selectedAccount}
                            onChange={e => setSelectedAccount(e.target.value)}
                        >
                            <option value="">Выберите счет</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance || 0)})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Сумма пополнения</label>
                        <input
                            type="number"
                            autoFocus
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-green-500 text-2xl text-center text-green-600"
                            placeholder="0"
                            value={topUpAmount}
                            onChange={e => setTopUpAmount(e.target.value)}
                        />
                    </div>

                    <Button disabled={!selectedAccount || !topUpAmount} onClick={handleTopUp} variant="success" className="w-full py-4 text-lg mt-4">
                        Внести средства
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
