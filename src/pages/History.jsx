import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Filter, X, Search, ArrowUpDown, Calendar, CreditCard, Tag } from 'lucide-react';
import TransactionItem from '../components/TransactionItem';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { motion, AnimatePresence } from 'framer-motion';

export default function History() {
  const store = useFinanceStore();
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);

  // --- FILTER & SEARCH LOGIC ---
  const filteredTransactions = useMemo(() => {
    let result = store.transactions;

    // 1. Account
    if (filterAccount !== 'all') {
      result = result.filter(t => t.account_id === filterAccount);
    }
    // 2. Category
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category_id === filterCategory);
    }
    // 3. Type
    if (filterType !== 'all') {
      if (filterType === 'transfer') {
        result = result.filter(t => t.type === 'transfer_in' || t.type === 'transfer_out');
      } else {
        result = result.filter(t => t.type === filterType);
      }
    }
    // 4. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.comment?.toLowerCase().includes(q) ||
        store.categories.find(c => c.id === t.category_id)?.name.toLowerCase().includes(q)
      );
    }

    // 5. Date Range
    if (filterDateFrom) {
      result = result.filter(t => t.date.split('T')[0] >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter(t => t.date.split('T')[0] <= filterDateTo);
    }

    // 6. Sort
    return result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [store.transactions, filterAccount, filterCategory, filterType, searchQuery, sortBy, filterDateFrom, filterDateTo]);

  // Group by Date for UI
  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, t) => {
      const date = t.date.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
      return groups;
    }, {});
  }, [filteredTransactions]);

  const clearFilters = () => {
    setFilterAccount('all');
    setFilterCategory('all');
    setFilterType('all');
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = filterAccount !== 'all' || filterCategory !== 'all' || filterType !== 'all' || searchQuery || filterDateFrom || filterDateTo;

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in custom-scrollbar">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">История</h1>
          <p className="text-zinc-500">Все ваши финансовые движения</p>
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          icon={Filter}
          onClick={() => setShowFilters(!showFilters)}
        >
          Фильтры
        </Button>
      </div>

      {/* SEARCH BAR (FIXED) */}
      <div className="mb-8 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={22} strokeWidth={2.5} />
        </div>
        <input
          className="w-full pl-12 pr-12 py-4 bg-white border-2 border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 transition-all text-lg font-medium shadow-sm outline-none"
          placeholder="Поиск по расходам, доходам..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* FILTER PANEL */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <GlassCard className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Account Filter */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Счет</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 pl-10 bg-white border border-zinc-200 rounded-xl font-bold outline-none appearance-none text-zinc-900 shadow-sm focus:border-indigo-500"
                      value={filterAccount}
                      onChange={e => setFilterAccount(e.target.value)}
                    >
                      <option value="all">Все счета</option>
                      {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <CreditCard size={16} className="absolute left-3 top-3.5 text-zinc-400" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Категория</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 pl-10 bg-white border border-zinc-200 rounded-xl font-bold outline-none appearance-none text-zinc-900 shadow-sm focus:border-indigo-500"
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                    >
                      <option value="all">Все категории</option>
                      {store.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Tag size={16} className="absolute left-3 top-3.5 text-zinc-400" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Тип операции</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 pl-10 bg-white border border-zinc-200 rounded-xl font-bold outline-none appearance-none text-zinc-900 shadow-sm focus:border-indigo-500"
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                    >
                      <option value="all">Все типы</option>
                      <option value="income">🟢 Доход</option>
                      <option value="expense">🔴 Расход</option>
                      <option value="transfer">🔄 Перевод</option>
                    </select>
                    <ArrowUpDown size={16} className="absolute left-3 top-3.5 text-zinc-400" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Date Filter */}
                <div className="md:col-span-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">С даты</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500"
                      value={filterDateFrom}
                      onChange={e => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">По дату</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500"
                      value={filterDateTo}
                      onChange={e => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-zinc-200 pt-3">
                <div className="text-sm font-bold text-zinc-500">
                  Найдено: {filteredTransactions.length}
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm font-bold text-error hover:underline">
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIST */}
      <div className="space-y-6">
        {Object.entries(groupedTransactions)
          .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
          .map(([date, items]) => (
            <div key={date}>
              <div className="sticky top-0 bg-zinc-50/95 backdrop-blur-sm py-2 px-1 z-10 mb-2 flex items-center gap-2 border-b border-zinc-200">
                <Calendar size={16} className="text-indigo-600" strokeWidth={2.5} />
                <span className="font-bold text-zinc-500 uppercase text-sm">
                  {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: ru })}
                </span>
              </div>
              <div className="space-y-3">
                {items.map(t => {
                  const cat = store.categories.find(c => c.id === t.category_id);
                  const acc = store.accounts.find(a => a.id === t.account_id);
                  const cp = store.counterparties.find(c => c.id === t.counterparty_id);
                  return <TransactionItem key={t.id} transaction={t} category={cat} account={acc} counterparty={cp} />;
                })}
              </div>
            </div>
          ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <Search size={64} className="mx-auto mb-4 text-zinc-300" strokeWidth={1} />
            <h3 className="text-xl font-bold text-zinc-400">Ничего не найдено</h3>
            <p className="text-zinc-500">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}