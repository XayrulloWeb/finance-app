import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, TrendingUp, TrendingDown, ArrowRightLeft, Wallet, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TransactionItem from '../components/TransactionItem';

export default function Dashboard() {
  const store = useFinanceStore();
  const [activeModal, setActiveModal] = useState(null); // 'transaction', 'transfer', 'addAccount'
  const [txMode, setTxMode] = useState('category'); // 'category', 'counterparty'

  // Forms
  const [txForm, setTxForm] = useState({
    type: 'expense', amount: '', account_id: '', category_id: '', counterparty_id: '', comment: '', date: new Date().toISOString().split('T')[0]
  });
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '', toAccountId: '', amount: '', comment: ''
  });

  const categories = store.categories.filter(c => c.type === txForm.type);
  const totalBalance = store.getTotalBalanceInBaseCurrency ? store.getTotalBalanceInBaseCurrency() : 0;

  // Handlers
  const handleAddTransaction = async () => {
    if (!txForm.amount || !txForm.account_id || !txForm.category_id) return;
    const success = await store.addTransaction(txForm);
    if (success) {
      setTxForm({ ...txForm, amount: '', comment: '' });
      setActiveModal(null);
    }
  };

  const handleAddTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return;
    const result = await store.addTransfer(transferForm.fromAccountId, transferForm.toAccountId, transferForm.amount, transferForm.comment);
    if (result?.success) {
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', comment: '' });
      setActiveModal(null);
    }
  };

  const openTxModal = (type = 'expense') => {
    if (store.accounts.length === 0) return alert('Создайте счет перед добавлением операций');
    setTxForm(prev => ({ ...prev, type, account_id: store.accounts[0]?.id || '' }));
    setActiveModal('transaction');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* 1. HERO BALANCE CARD */}
      <GlassCard
        gradient
        className="relative overflow-hidden min-h-[220px] flex flex-col justify-center text-white p-8"
        onClick={() => { }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
              <Wallet size={18} />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase">Общий капитал</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl font-black mb-4 tracking-tight"
          >
            {new Intl.NumberFormat('ru-RU').format(Math.round(totalBalance))}
            <span className="text-3xl opacity-60 ml-3 font-bold">{store.settings.base_currency}</span>
          </motion.div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30 backdrop-blur-md">
              <TrendingUp size={16} className="text-emerald-300" />
              <span className="text-emerald-100 font-bold text-sm">+{new Intl.NumberFormat('ru-RU').format(store.getIncomeByPeriod('today'))}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 rounded-lg border border-rose-500/30 backdrop-blur-md">
              <TrendingDown size={16} className="text-rose-300" />
              <span className="text-rose-100 font-bold text-sm">-{new Intl.NumberFormat('ru-RU').format(store.getExpenseByPeriod('today'))}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. ACCOUNTS CAROUSEL */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="text-blue-500" /> Мои Счета
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {store.accounts.map((acc, idx) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard className="h-full flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: acc.color + '20', color: acc.color }}>
                    {acc.icon || '💳'}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>
                <div>
                  <div className="text-gray-500 text-sm font-bold mb-1">{acc.name}</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(acc.id))}
                    <span className="text-xs text-gray-400 ml-1">{acc.currency}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/settings'}
            className="min-h-[140px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all font-bold"
          >
            <Plus size={24} />
            <span>Добавить счет</span>
          </motion.button>
        </div>
      </section>

      {/* 3. RECENT TRANSACTIONS */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-1">Последние операции</h2>
        <div className="space-y-3">
          {store.transactions.slice(0, 5).map(t => {
            const cat = store.categories.find(c => c.id === t.category_id);
            const acc = store.accounts.find(a => a.id === t.account_id);
            return <TransactionItem key={t.id} transaction={t} category={cat} account={acc} />;
          })}
        </div>
      </section>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-24 lg:bottom-10 right-6 flex flex-col gap-3 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setActiveModal('transfer')}
          className="w-12 h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center"
        >
          <ArrowRightLeft size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => openTxModal('income')}
          className="w-12 h-12 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center"
        >
          <TrendingUp size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => openTxModal('expense')}
          className="w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/40 flex items-center justify-center"
        >
          <Plus size={32} />
        </motion.button>
      </div>

      {/* --- MODALS --- */}

      {/* TRANSACTION MODAL */}
      <Modal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} title={txForm.type === 'income' ? 'Новый Доход' : 'Новый Расход'}>
        <div className="space-y-6">
          {/* 1. TYPE SWITCHER */}
          <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl">
            <button onClick={() => setTxForm({ ...txForm, type: 'expense', category_id: null, counterparty_id: null })} className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${txForm.type === 'expense' ? 'bg-white dark:bg-gray-600 shadow text-red-500' : 'text-gray-400'}`}>Расход</button>
            <button onClick={() => setTxForm({ ...txForm, type: 'income', category_id: null, counterparty_id: null })} className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${txForm.type === 'income' ? 'bg-white dark:bg-gray-600 shadow text-emerald-500' : 'text-gray-400'}`}>Доход</button>
          </div>

          {/* 2. AMOUNT */}
          <div className="relative">
            <input
              type="number"
              autoFocus
              placeholder="0"
              className={`w-full text-5xl font-black p-4 bg-transparent border-b-2 outline-none text-center transition-colors ${txForm.type === 'expense' ? 'text-red-500 border-red-100 dark:border-red-900/30' : 'text-emerald-500 border-emerald-100 dark:border-emerald-900/30'}`}
              value={txForm.amount}
              onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
            />
            <div className="text-center text-xs font-bold text-gray-400 uppercase mt-1">Сумма ({store.accounts.find(a => a.id === txForm.account_id)?.currency || store.settings.base_currency})</div>
          </div>

          {/* 3. LOGIC FLOW: From -> To (or To -> From) */}
          <div className="space-y-4">
            {/* SOURCE (Account) */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">{txForm.type === 'expense' ? 'Списать со счета' : 'Зачислить на счет'}</label>
              <select
                className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                value={txForm.account_id}
                onChange={e => setTxForm({ ...txForm, account_id: e.target.value })}
              >
                {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(a.id))} {a.currency})</option>)}
              </select>
            </div>

            {/* DESTINATION (Category or Counterparty) */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">{txForm.type === 'expense' ? 'На что / Кому' : 'Откуда пришло'}</label>

              {/* TABS for Dest */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => { setTxMode('category'); setTxForm({ ...txForm, counterparty_id: null }); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${txMode === 'category' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}
                >
                  Категория
                </button>
                <button
                  onClick={() => { setTxMode('counterparty'); setTxForm({ ...txForm, category_id: null }); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${txMode === 'counterparty' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}
                >
                  Человек / Компания
                </button>
              </div>

              {txMode === 'category' ? (
                <select
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                  value={txForm.category_id || ''}
                  onChange={e => setTxForm({ ...txForm, category_id: e.target.value, counterparty_id: null })}
                >
                  <option value="">Выберите категорию...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              ) : (
                <select
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none"
                  value={txForm.counterparty_id || ''}
                  onChange={e => setTxForm({ ...txForm, counterparty_id: e.target.value, category_id: null })}
                >
                  <option value="">Выберите контрагента...</option>
                  {store.counterparties.map(c => <option key={c.id} value={c.id}>{c.icon || '👤'} {c.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Дата и Комментарий</label>
            <div className="flex gap-2">
              <input type="date" className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
              <input type="text" placeholder="..." className="flex-1 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none" value={txForm.comment} onChange={e => setTxForm({ ...txForm, comment: e.target.value })} />
            </div>
          </div>

          <Button onClick={handleAddTransaction} className={`w-full py-4 text-lg ${txForm.type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
            {txForm.type === 'expense' ? 'Списать' : 'Зачислить'}
          </Button>
        </div>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal isOpen={activeModal === 'transfer'} onClose={() => setActiveModal(null)} title="Перевод между счетами">
        <div className="space-y-6">
          <input type="number" placeholder="Сумма перевода" className="w-full text-4xl font-black p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl mb-4 text-center outline-none" value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} autoFocus />

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Откуда</label>
              <select className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none" value={transferForm.fromAccountId} onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}>
                <option value="">Счет...</option>
                {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <ArrowRightLeft className="text-gray-400 mt-5" />
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Куда</label>
              <select className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none" value={transferForm.toAccountId} onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })}>
                <option value="">Счет...</option>
                {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <Button onClick={handleAddTransfer} className="w-full py-4 text-lg bg-black dark:bg-white dark:text-gray-900">Перевести средства</Button>
        </div>
      </Modal>

    </div>
  );
}