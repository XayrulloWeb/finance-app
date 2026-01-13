import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowRightLeft, Plus, TrendingUp, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TransactionItem from '../components/TransactionItem';
import GlassCard from '../components/ui/GlassCard';
import { toast } from '../components/ui/Toast';
import SkeletonLoader from '../components/ui/SkeletonLoader'; // Убедитесь, что импорт есть

// Components
import SmartAlerts from '../components/dashboard/SmartAlerts';
import BalanceCard from '../components/dashboard/BalanceCard';
import MonthlyStats from '../components/dashboard/MonthlyStats';
import TrendsChart from '../components/dashboard/TrendsChart';
import QuickActions from '../components/dashboard/QuickActions';
import AccountModal from '../components/modals/AccountModal';
import TransactionModal from '../components/modals/TransactionModal';

export default function Dashboard() {
  const store = useFinanceStore();

  // UI State
  const [activeModal, setActiveModal] = useState(null);
  const isPrivacy = store.settings?.isPrivacyEnabled || false;
  const currency = store.settings?.base_currency || 'UZS';

  // Transaction Modal State
  const [txProps, setTxProps] = useState({
    type: 'expense',
    categoryName: null,
    accountId: null
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    comment: ''
  });

  // --- 🔥 ЗАЩИТА: ПОКАЗЫВАЕМ СКЕЛЕТОНЫ ПРИ ЗАГРУЗКЕ ---
  if (store.loading && store.accounts.length === 0) {
    return (
        <div className="space-y-8 animate-fade-in pb-20 p-1">
          {/* Скелет для алертов и баланса */}
          <div className="space-y-4">
            <SkeletonLoader type="text" count={1} />
            <SkeletonLoader type="card" count={1} />
          </div>

          {/* Скелет для статистики */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonLoader type="stat" count={4} />
          </div>

          {/* Скелет для графика */}
          <SkeletonLoader type="chart" count={1} />

          {/* Скелет для счетов */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonLoader type="card" count={3} />
          </div>
        </div>
    );
  }

  // --- HANDLERS ---

  const handleAddTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId) return toast.error('Выберите счета');
    if (transferForm.fromAccountId === transferForm.toAccountId) return toast.error('Счета должны различаться');
    if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) return toast.error('Введите корректную сумму');

    const result = await store.addTransfer(
        transferForm.fromAccountId,
        transferForm.toAccountId,
        transferForm.amount,
        transferForm.comment
    );

    if (result?.success) {
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', comment: '' });
      setActiveModal(null);
    }
  };

  const openTxModal = (type = 'expense', categoryName = null, accountId = null) => {
    if (store.accounts.length === 0) return toast.error('Создайте счет перед добавлением операций');

    setTxProps({ type, categoryName, accountId });
    setActiveModal('transaction');
  };

  return (
      <div className="space-y-8 animate-fade-in pb-20">

        <SmartAlerts />
        <BalanceCard />
        <MonthlyStats />

        {/* Top Expense Categories */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">🔥 Куда уходят деньги</h2>
          </div>
          <GlassCard>
            <div className="space-y-4">
              {store.getTopExpenseCategories(3).map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{cat.icon}</div>
                        <div>
                          <div className="font-bold text-zinc-900">{cat.name}</div>
                          <div className="text-xs text-zinc-400">
                            {isPrivacy ? '•••••' : new Intl.NumberFormat('ru-RU').format(Math.round(cat.amount))} {currency}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-error">{cat.percentage}%</div>
                      </div>
                    </div>
                    <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div style={{ width: `${cat.percentage}%` }} className={`h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500`} />
                    </div>
                  </div>
              ))}
              {store.getTopExpenseCategories(3).length === 0 && <div className="text-center text-zinc-400 py-4 font-medium">Нет расходов за этот месяц</div>}
            </div>
          </GlassCard>
        </section>

        <QuickActions onAction={(type, cat) => openTxModal(type, cat)} />
        <TrendsChart />

        {/* Accounts List */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 mb-4 px-1 flex gap-2">
            <CreditCard className="text-primary" strokeWidth={2.5}/> Мои Счета
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {store.accounts.map((acc) => (
                <GlassCard
                    key={acc.id}
                    onClick={() => openTxModal('expense', null, acc.id)}
                    className="cursor-pointer hover:border-primary/50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gray-50 text-indigo-600 border border-gray-100">
                      {acc.icon}
                    </div>
                    <div className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                      {acc.currency}
                    </div>
                  </div>
                  <div className="font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors">
                    {acc.name}
                  </div>
                  <div className="text-xl font-black tabular-nums text-zinc-900">
                    {isPrivacy ? '••••' : new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(acc.id))}
                  </div>
                </GlassCard>
            ))}

            <button
                onClick={() => setActiveModal('addAccount')}
                className="min-h-[120px] border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold group"
            >
              <div className="p-3 rounded-full bg-zinc-100 group-hover:bg-primary/10 mb-2 transition-colors">
                <Plus size={24} className="text-zinc-400 group-hover:text-primary transition-colors"/>
              </div>
              <span>Добавить счет</span>
            </button>
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 mb-4 px-1">Последние операции</h2>
          <div className="space-y-3">
            {store.recentTransactions.length > 0 ? (
                store.recentTransactions.map(t => (
                    <TransactionItem
                        key={t.id}
                        transaction={t}
                        category={store.categories.find(c => c.id === t.category_id)}
                        account={store.accounts.find(a => a.id === t.account_id)}
                        counterparty={store.counterparties.find(cp => cp.id === t.counterparty_id)}
                    />
                ))
            ) : (
                <div className="text-center py-12 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50">
                  <p className="font-bold">Список операций пуст</p>
                  <p className="text-sm mt-1">Добавьте первый доход или расход</p>
                </div>
            )}
          </div>
        </section>

        {/* Floating Buttons */}
        <div className="fixed bottom-24 lg:bottom-10 right-6 flex flex-col gap-3 z-40">
          <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveModal('transfer')}
              className="w-12 h-12 bg-slate-800 text-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <ArrowRightLeft size={20} strokeWidth={2.5}/>
          </motion.button>
          <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => openTxModal('income')}
              className="w-12 h-12 bg-success text-emerald-900 rounded-2xl shadow-lg shadow-success/30 flex items-center justify-center hover:bg-emerald-400 transition-colors"
          >
            <TrendingUp size={20} strokeWidth={2.5}/>
          </motion.button>
          <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => openTxModal('expense')}
              className="w-16 h-16 bg-primary text-white rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center hover:bg-indigo-700 transition-colors"
          >
            <Plus size={32} strokeWidth={2.5}/>
          </motion.button>
        </div>

        {/* --- MODALS --- */}

        <AccountModal
            isOpen={activeModal === 'addAccount'}
            onClose={() => setActiveModal(null)}
        />

        <TransactionModal
            isOpen={activeModal === 'transaction'}
            onClose={() => setActiveModal(null)}
            initialType={txProps.type}
            initialCategoryName={txProps.categoryName}
            initialAccountId={txProps.accountId}
        />

        <Modal isOpen={activeModal === 'transfer'} onClose={() => setActiveModal(null)} title="Перевод между счетами">
          <div className="space-y-6">
            <div className="relative">
              <input
                  type="number"
                  placeholder="0"
                  autoFocus
                  className="w-full text-4xl font-black p-4 text-center border-b-2 outline-none text-zinc-900 border-zinc-200 focus:border-zinc-900 transition-colors tabular-nums"
                  value={transferForm.amount}
                  onChange={e => setTransferForm({...transferForm, amount: e.target.value})}
              />
              <div className="text-center text-xs font-bold text-zinc-400 mt-2 uppercase">Сумма перевода</div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Откуда списать</label>
                <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-indigo-500" value={transferForm.fromAccountId} onChange={e => setTransferForm({...transferForm, fromAccountId: e.target.value})}>
                  <option value="">Выберите счет...</option>
                  {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(a.id))} {a.currency})</option>)}
                </select>
              </div>

              <div className="flex justify-center -my-2 z-10">
                <div className="bg-zinc-100 p-2 rounded-full">
                  <ArrowRightLeft className="text-zinc-400" size={20} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Куда зачислить</label>
                <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-indigo-500" value={transferForm.toAccountId} onChange={e => setTransferForm({...transferForm, toAccountId: e.target.value})}>
                  <option value="">Выберите счет...</option>
                  {store.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(a.id))} {a.currency})</option>)}
                </select>
              </div>
            </div>

            <Button onClick={handleAddTransfer} className="w-full py-4 text-lg bg-zinc-900 text-white hover:bg-zinc-800">Перевести</Button>
          </div>
        </Modal>

      </div>
  );
}