import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import CounterpartyCard from '../components/CounterpartyCard';
import CounterpartyModal from '../components/CounterpartyModal';
import { Plus, Search, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next'; // Import hook

export default function Counterparties() {
    const { t } = useTranslation(); // Init hook
    const { counterparties, createCounterparty, updateCounterparty } = useFinanceStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCounterparty, setEditingCounterparty] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSubmit = async (formData) => {
        if (editingCounterparty) {
            await updateCounterparty(editingCounterparty.id, formData);
        } else {
            await createCounterparty(formData);
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
        <div className="p-6 max-w-7xl mx-auto pb-24 animate-fade-in custom-scrollbar">
            {/* Заголовок и поиск */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-black text-zinc-900">📇 {t('counterparties.title')}</h1>
                    <Button
                        onClick={handleAdd}
                        icon={Plus}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white justify-center"
                    >
                        {t('counterparties.add')}
                    </Button>
                </div>

                {/* Поиск */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={20} strokeWidth={2.5} />
                    <input
                        type="text"
                        placeholder={t('counterparties.search_placeholder')}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-zinc-100 rounded-xl outline-none focus:border-indigo-500 text-zinc-900 placeholder-zinc-400 font-medium transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Избранные */}
            {favoriteCounterparties.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Star size={20} className="text-amber-500" fill="currentColor" strokeWidth={2.5} />
                        <h2 className="text-xl font-bold text-zinc-900">{t('counterparties.favorites')}</h2>
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
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">
                        {t('counterparties.all')} ({regularCounterparties.length})
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
                <div className="col-span-full py-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50
            flex flex-col items-center justify-center gap-4">
                    {searchQuery ? (
                        <div>
                            <Search size={48} className="mx-auto mb-4 text-zinc-400 border-2 border-zinc-200 rounded-full p-2" strokeWidth={1} />
                            <p className="text-xl text-zinc-400 mb-2 font-bold">{t('counterparties.empty_search')}</p>
                            <p className="text-sm text-zinc-500">{t('counterparties.empty_search_desc')}</p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-6xl mb-4 grayscale opacity-50">📇</div>
                            <p className="text-xl font-bold text-zinc-400 mb-2">{t('counterparties.empty_list')}</p>
                            <p className="text-sm text-zinc-500 mb-6">
                                {t('counterparties.empty_list_desc')}
                            </p>
                            <Button
                                onClick={handleAdd}
                                icon={Plus}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {t('counterparties.add_first')}
                            </Button>
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
