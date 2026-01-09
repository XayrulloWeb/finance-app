import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import TransactionItem from '../components/TransactionItem';
import { Filter, X, Search, ArrowUpDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

export default function History() {
  const store = useFinanceStore();
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount_desc', 'amount_asc'
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Фильтрация транзакций
  let filteredTransactions = store.transactions.filter(t => {
    if (filterAccount !== 'all' && t.account_id !== filterAccount) return false;
    if (filterCategory !== 'all' && t.category_id !== filterCategory) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;

    // Поиск по комментарию
    if (searchQuery && !t.comment?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Фильтр по сумме
    if (minAmount && t.amount < Number(minAmount)) return false;
    if (maxAmount && t.amount > Number(maxAmount)) return false;

    return true;
  });

  // Сортировка
  if (sortBy === 'amount_desc') {
    filteredTransactions = [...filteredTransactions].sort((a, b) => b.amount - a.amount);
  } else if (sortBy === 'amount_asc') {
    filteredTransactions = [...filteredTransactions].sort((a, b) => a.amount - b.amount);
  }

  // Группировка по дате
  const groupedTransactions = filteredTransactions.reduce((groups, t) => {
    try {
      const date = format(parseISO(t.date), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
      return groups;
    } catch {
      return groups;
    }
  }, {});

  const clearFilters = () => {
    setFilterAccount('all');
    setFilterCategory('all');
    setFilterType('all');
    setSearchQuery('');
    setSortBy('date');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = filterAccount !== 'all' || filterCategory !== 'all' || filterType !== 'all' || searchQuery || minAmount || maxAmount || sortBy !== 'date';

  // Статистика
  const biggestExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((max, t) => t.amount > max ? t.amount : max, 0);

  const avgAmount = filteredTransactions.length > 0
    ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">📜 История</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${showFilters || hasActiveFilters
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          <Filter size={20} />
          Фильтры
        </button>
      </div>

      {/* Поиск */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск по комментарию..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Сортировка */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <select
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="date">По дате (новые первые)</option>
            <option value="amount_desc">По сумме (больше → меньше)</option>
            <option value="amount_asc">По сумме (меньше → больше)</option>
          </select>
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Счет</label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={filterAccount}
                onChange={e => setFilterAccount(e.target.value)}
              >
                <option value="all">Все счета</option>
                {store.accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Категория</label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">Все категории</option>
                {store.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Тип</label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">Все типы</option>
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
                <option value="transfer_in">Перевод (вход)</option>
                <option value="transfer_out">Перевод (выход)</option>
              </select>
            </div>

            {/* Диапазон сумм */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Мин. сумма</label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Макс. сумма</label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Без лимита"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              <X size={16} />
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {/* Список транзакций */}
      {Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
            .map(([date, transactions]) => (
              <div key={date} className="space-y-3">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {format(parseISO(date), 'd MMMM yyyy', { locale: ru })}
                </div>
                {transactions.map(t => {
                  const cat = store.categories.find(c => c.id === t.category_id);
                  const acc = store.accounts.find(a => a.id === t.account_id);
                  const cp = store.counterparties.find(c => c.id === t.counterparty_id);
                  return <TransactionItem key={t.id} transaction={t} category={cat} account={acc} counterparty={cp} />;
                })}
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Нет транзакций</p>
          {hasActiveFilters && (
            <p className="text-sm mt-2">Попробуй изменить фильтры</p>
          )}
        </div>
      )}

      {/* Статистика внизу */}
      {filteredTransactions.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Всего транзакций</div>
            <div className="text-3xl font-black text-gray-900">{filteredTransactions.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Самая большая трата</div>
            <div className="text-3xl font-black text-red-600">
              {new Intl.NumberFormat('uz-UZ').format(biggestExpense)}
              <span className="text-sm text-gray-400 ml-1">UZS</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Средняя сумма</div>
            <div className="text-3xl font-black text-blue-600">
              {new Intl.NumberFormat('uz-UZ').format(Math.round(avgAmount))}
              <span className="text-sm text-gray-400 ml-1">UZS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}