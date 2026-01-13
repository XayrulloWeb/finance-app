import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useFinanceStore } from '../../store/useFinanceStore';

const ICONS = ['💳', '💰', '🏦', '📱', '💵', '💎', '🐷', 'safe'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#18181b'];

export default function AccountModal({ isOpen, onClose }) {
    const { createAccount, settings } = useFinanceStore();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        currency: settings.base_currency,
        color: COLORS[0],
        icon: ICONS[0],
        initialBalance: ''
    });

    // Сброс формы при открытии
    useEffect(() => {
        if (isOpen) {
            setForm({
                name: '',
                currency: settings.base_currency,
                color: COLORS[0],
                icon: ICONS[0],
                initialBalance: ''
            });
        }
    }, [isOpen, settings.base_currency]);

    const handleSubmit = async () => {
        if (!form.name) return;
        setLoading(true);

        const success = await createAccount(
            form.name,
            form.currency,
            form.color,
            form.icon,
            form.initialBalance ? parseFloat(form.initialBalance) : 0
        );

        setLoading(false);
        if (success) {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="➕ Новый Счет">
            <div className="space-y-6">
                {/* Icons */}
                <div>
                    <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase">Иконка</label>
                    <div className="flex flex-wrap gap-2">
                        {ICONS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => setForm({ ...form, icon: emoji })}
                                className={`w-10 h-10 text-xl rounded-xl border-2 transition-all flex items-center justify-center ${
                                    form.icon === emoji
                                        ? 'border-indigo-600 bg-indigo-50 scale-110'
                                        : 'border-zinc-200 hover:border-indigo-300'
                                }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Название</label>
                    <input
                        type="text"
                        placeholder="Например: Основная карта"
                        className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500 transition-colors"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        autoFocus
                    />
                </div>

                {/* Currency & Initial Balance */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Валюта</label>
                        <select
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm cursor-pointer"
                            value={form.currency}
                            onChange={e => setForm({ ...form, currency: e.target.value })}
                        >
                            <option value="UZS">UZS</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="RUB">RUB</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Начальный баланс</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500 transition-colors"
                            value={form.initialBalance}
                            onChange={e => setForm({ ...form, initialBalance: e.target.value })}
                        />
                    </div>
                </div>

                {/* Color */}
                <div>
                    <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase">Цвет карты</label>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setForm({ ...form, color })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    form.color === color ? 'border-zinc-900 scale-110 ring-2 ring-zinc-200' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <Button onClick={handleSubmit} className="w-full py-4 text-lg" loading={loading}>
                    Создать Счет
                </Button>
            </div>
        </Modal>
    );
}