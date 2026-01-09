import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EMOJI_ICONS = ['👤', '👨‍💼', '👩‍💼', '🏢', '🏛️', '🏪', '🏦', '💼', '🤝', '👥', '🏭', '🏗️'];
const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#ec4899', '#6366f1'];

export default function CounterpartyModal({ isOpen, onClose, onSubmit, initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'company',
        icon: '👤',
        color: '#6366f1',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                type: 'company',
                icon: '👤',
                color: '#6366f1',
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Заголовок */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black">
                        {initialData ? 'Изменить контрагента' : 'Новый контрагент'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Имя */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Название *
                        </label>
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ООО Компания / Иван Иванов"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Тип */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Тип
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'person', label: '👤 Человек' },
                                { value: 'company', label: '🏢 Компания' },
                                { value: 'organization', label: '🏛️ Организация' }
                            ].map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.value })}
                                    className={`p-3 rounded-xl font-medium transition ${formData.type === type.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Иконка */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Иконка
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {EMOJI_ICONS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon: emoji })}
                                    className={`p-3 text-2xl rounded-xl transition ${formData.icon === emoji
                                            ? 'bg-blue-100 ring-2 ring-blue-500'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Цвет */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Цвет
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-10 h-10 rounded-xl transition ${formData.color === color
                                            ? 'ring-2 ring-offset-2 ring-gray-900'
                                            : 'hover:scale-110'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Заметки */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Заметки
                        </label>
                        <textarea
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Дополнительная информация..."
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Кнопки */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition"
                        >
                            {initialData ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
