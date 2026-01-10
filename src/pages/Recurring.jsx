import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { supabase } from '../supabaseClient';
import { Calendar, Plus, Trash2, Zap, Clock, CheckCircle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

export default function Recurring() {
    const store = useFinanceStore();
    const [recurring, setRecurring] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form
    const [form, setForm] = useState({ amount: '', type: 'expense', day_of_month: '1', category_id: '', account_id: '', comment: '' });

    // Load Data
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('recurring_transactions').select('*').order('day_of_month');
            if (data) setRecurring(data);
        };
        load();
    }, [store.transactions]); // Reload when transactions change (e.g. after manual run check)

    const handleCreate = async () => {
        if (!form.amount || !form.category_id || !form.account_id) return;

        const res = await store.addRecurring(form);
        if (res.success) {
            toast.success('Подписка создана');
            setIsCreateModalOpen(false);
            setForm({ amount: '', type: 'expense', day_of_month: '1', category_id: '', account_id: '', comment: '' });
            // Reload
            const { data } = await supabase.from('recurring_transactions').select('*').order('day_of_month');
            setRecurring(data || []);
        } else {
            toast.error('Ошибка создания');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Отменить подписку?')) return;
        await store.deleteRecurring(id);
        setRecurring(recurring.filter(r => r.id !== id));
        toast.success('Подписка отменена');
    };

    const runningTotal = recurring.reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in custom-scrollbar pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Calendar strokeWidth={2.5} /></span>
                        Регулярные платежи
                    </h1>
                    <p className="text-zinc-500 mt-1">Подписки, аренда и зарплаты</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>Добавить</Button>
            </div>

            {/* SUMMARY CARD */}
            <GlassCard className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 opacity-80 mb-2 font-bold text-xs uppercase tracking-wider">
                            <Clock size={16} strokeWidth={2.5} /> Ежемесячная нагрузка
                        </div>
                        <div className="text-4xl font-black">
                            {new Intl.NumberFormat('uz-UZ').format(runningTotal)} <span className="text-xl opacity-70">UZS</span>
                        </div>
                        <div className="mt-2 text-sm opacity-80 font-medium">
                            Всего {recurring.length} активных платежей
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center animate-pulse">
                        <Zap size={24} className="text-yellow-300 fill-current" strokeWidth={2.5} />
                    </div>
                </div>
            </GlassCard>

            {/* LIST */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recurring.map(item => {
                    const cat = store.categories.find(c => c.id === item.category_id);
                    const acc = store.accounts.find(a => a.id === item.account_id);
                    const isExpense = item.type === 'expense';

                    return (
                        <GlassCard key={item.id} className="group relative flex flex-col justify-between min-h-[160px]">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                                            {cat?.icon || '📅'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900 truncate max-w-[120px]">
                                                {item.comment || cat?.name}
                                            </div>
                                            <div className="text-xs text-zinc-500 font-bold flex items-center gap-1">
                                                <Calendar size={10} strokeWidth={2.5} /> {item.day_of_month}-го числа
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 p-2 rounded-lg mb-4 border border-zinc-100">
                                    <span className="font-bold">Карта:</span> {acc?.name}
                                </div>
                            </div>

                            <div className={`text-2xl font-black ${isExpense ? 'text-zinc-900' : 'text-emerald-600'}`}>
                                {isExpense ? '-' : '+'}{new Intl.NumberFormat('uz-UZ').format(item.amount)}
                                <span className="text-xs text-zinc-400 ml-1 font-bold">UZS</span>
                            </div>
                        </GlassCard>
                    );
                })}

                {recurring.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50">
                        <Zap size={48} className="mx-auto mb-4 opacity-20" strokeWidth={1} />
                        <h3 className="font-bold text-lg text-zinc-500">Нет подписок</h3>
                        <p className="text-sm text-zinc-400">Netflix, Spotify, Аренда — добавьте их сюда.</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>Добавить</Button>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Новая подписка">
                <div className="space-y-4">
                    <input
                        type="number"
                        placeholder="Сумма"
                        className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-2xl text-center text-zinc-900 focus:border-indigo-500 shadow-sm"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Категория</label>
                            <select
                                className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
                                value={form.category_id}
                                onChange={e => setForm({ ...form, category_id: e.target.value })}
                            >
                                <option value="">Выбрать...</option>
                                {store.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Счет</label>
                            <select
                                className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
                                value={form.account_id}
                                onChange={e => setForm({ ...form, account_id: e.target.value })}
                            >
                                <option value="">Выбрать...</option>
                                {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">День списания</label>
                            <div className="relative">
                                <input
                                    type="number" min="1" max="31"
                                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none pl-10 text-zinc-900 focus:border-indigo-500 shadow-sm"
                                    value={form.day_of_month}
                                    onChange={e => setForm({ ...form, day_of_month: e.target.value })}
                                />
                                <Calendar size={18} className="absolute left-3 top-3.5 text-zinc-400" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Тип</label>
                            <select
                                className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="expense">Расход</option>
                                <option value="income">Доход</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Название (опц.)</label>
                        <input
                            placeholder="Например: Netflix"
                            className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm"
                            value={form.comment}
                            onChange={e => setForm({ ...form, comment: e.target.value })}
                        />
                    </div>

                    <Button onClick={handleCreate} className="w-full py-4 text-lg mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">Активировать подписку</Button>
                </div>
            </Modal>
        </div>
    );
}