import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Filter, X, Search, ArrowUpDown, Calendar, CreditCard, Tag } from 'lucide-react';
import TransactionItem from '../components/TransactionItem';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { motion, AnimatePresence } from 'framer-motion';

export default function History() {
  const store = useFinanceStore();
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

    // 5. Sort
    return result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [store.transactions, filterAccount, filterCategory, filterType, searchQuery, sortBy]);

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
  };

  const hasActiveFilters = filterAccount !== 'all' || filterCategory !== 'all' || filterType !== 'all' || searchQuery;

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in custom-scrollbar">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">История</h1>
          <p className="text-gray-500 dark:text-gray-400">Все ваши финансовые движения</p>
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
          <Search className="text-gray-500 group-focus-within:text-blue-500 transition-colors" size={22} />
        </div>
        <input
          className="w-full pl-12 pr-12 py-4 bg-[#151e32] border-2 border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:border-blue-600 focus:bg-[#1a253a] transition-all text-lg font-medium shadow-lg"
          placeholder="Поиск по расходам, доходам..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
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
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Счет</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none appearance-none"
                      value={filterAccount}
                      onChange={e => setFilterAccount(e.target.value)}
                    >
                      <option value="all">Все счета</option>
                      {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <CreditCard size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Категория</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none appearance-none"
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                    >
                      <option value="all">Все категории</option>
                      {store.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Tag size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Тип операции</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none appearance-none"
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                    >
                      <option value="all">Все типы</option>
                      <option value="income">🟢 Доход</option>
                      <option value="expense">🔴 Расход</option>
                      <option value="transfer">🔄 Перевод</option>
                    </select>
                    <ArrowUpDown size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="text-sm font-bold text-gray-500">
                  Найдено: {filteredTransactions.length}
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm font-bold text-red-500 hover:underline">
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
              <div className="sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-2 px-1 z-10 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="font-bold text-gray-500 dark:text-gray-400 uppercase text-sm">
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
            <Search size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold">Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}