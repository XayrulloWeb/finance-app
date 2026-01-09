import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import TransactionItem from '../components/TransactionItem';

export default function Dashboard() {
  const store = useFinanceStore();
  const [activeModal, setActiveModal] = useState(null); // 'transaction' or 'transfer'
  const [txForm, setTxForm] = useState({
    type: 'expense',
    amount: '',
    account_id: '',
    category_id: '',
    counterparty_id: '',
    comment: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    comment: ''
  });

  // Фильтр категорий
  const currentCategories = store.categories.filter(c => c.type === txForm.type);

  const handleAddTransaction = async () => {
    if (!txForm.amount || !txForm.account_id || !txForm.category_id) {
      return alert('Заполни все поля!');
    }
    const result = await store.addTransaction(txForm);
    if (result?.success) {
      setTxForm({ ...txForm, amount: '', comment: '' });
      setActiveModal(null);
    } else {
      alert(result?.error || 'Ошибка при сохранении');
    }
  };

  const handleAddTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) {
      return alert('Заполни все поля!');
    }
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      return alert('Выбери разные счета!');
    }
    const result = await store.addTransfer(
      transferForm.fromAccountId,
      transferForm.toAccountId,
      transferForm.amount,
      transferForm.comment
    );
    if (result?.success) {
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', comment: '' });
      setActiveModal(null);
    } else {
      alert(result?.error || 'Ошибка при переводе');
    }
  };

  const openTransactionModal = () => {
    if (store.accounts.length === 0) {
      return alert('Создай счет в Настройках!');
    }
    setTxForm(prev => ({ ...prev, account_id: store.accounts[0]?.id || '' }));
    setActiveModal('transaction');
  };

  const openTransferModal = () => {
    if (store.accounts.length < 2) {
      return alert('Нужно минимум 2 счета для перевода!');
    }
    setTransferForm({
      fromAccountId: store.accounts[0]?.id || '',
      toAccountId: store.accounts[1]?.id || '',
      amount: '',
      comment: ''
    });
    setActiveModal('transfer');
  };

  // Быстрая статистика
  const todayIncome = store.getIncomeByPeriod('today');
  const todayExpense = store.getExpenseByPeriod('today');
  const monthExpense = store.getExpenseByPeriod('month');

  return (
    <div className="p-6 max-w-6xl mx-auto pb-32 custom-scrollbar">
      {/* ОБЩИЙ БАЛАНС */}
      <div className="gradient-blue p-8 rounded-3xl shadow-xl mb-8 animate-fade-in">
        <div className="text-white/80 mb-2 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
          <TrendingUp size={16} />
          Мой Капитал
        </div>
        <div className="text-5xl font-black text-white mb-4">
          {new Intl.NumberFormat('uz-UZ').format(store.getTotalBalance())}
          <span className="text-2xl text-white/70 ml-2">UZS</span>
        </div>
      </div>

      {/* КАРТОЧКИ СЧЕТОВ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          💰 Мои Счета
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {store.accounts.map((acc, idx) => (
            <AccountCard
              key={acc.id}
              account={acc}
              balance={store.getAccountBalance(acc.id)}
              index={idx}
              onClick={() => { }}
            />
          ))}
        </div>
        {store.accounts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>Нет счетов. Создай свой первый счет в Настройках!</p>
          </div>
        )}
      </section>

      {/* БЫСТРАЯ СТАТИСТИКА */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📊 Быстрая Статистика
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp size={20} />
              <span className="text-sm font-semibold">Доход сегодня</span>
            </div>
            <div className="text-2xl font-black text-gray-900">
              +{new Intl.NumberFormat('uz-UZ').format(todayIncome)}
              <span className="text-sm text-gray-400 ml-1">UZS</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <TrendingDown size={20} />
              <span className="text-sm font-semibold">Расход сегодня</span>
            </div>
            <div className="text-2xl font-black text-gray-900">
              -{new Intl.NumberFormat('uz-UZ').format(todayExpense)}
              <span className="text-sm text-gray-400 ml-1">UZS</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Calendar size={20} />
              <span className="text-sm font-semibold">Расход за месяц</span>
            </div>
            <div className="text-2xl font-black text-gray-900">
              {new Intl.NumberFormat('uz-UZ').format(monthExpense)}
              <span className="text-sm text-gray-400 ml-1">UZS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ПОСЛЕДНИЕ ОПЕРАЦИИ */}
      <section>
        <h3 className="font-bold text-xl mb-4">📝 Последние операции</h3>
        <div className="space-y-3">
          {store.transactions.slice(0, 8).map(t => {
            const cat = store.categories.find(c => c.id === t.category_id);
            const acc = store.accounts.find(a => a.id === t.account_id);
            const cp = store.counterparties.find(c => c.id === t.counterparty_id);
            return <TransactionItem key={t.id} transaction={t} category={cat} account={acc} counterparty={cp} />;
          })}

          {store.transactions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Пока нет операций</p>
              <p className="text-sm mt-2">Нажми + чтобы добавить первую транзакцию</p>
            </div>
          )}
        </div>
      </section>

      {/* FAB МЕНЮ */}
      <div className="fixed bottom-24 sm:bottom-10 right-6 flex flex-col gap-3">
        <button
          onClick={openTransferModal}
          className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90"
          title="Перевод"
        >
          🔄
        </button>
        <button
          onClick={openTransactionModal}
          className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 animate-pulse-glow"
        >
          <Plus size={32} />
        </button>
      </div>

      {/* МОДАЛКА ТРАНЗАКЦИИ */}
      {activeModal === 'transaction' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <h3 className="font-bold text-2xl mb-4">Новая операция</h3>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => setTxForm({ ...txForm, type: 'expense', category_id: '' })}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${txForm.type === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-400'
                  }`}
              >
                Расход
              </button>
              <button
                onClick={() => setTxForm({ ...txForm, type: 'income', category_id: '' })}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${txForm.type === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-400'
                  }`}
              >
                Доход
              </button>
            </div>

            <input
              type="number"
              placeholder="Сумма"
              className="w-full text-3xl font-black p-4 bg-gray-50 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={txForm.amount}
              onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
            />

            <div className="space-y-3 mb-4">
              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={txForm.account_id}
                onChange={e => setTxForm({ ...txForm, account_id: e.target.value })}
              >
                {store.accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={txForm.category_id}
                onChange={e => setTxForm({ ...txForm, category_id: e.target.value })}
              >
                <option value="">Выбери категорию</option>
                {currentCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>

              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={txForm.counterparty_id}
                onChange={e => setTxForm({ ...txForm, counterparty_id: e.target.value })}
              >
                <option value="">{txForm.type === 'income' ? 'От кого? (необязательно)' : 'Кому? (необязательно)'}</option>
                {store.counterparties.map(cp => (
                  <option key={cp.id} value={cp.id}>
                    {cp.icon} {cp.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Комментарий (необязательно)"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={txForm.comment}
                onChange={e => setTxForm({ ...txForm, comment: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleAddTransaction}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПЕРЕВОДА */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
              🔄 Перевод между счетами
            </h3>

            <input
              type="number"
              placeholder="Сумма"
              className="w-full text-3xl font-black p-4 bg-gray-50 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-purple-500"
              value={transferForm.amount}
              onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
            />

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Откуда</label>
                <select
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={transferForm.fromAccountId}
                  onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                >
                  {store.accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="text-center text-2xl">↓</div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Куда</label>
                <select
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  value={transferForm.toAccountId}
                  onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                >
                  {store.accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Комментарий (необязательно)"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                value={transferForm.comment}
                onChange={e => setTransferForm({ ...transferForm, comment: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleAddTransfer}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
              >
                Перевести
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
