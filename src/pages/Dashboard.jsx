import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, TrendingUp, TrendingDown, ArrowRightLeft, Wallet, CreditCard, ChevronRight, Eye, EyeOff, Coffee, ShoppingCart, Car } from 'lucide-react';
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
  const isPrivacy = store.settings.isPrivacyEnabled;

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

  const openTxModal = (type = 'expense', categoryName = null) => {
    if (store.accounts.length === 0) return alert('Создайте счет перед добавлением операций');

    let categoryId = '';
    if (categoryName) {
      const found = store.categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()) && c.type === type);
      if (found) categoryId = found.id;
    }

    setTxForm(prev => ({
      ...prev,
      type,
      account_id: store.accounts[0]?.id || '',
      category_id: categoryId,
      amount: ''
    }));
    setActiveModal('transaction');
  };

  const QuickAction = ({ icon: Icon, label, category }) => (
    <button
      onClick={() => openTxModal('expense', category)}
      className="flex flex-col items-center gap-2 min-w-[80px]"
    >
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-zinc-200 hover:border-primary hover:bg-zinc-50 transition-all shadow-sm">
        <Icon size={24} className="text-zinc-700" strokeWidth={2} />
      </div>
      <span className="text-xs font-bold text-zinc-500">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* 1. HERO BALANCE CARD */}
      <GlassCard
        gradient
        className="relative overflow-hidden min-h-[220px] flex flex-col justify-center text-white p-8 shadow-2xl shadow-indigo-500/20"
        onClick={() => { }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2 opacity-90">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold tracking-wider uppercase">Общий капитал</span>
            </div>
            <button onClick={store.togglePrivacy} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              {isPrivacy ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl font-black mb-6 tracking-tight tabular-nums"
          >
            {isPrivacy ? '••••••' : new Intl.NumberFormat('ru-RU').format(Math.round(totalBalance))}
            <span className="text-3xl opacity-60 ml-3 font-bold">{store.settings.base_currency}</span>
          </motion.div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/20 rounded-lg border border-success/30 backdrop-blur-md">
              <TrendingUp size={16} className="text-success" strokeWidth={2.5} />
              <span className="text-emerald-100 font-bold text-sm tabular-nums">
                {isPrivacy ? '•••' : `+${new Intl.NumberFormat('ru-RU').format(store.getIncomeByPeriod('today'))}`}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-error/20 rounded-lg border border-error/30 backdrop-blur-md">
              <TrendingDown size={16} className="text-error" strokeWidth={2.5} />
              <span className="text-rose-100 font-bold text-sm tabular-nums">
                {isPrivacy ? '•••' : `-${new Intl.NumberFormat('ru-RU').format(store.getExpenseByPeriod('today'))}`}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. QUICK ACTIONS */}
      <section>
        <div className="flex overflow-x-auto gap-4 pb-4 px-1 custom-scrollbar">
          <QuickAction icon={Coffee} label="Кофе" category="Еда" />
          <QuickAction icon={ShoppingCart} label="Продукты" category="Продукты" />
          <QuickAction icon={Car} label="Транспорт" category="Транспорт" />
        </div>
      </section>

      {/* 3. ACCOUNTS CAROUSEL */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-primary" strokeWidth={2.5} /> Мои Счета
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
              <GlassCard className="h-full flex flex-col justify-between group hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border border-white/10" style={{ backgroundColor: acc.color + '20', color: acc.color }}>
                    {acc.icon || '💳'}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-700 rounded-lg">
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                </div>
                <div>
                  <div className="text-slate-500 text-sm font-bold mb-1">{acc.name}</div>
                  <div className="text-xl font-black text-white tabular-nums">
                    {isPrivacy ? '••••••' : new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(acc.id))}
                    <span className="text-xs text-slate-400 ml-1">{acc.currency}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/settings'}
            className="min-h-[140px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-300 rounded-2xl text-zinc-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold"
          >
            <Plus size={24} strokeWidth={2.5} />
            <span>Добавить счет</span>
          </motion.button>
        </div>
      </section>

      {/* 4. RECENT TRANSACTIONS */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 px-1">Последние операции</h2>
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
          className="w-12 h-12 bg-slate-800 text-white rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center"
        >
          <ArrowRightLeft size={20} strokeWidth={2.5} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => openTxModal('income')}
          className="w-12 h-12 bg-success text-slate-900 rounded-2xl shadow-lg shadow-success/30 flex items-center justify-center"
        >
          <TrendingUp size={20} strokeWidth={2.5} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => openTxModal('expense')}
          className="w-16 h-16 bg-primary text-white rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center"
        >
          <Plus size={32} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* --- MODALS --- */}

      {/* TRANSACTION MODAL */}
      <Modal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} title={txForm.type === 'income' ? 'Новый Доход' : 'Новый Расход'}>
        <div className="space-y-6">
          {/* 1. TYPE SWITCHER */}
          <div className="flex bg-zinc-100 p-1.5 rounded-xl">
            <button onClick={() => setTxForm({ ...txForm, type: 'expense', category_id: null, counterparty_id: null })} className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${txForm.type === 'expense' ? 'bg-white shadow text-error' : 'text-zinc-500'}`}>Расход</button>
            <button onClick={() => setTxForm({ ...txForm, type: 'income', category_id: null, counterparty_id: null })} className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${txForm.type === 'income' ? 'bg-white shadow text-success' : 'text-zinc-500'}`}>Доход</button>
          </div>

          {/* 2. AMOUNT */}
          <div className="relative">
            <input
              type="number"
              autoFocus
              placeholder="0"
              className={`w-full text-5xl font-black p-4 bg-transparent border-b-2 outline-none text-center transition-colors tabular-nums ${txForm.type === 'expense' ? 'text-error border-error/50' : 'text-success border-success/50'}`}
              value={txForm.amount}
              onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
            />
            <div className="text-center text-xs font-bold text-slate-400 uppercase mt-1">Сумма ({store.accounts.find(a => a.id === txForm.account_id)?.currency || store.settings.base_currency})</div>
          </div>

          {/* 3. LOGIC FLOW: From -> To (or To -> From) */}
          <div className="space-y-4">
            {/* SOURCE (Account) */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">{txForm.type === 'expense' ? 'Списать со счета' : 'Зачислить на счет'}</label>
              <select
                className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
                value={txForm.account_id}
                onChange={e => setTxForm({ ...txForm, account_id: e.target.value })}
              >
                {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(a.id))} {a.currency})</option>)}
              </select>
            </div>

            {/* DESTINATION (Category or Counterparty) */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">{txForm.type === 'expense' ? 'На что / Кому' : 'Откуда пришло'}</label>

              {/* TABS for Dest */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => { setTxMode('category'); setTxForm({ ...txForm, counterparty_id: null }); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${txMode === 'category' ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-500'}`}
                >
                  Категория
                </button>
                <button
                  onClick={() => { setTxMode('counterparty'); setTxForm({ ...txForm, category_id: null }); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${txMode === 'counterparty' ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-500'}`}
                >
                  Человек / Компания
                </button>
              </div>

              {txMode === 'category' ? (
                <select
                  className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
                  value={txForm.category_id || ''}
                  onChange={e => setTxForm({ ...txForm, category_id: e.target.value, counterparty_id: null })}
                >
                  <option value="">Выберите категорию...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              ) : (
                <select
                  className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
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
            <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Дата и Комментарий</label>
            <div className="flex gap-2">
              <input type="date" className="p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
              <input type="text" placeholder="..." className="flex-1 p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm" value={txForm.comment} onChange={e => setTxForm({ ...txForm, comment: e.target.value })} />
            </div>
          </div>

          <Button onClick={handleAddTransaction} variant={txForm.type === 'expense' ? 'danger' : 'success'} className="w-full py-4 text-lg">
            {txForm.type === 'expense' ? 'Списать' : 'Зачислить'}
          </Button>
        </div>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal isOpen={activeModal === 'transfer'} onClose={() => setActiveModal(null)} title="Перевод между счетами">
        <div className="space-y-6">
          <input type="number" placeholder="Сумма перевода" className="w-full text-4xl font-black p-4 bg-white border border-zinc-200 rounded-2xl mb-4 text-center outline-none text-zinc-900 tabular-nums shadow-sm" value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} autoFocus />

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Откуда</label>
              <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm" value={transferForm.fromAccountId} onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}>
                <option value="">Счет...</option>
                {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <ArrowRightLeft className="text-zinc-400 mt-5" />
            <div className="flex-1">
              <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Куда</label>
              <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm" value={transferForm.toAccountId} onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })}>
                <option value="">Счет...</option>
                {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <Button onClick={handleAddTransfer} className="w-full py-4 text-lg bg-zinc-900 text-white hover:bg-zinc-800">Перевести средства</Button>
        </div>
      </Modal>

    </div>
  );
}