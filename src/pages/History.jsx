import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Filter, X, Search, ArrowUpDown, Calendar, CreditCard, Tag, Loader, ChevronDown } from 'lucide-react';
import TransactionItem from '../components/TransactionItem';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionModal from '../components/modals/TransactionModal';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function History() {
    // --- 1. ИСПРАВЛЕНИЕ: Получаем нужные части стора с помощью селекторов ---
    // Это гарантирует, что компонент будет перерисовываться только при изменении этих конкретных полей.
    // Функции из Zustand стабильны по своей природе.
    const {
        transactions,
        categories,
        accounts,
        counterparties,
        fetchTransactions: fetchFromStore, // Переименовываем, чтобы не было конфликта имен
        currentPage,
        isLoadingTransactions,
        hasMore,
    } = useFinanceStore();

    const [filters, setFilters] = useState({
        account_id: 'all', category_id: 'all', type: 'all',
        search: '', dateFrom: '', dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);

    const handleEdit = (tx) => setEditingTransaction(tx);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(filters.search), 500);
        return () => clearTimeout(handler);
    }, [filters.search]);

    // --- 2. ИСПРАВЛЕНИЕ: Убираем нестабильный объект 'store' из зависимостей ---
    // Теперь `useCallback` зависит только от стабильных функций и примитивов.
    const fetchTransactions = useCallback((isAppend = false) => {
        fetchFromStore({
            page: isAppend ? currentPage + 1 : 0,
            limit: 20,
            filters: { ...filters, search: debouncedSearch },
            append: isAppend,
        });
    }, [filters, debouncedSearch, fetchFromStore, currentPage]);

    // --- 3. ИСПРАВЛЕНИЕ: Добавляем fetchTransactions в зависимости useEffect ---
    // Теперь это безопасно, так как функция fetchTransactions стала стабильной.
    useEffect(() => {
        fetchTransactions(false);
    }, [filters.account_id, filters.category_id, filters.type, filters.dateFrom, filters.dateTo, debouncedSearch, fetchTransactions]);

    const handleLoadMore = () => fetchTransactions(true);
    const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const clearFilters = () => setFilters({
        account_id: 'all', category_id: 'all', type: 'all',
        search: '', dateFrom: '', dateTo: ''
    });

    const groupedTransactions = useMemo(() => transactions.reduce((groups, t) => {
        const date = t.date.split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(t);
        return groups;
    }, {}), [transactions]);

    const flattenedData = useMemo(() => {
        const flatData = [];
        Object.entries(groupedTransactions)
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
            .forEach(([date, items]) => {
                flatData.push({ type: 'header', date });
                items.forEach(item => flatData.push({ type: 'transaction', transaction: item }));
            });
        return flatData;
    }, [groupedTransactions]);

    const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

    const parentRef = useRef(null);
    const rowVirtualizer = useVirtualizer({
        count: flattenedData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => flattenedData[index].type === 'header' ? 55 : 95,
        overscan: 5,
    });

    return (
        <div className="max-w-4xl mx-auto pb-4 animate-fade-in custom-scrollbar h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900">История</h1>
                    <p className="text-zinc-500">Все ваши финансовые движения</p>
                </div>
                <Button variant={showFilters ? 'primary' : 'outline'} icon={Filter} onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-indigo-600 text-white' : ''}>Фильтры</Button>
            </div>

            <div className="mb-8 relative group px-1">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><Search className="text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={22} strokeWidth={2.5} /></div>
                <input className="w-full pl-12 pr-12 py-4 bg-white border-2 border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 transition-all text-lg font-medium shadow-sm outline-none" placeholder="Поиск по расходам, доходам..." value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
                {filters.search && <button onClick={() => updateFilter('search', '')} className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-error transition-colors"><X size={20} strokeWidth={2.5} /></button>}
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6 px-1">
                        <GlassCard className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Счет</label>
                                    <div className="relative">
                                        <select className="w-full p-3 pl-10 bg-white border border-zinc-200 rounded-xl font-bold outline-none appearance-none text-zinc-900 shadow-sm focus:border-indigo-500 cursor-pointer" value={filters.account_id} onChange={e => updateFilter('account_id', e.target.value)}>
                                            <option value="all">Все счета</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                        <CreditCard size={16} className="absolute left-3 top-3.5 text-zinc-400" strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Категория</label>
                                    <div className="relative">
                                        <select className="w-full p-3 pl-10 bg-white border border-zinc-200 rounded-xl font-bold outline-none appearance-none text-zinc-900 shadow-sm focus:border-indigo-500 cursor-pointer" value={filters.category_id} onChange={e => updateFilter('category_id', e.target.value)}>
                                            <option value="all">Все категории</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <Tag size={16} className="absolute left-3 top-3.5 text-zinc-400" strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Тип операции</label>
                                    <div className="relative">
                                        <select className="w-full p-3 pl-10 bg-white border border-zinc-200 rounded-xl font-bold outline-none appearance-none text-zinc-900 shadow-sm focus:border-indigo-500 cursor-pointer" value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
                                            <option value="all">Все типы</option>
                                            <option value="income">🟢 Доход</option>
                                            <option value="expense">🔴 Расход</option>
                                            <option value="transfer">🔄 Перевод</option>
                                        </select>
                                        <ArrowUpDown size={16} className="absolute left-3 top-3.5 text-zinc-400" strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">С даты</label>
                                        <input type="date" className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500" value={filters.dateFrom} onChange={e => updateFilter('dateFrom', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">По дату</label>
                                        <input type="date" className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500" value={filters.dateTo} onChange={e => updateFilter('dateTo', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-zinc-200 pt-3">
                                <div className="text-sm font-bold text-zinc-500">Найдено: {transactions.length}</div>
                                {hasActiveFilters && <button onClick={clearFilters} className="text-sm font-bold text-rose-500 hover:text-rose-600 hover:underline">Сбросить фильтры</button>}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={parentRef} className="flex-grow min-h-0 mt-4" style={{ overflowY: 'auto' }}>
                {transactions.length > 0 ? (
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const item = flattenedData[virtualItem.index];
                            const t = item.transaction;
                            return (
                                <div key={virtualItem.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}>
                                    {item.type === 'header' ? (
                                        <div className="flex items-center px-1 py-3 z-10">
                                            <div className="bg-[#f3f4f6]/95 backdrop-blur-sm flex items-center gap-2 border-b border-zinc-200 w-full pb-2">
                                                <Calendar size={16} className="text-indigo-600" strokeWidth={2.5} />
                                                <span className="font-bold text-zinc-500 uppercase text-sm">{format(parseISO(item.date), 'd MMMM yyyy, EEEE', { locale: ru })}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-1 py-1 h-full">
                                            <TransactionItem transaction={t} category={categories.find(c => c.id === t.category_id)} account={accounts.find(a => a.id === t.account_id)} counterparty={counterparties.find(c => c.id === t.counterparty_id)} onEdit={handleEdit} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : isLoadingTransactions ? (
                    <div className="flex justify-center py-12"><Loader className="animate-spin text-indigo-500" size={32} /></div>
                ) : (
                    <div className="text-center py-20 opacity-50 border-2 border-dashed border-zinc-300 rounded-3xl mx-1">
                        <Search size={64} className="mx-auto mb-4 text-zinc-300" strokeWidth={1} />
                        <h3 className="text-xl font-bold text-zinc-400">Ничего не найдено</h3>
                        <p className="text-zinc-500">Попробуйте изменить параметры поиска</p>
                    </div>
                )}
            </div>

            {!isLoadingTransactions && hasMore && transactions.length > 0 && (
                <div className="flex justify-center pt-4"><Button onClick={handleLoadMore} icon={ChevronDown}>Загрузить еще</Button></div>
            )}

            <TransactionModal isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} editingTransaction={editingTransaction} />
        </div>
    );
}