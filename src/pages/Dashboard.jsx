import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, TrendingUp, TrendingDown, ArrowRightLeft, Wallet, CreditCard, ChevronRight, Eye, EyeOff, Coffee, ShoppingCart, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TransactionItem from '../components/TransactionItem';
import { toast } from '../components/ui/Toast';


// eslint-disable-next-line react/prop-types
const QuickAction = ({ icon: IconComponent, label, category, onClick }) => (
  <button
    onClick={() => onClick('expense', category)}
    className="flex flex-col items-center gap-2 min-w-[80px]"
  >
    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-zinc-200 hover:border-primary hover:bg-zinc-50 transition-all shadow-sm">
      <IconComponent size={24} className="text-zinc-700" strokeWidth={2} />
    </div>
    <span className="text-xs font-bold text-zinc-500">{label}</span>
  </button>
);

export default function Dashboard() {
  const store = useFinanceStore();
  const [activeModal, setActiveModal] = useState(null); // 'transaction', 'transfer', 'addAccount'
  const [txMode, setTxMode] = useState('category'); // 'category', 'counterparty'
  const [trendsPeriod, setTrendsPeriod] = useState(7); // 7 or 30 days

  // Forms
  const [txForm, setTxForm] = useState({
    type: 'expense', amount: '', account_id: '', category_id: '', counterparty_id: '', comment: '', date: new Date().toISOString().split('T')[0]
  });
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '', toAccountId: '', amount: '', comment: ''
  });
  const [accountForm, setAccountForm] = useState({
    name: '', currency: store.settings.base_currency, color: '#6366f1', icon: '💳'
  });

  const categories = store.categories.filter(c => c.type === txForm.type);
  const totalBalance = store.getTotalBalanceInBaseCurrency ? store.getTotalBalanceInBaseCurrency() : 0;
  const isPrivacy = store.settings.isPrivacyEnabled;

  // Handlers
  // Handlers
  const handleAddTransaction = async () => {
    if (!txForm.account_id) return toast.error('Выберите счет');
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) return toast.error('Введите корректную сумму');
    if (!txForm.category_id && !txForm.counterparty_id) return toast.error('Выберите категорию или контрагента');

    const success = await store.addTransaction(txForm);
    if (success) {
      setTxForm({ ...txForm, amount: '', comment: '' });
      setActiveModal(null);
    }
  };

  const handleAddTransfer = async () => {
    if (!transferForm.fromAccountId) return toast.error('Выберите счет списания');
    if (!transferForm.toAccountId) return toast.error('Выберите счет зачисления');
    if (transferForm.fromAccountId === transferForm.toAccountId) return toast.error('Счета должны различаться');
    if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) return toast.error('Введите корректную сумму');

    const result = await store.addTransfer(transferForm.fromAccountId, transferForm.toAccountId, transferForm.amount, transferForm.comment);
    if (result?.success) {
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', comment: '' });
      setActiveModal(null);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.name) return toast.error('Введите название счета');

    const success = await store.addAccount(accountForm);
    if (success) {
      setAccountForm({ name: '', currency: store.settings.base_currency, color: '#6366f1', icon: '💳' });
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

  // Smart Alerts Logic
  const getSmartAlerts = () => {
    const alerts = [];
    const today = new Date();

    // Check budget overruns
    store.budgets.forEach(budget => {
      const progress = store.getBudgetProgress(budget.category_id);
      if (progress && progress.percent > 100) {
        alerts.push({
          type: 'danger',
          icon: '🚨',
          title: 'Превышен бюджет!',
          message: `Категория "${progress.categoryName}": ${progress.percent.toFixed(0)}% (${new Intl.NumberFormat('ru-RU').format(progress.spent)} из ${new Intl.NumberFormat('ru-RU').format(budget.limit)})`,
          action: () => window.location.href = '/analytics'
        });
      } else if (progress && progress.percent > 80 && progress.percent <= 100) {
        alerts.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Бюджет почти исчерпан',
          message: `Категория "${progress.categoryName}": ${progress.percent.toFixed(0)}% использовано`,
          action: () => window.location.href = '/analytics'
        });
      }
    });

    // Check upcoming recurring payments (today or tomorrow)
    store.recurring.forEach(payment => {
      const nextDate = new Date(payment.next_date);
      const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        alerts.push({
          type: 'info',
          icon: '📅',
          title: 'Платёж сегодня!',
          message: `${payment.name}: ${new Intl.NumberFormat('ru-RU').format(payment.amount)} ${payment.currency || store.settings.base_currency}`,
          action: () => window.location.href = '/recurring'
        });
      } else if (diffDays === 1) {
        alerts.push({
          type: 'info',
          icon: '📅',
          title: 'Платёж завтра',
          message: `${payment.name}: ${new Intl.NumberFormat('ru-RU').format(payment.amount)} ${payment.currency || store.settings.base_currency}`,
          action: () => window.location.href = '/recurring'
        });
      }
    });

    // Check negative balance
    const negativeAccounts = store.accounts.filter(acc => store.getAccountBalance(acc.id) < 0);
    if (negativeAccounts.length > 0) {
      alerts.push({
        type: 'danger',
        icon: '💸',
        title: 'Отрицательный баланс!',
        message: `Счета: ${negativeAccounts.map(a => a.name).join(', ')}`,
        action: null
      });
    }

    return alerts.slice(0, 3); // Max 3 alerts
  };

  const smartAlerts = getSmartAlerts();

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* SMART ALERTS */}
      {smartAlerts.length > 0 && (
        <section className="space-y-3">
          {smartAlerts.map((alert, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div
                className={`relative overflow-hidden rounded-2xl p-4 border-2 cursor-pointer transition-all ${alert.type === 'danger'
                  ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-300 hover:border-rose-400'
                  : alert.type === 'warning'
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 hover:border-amber-400'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-400'
                  }`}
                onClick={alert.action || undefined}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{alert.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-black text-sm mb-1 ${alert.type === 'danger' ? 'text-rose-900'
                      : alert.type === 'warning' ? 'text-amber-900'
                        : 'text-blue-900'
                      }`}>
                      {alert.title}
                    </h3>
                    <p className={`text-xs font-bold ${alert.type === 'danger' ? 'text-rose-700'
                      : alert.type === 'warning' ? 'text-amber-700'
                        : 'text-blue-700'
                      }`}>
                      {alert.message}
                    </p>
                  </div>
                  {alert.action && (
                    <ChevronRight className={`flex-shrink-0 ${alert.type === 'danger' ? 'text-rose-400'
                      : alert.type === 'warning' ? 'text-amber-400'
                        : 'text-blue-400'
                      }`} size={20} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* 1. HERO BALANCE CARD */}
      <GlassCard
        gradient
        className="relative overflow-hidden min-h-[220px] flex flex-col justify-center text-white p-8 shadow-2xl shadow-indigo-500/20"
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

      {/* MONTHLY STATISTICS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="relative overflow-hidden group hover:border-success/50 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Доходы</span>
                <div className="p-1.5 bg-success/10 rounded-lg">
                  <TrendingUp size={14} className="text-success" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 tabular-nums">
                {isPrivacy ? '•••••' : new Intl.NumberFormat('ru-RU').format(Math.round(store.getMonthlyIncome()))}
              </div>
              <div className="text-[10px] font-bold text-zinc-400 mt-1">За этот месяц</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Expense */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="relative overflow-hidden group hover:border-error/50 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-error/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Расходы</span>
                <div className="p-1.5 bg-error/10 rounded-lg">
                  <TrendingDown size={14} className="text-error" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 tabular-nums">
                {isPrivacy ? '•••••' : new Intl.NumberFormat('ru-RU').format(Math.round(store.getMonthlyExpense()))}
              </div>
              <div className="text-[10px] font-bold text-zinc-400 mt-1">За этот месяц</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Profit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className={`relative overflow-hidden group transition-all ${store.getMonthlyProfit() >= 0 ? 'hover:border-success/50' : 'hover:border-error/50'}`}>
            <div className={`absolute top-0 right-0 w-20 h-20 ${store.getMonthlyProfit() >= 0 ? 'bg-success/10' : 'bg-error/10'} rounded-full blur-2xl -mr-10 -mt-10`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Баланс</span>
                <div className={`p-1.5 ${store.getMonthlyProfit() >= 0 ? 'bg-success/10' : 'bg-error/10'} rounded-lg`}>
                  <Wallet size={14} className={store.getMonthlyProfit() >= 0 ? 'text-success' : 'text-error'} strokeWidth={2.5} />
                </div>
              </div>
              <div className={`text-2xl font-black tabular-nums ${store.getMonthlyProfit() >= 0 ? 'text-success' : 'text-error'}`}>
                {isPrivacy ? '•••••' : `${store.getMonthlyProfit() >= 0 ? '+' : ''}${new Intl.NumberFormat('ru-RU').format(Math.round(store.getMonthlyProfit()))}`}
              </div>
              <div className="text-[10px] font-bold text-zinc-400 mt-1">Профит/Дефицит</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Budget Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Бюджеты</span>
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <ChevronRight size={14} className="text-indigo-600" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600 tabular-nums">
                {isPrivacy ? '••' : `${store.getBudgetCompletion()}%`}
              </div>
              <div className="text-[10px] font-bold text-zinc-400 mt-1">Среднее выполнение</div>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* TOP EXPENSE CATEGORIES */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            🔥 Куда уходят деньги
          </h2>
        </div>
        <GlassCard>
          {store.getTopExpenseCategories(3).length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <p className="text-sm font-bold">Нет данных о расходах за этот месяц</p>
            </div>
          ) : (
            <div className="space-y-4">
              {store.getTopExpenseCategories(3).map((cat, idx) => (
                <motion.div
                  key={cat.categoryId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{cat.icon}</div>
                      <div>
                        <div className="font-bold text-zinc-900">{cat.name}</div>
                        <div className="text-xs text-zinc-400">
                          {isPrivacy ? '•••••' : new Intl.NumberFormat('ru-RU').format(Math.round(cat.amount))} {store.settings.base_currency}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-error">{cat.percentage}%</div>
                      <div className="text-[10px] text-zinc-400 font-bold">от расходов</div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                      className={`h-full rounded-full ${idx === 0 ? 'bg-gradient-to-r from-rose-500 to-red-500' :
                        idx === 1 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                          'bg-gradient-to-r from-yellow-500 to-orange-400'
                        }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-bold text-zinc-900">⚡ Быстрые операции</h2>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-4 px-1 custom-scrollbar">
          {store.getTopUsedCategories(6).map((cat, idx) => (
            <motion.button
              key={cat.categoryId || idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => openTxModal('expense', cat.name)}
              className="flex flex-col items-center gap-2 min-w-[80px] group"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-zinc-200 hover:border-primary hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all shadow-sm group-active:scale-95">
                <span className="text-2xl">{cat.icon}</span>
              </div>
              <span className="text-xs font-bold text-zinc-600 group-hover:text-primary transition-colors text-center max-w-[80px] truncate">
                {cat.name}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* TRENDS CHART */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-bold text-zinc-900">📈 Динамика финансов</h2>
          <div className="flex gap-2 bg-white rounded-xl p-1 border border-zinc-200 shadow-sm">
            <button
              onClick={() => setTrendsPeriod(7)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trendsPeriod === 7
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
                }`}
            >
              7 дней
            </button>
            <button
              onClick={() => setTrendsPeriod(30)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trendsPeriod === 30
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
                }`}
            >
              30 дней
            </button>
          </div>
        </div>
        <GlassCard className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={store.getSpendingTrends(trendsPeriod === 7 ? 'week' : 'month')}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                style={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <YAxis
                stroke="#71717a"
                style={{ fontSize: '11px', fontWeight: 'bold' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e4e4e7',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                formatter={(value) => new Intl.NumberFormat('ru-RU').format(value)}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Доходы"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Расходы"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </section>

      {/* GOALS PROGRESS WIDGET */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-bold text-zinc-900">🎯 Мои Цели</h2>
          <a href="/goals" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Все цели →
          </a>
        </div>
        {store.goals && store.goals.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {store.goals.slice(0, 3).map((goal, idx) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <GlassCard className="hover:border-indigo-300 transition-all group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{goal.icon || '🎯'}</span>
                        <div>
                          <h3 className="font-bold text-zinc-900 text-sm">{goal.name}</h3>
                          <p className="text-[10px] text-zinc-400 font-bold">
                            {isPrivacy ? '•••' : new Intl.NumberFormat('ru-RU').format(goal.current_amount)} / {isPrivacy ? '•••' : new Intl.NumberFormat('ru-RU').format(goal.target_amount)} {store.settings.base_currency}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-indigo-600">{Math.round(progress)}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-bold">
                        Осталось: {isPrivacy ? '•••' : new Intl.NumberFormat('ru-RU').format(goal.target_amount - goal.current_amount)}
                      </span>
                      <button
                        onClick={() => window.location.href = '/goals'}
                        className="text-indigo-600 hover:text-indigo-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Пополнить →
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <GlassCard className="text-center py-8">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-zinc-400 font-bold text-sm mb-4">У вас пока нет целей</p>
            <Button onClick={() => window.location.href = '/goals'} variant="primary">
              Создать первую цель
            </Button>
          </GlassCard>
        )}
      </section>

      {/* 3. ACCOUNTS CAROUSEL */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-primary" strokeWidth={2.5} /> Мои Счета
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {store.accounts.map((acc, idx) => {
            const accountBalance = store.getAccountBalance(acc.id);
            const percentage = totalBalance > 0 ? ((accountBalance / totalBalance) * 100) : 0;
            const lastTransaction = store.transactions
              .filter(t => t.account_id === acc.id)
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <GlassCard
                  className="h-full flex flex-col justify-between group hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => {
                    setTxForm(prev => ({ ...prev, account_id: acc.id }));
                    openTxModal('expense');
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border border-white/10" style={{ backgroundColor: acc.color + '20', color: acc.color }}>
                      {acc.icon || '💳'}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[10px] font-black">
                        {percentage.toFixed(1)}%
                      </div>
                      {lastTransaction && (
                        <div className="text-[9px] text-zinc-400 font-bold">
                          {new Date(lastTransaction.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm font-bold mb-1">{acc.name}</div>
                    <div className="text-xl font-black text-zinc-900 tabular-nums mb-2">
                      {isPrivacy ? '••••••' : new Intl.NumberFormat('ru-RU').format(accountBalance)}
                      <span className="text-xs text-slate-400 ml-1">{acc.currency}</span>
                    </div>
                    {lastTransaction && (
                      <div className="text-[10px] text-zinc-400 font-bold truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {lastTransaction.type === 'income' ? '↗ ' : '↙ '}
                        {store.categories.find(c => c.id === lastTransaction.category_id)?.name || 'Операция'}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal('addAccount')}
            className="min-h-[140px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-300 rounded-2xl text-zinc-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold"
          >
            <Plus size={24} strokeWidth={2.5} />
            <span>Добавить счет</span>
          </motion.button>
        </div>
      </section>

      {/* UPCOMING PAYMENTS */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-bold text-zinc-900">📅 Ближайшие платежи</h2>
          <a href="/recurring" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Все подписки →
          </a>
        </div>
        {store.recurring && store.recurring.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {store.recurring.slice(0, 4).map((payment, idx) => {
              const nextDate = new Date(payment.next_date);
              const today = new Date();
              const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

              let urgencyColor = 'zinc';
              let urgencyBg = 'bg-zinc-100';
              let urgencyText = 'text-zinc-600';

              if (diffDays <= 0) {
                urgencyColor = 'rose';
                urgencyBg = 'bg-rose-100';
                urgencyText = 'text-rose-600';
              } else if (diffDays === 1) {
                urgencyColor = 'amber';
                urgencyBg = 'bg-amber-100';
                urgencyText = 'text-amber-600';
              } else if (diffDays <= 3) {
                urgencyColor = 'blue';
                urgencyBg = 'bg-blue-100';
                urgencyText = 'text-blue-600';
              }

              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard className={`hover:border-${urgencyColor}-300 transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 ${urgencyBg} rounded-xl`}>
                          <span className="text-xl">{payment.icon || '💳'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-zinc-900 text-sm truncate">{payment.name}</h3>
                          <p className="text-xs text-zinc-400 font-bold">
                            {diffDays <= 0 ? 'Сегодня!' : diffDays === 1 ? 'Завтра' : `Через ${diffDays} дн.`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base font-black ${urgencyText}`}>
                          {isPrivacy ? '•••' : new Intl.NumberFormat('ru-RU').format(payment.amount)}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-bold">{payment.currency || store.settings.base_currency}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <GlassCard className="text-center py-8">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-zinc-400 font-bold text-sm mb-4">Нет регулярных платежей</p>
            <Button onClick={() => window.location.href = '/recurring'} variant="primary">
              Добавить подписку
            </Button>
          </GlassCard>
        )}
      </section>

      {/* 4. RECENT TRANSACTIONS */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 px-1">Последние операции</h2>
        <div className="space-y-3">
          {store.recentTransactions.map(t => {
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

      {/* ADD ACCOUNT MODAL */}
      <Modal isOpen={activeModal === 'addAccount'} onClose={() => setActiveModal(null)} title="➕ Новый Счет">
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Иконка</label>
            <div className="flex gap-2">
              {['💳', '💰', '🏦', '📱', '💵', '💎'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setAccountForm({ ...accountForm, icon: emoji })}
                  className={`w-12 h-12 text-2xl rounded-xl border-2 transition-all ${accountForm.icon === emoji
                    ? 'border-indigo-600 bg-indigo-50 scale-110'
                    : 'border-zinc-200 hover:border-indigo-300'
                    }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Название</label>
            <input
              type="text"
              placeholder="Например: Основная карта, Наличные..."
              className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500 transition-colors"
              value={accountForm.name}
              onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Валюта</label>
              <select
                className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
                value={accountForm.currency}
                onChange={e => setAccountForm({ ...accountForm, currency: e.target.value })}
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Цвет</label>
              <div className="flex gap-2">
                {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                  <button
                    key={color}
                    onClick={() => setAccountForm({ ...accountForm, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${accountForm.color === color ? 'border-zinc-900 scale-110' : 'border-zinc-200'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleAddAccount} className="w-full py-4 text-lg">
            Создать Счет
          </Button>
        </div>
      </Modal>

    </div>
  );
}