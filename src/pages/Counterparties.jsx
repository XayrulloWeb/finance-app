import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import CounterpartyCard from '../components/CounterpartyCard';
import CounterpartyModal from '../components/CounterpartyModal';
import { Plus, Search, Star } from 'lucide-react';

export default function Counterparties() {
    const { counterparties, createCounterparty, updateCounterparty } = useFinanceStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCounterparty, setEditingCounterparty] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSubmit = async (formData) => {
        if (editingCounterparty) {
            await updateCounterparty(editingCounterparty.id, formData);
        } else {
            await createCounterparty(
                formData.name,
                formData.type,
                formData.icon,
                formData.color,
                formData.notes
            );
        }
        setEditingCounterparty(null);
    };

    const handleEdit = (counterparty) => {
        setEditingCounterparty(counterparty);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCounterparty(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCounterparty(null);
    };

    // Фильтрация по поиску
    const filteredCounterparties = counterparties.filter(cp =>
        cp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Разделяем на избранные и обычные
    const favoriteCounterparties = filteredCounterparties.filter(cp => cp.favorite);
    const regularCounterparties = filteredCounterparties.filter(cp => !cp.favorite);

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24">
            {/* Заголовок и поиск */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-black">📇 Контрагенты</h1>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition"
                    >
                        <Plus size={20} />
                        Добавить
                    </button>
                </div>

                {/* Поиск */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Избранные */}
            {favoriteCounterparties.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Star size={20} className="text-yellow-500" fill="currentColor" />
                        <h2 className="text-xl font-bold text-gray-900">Избранные</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteCounterparties.map(cp => (
                            <CounterpartyCard key={cp.id} counterparty={cp} onEdit={handleEdit} />
                        ))}
                    </div>
                </div>
            )}

            {/* Все контрагенты */}
            {regularCounterparties.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Все контрагенты ({regularCounterparties.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {regularCounterparties.map(cp => (
                            <CounterpartyCard key={cp.id} counterparty={cp} onEdit={handleEdit} />
                        ))}
                    </div>
                </div>
            )}

            {/* Пустое состояние */}
            {filteredCounterparties.length === 0 && (
                <div className="text-center py-20">
                    {searchQuery ? (
                        <div>
                            <p className="text-xl text-gray-400 mb-2">Ничего не найдено</p>
                            <p className="text-sm text-gray-400">Попробуй изменить запрос</p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-6xl mb-4">📇</div>
                            <p className="text-xl font-medium text-gray-400 mb-2">Нет контрагентов</p>
                            <p className="text-sm text-gray-400 mb-6">
                                Добавь людей и компании, с которыми работаешь
                            </p>
                            <button
                                onClick={handleAdd}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition"
                            >
                                <Plus size={20} />
                                Добавить первого контрагента
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Модалка */}
            <CounterpartyModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={editingCounterparty}
            />
        </div>
    );
}
