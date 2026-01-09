import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, subMonths } from 'date-fns';
import { toast } from '../components/ui/Toast';

export const useFinanceStore = create((set, get) => ({
  user: null,
  isAuthChecked: false,

  // === ДАННЫЕ ===
  accounts: [],
  categories: [],
  counterparties: [],
  transactions: [],
  budgets: [],
  debts: [],
  recurring: [],
  goals: [],           // NEW
  notifications: [],   // NEW
  unreadNotifications: 0,

  // === НАСТРОЙКИ ===
  settings: {
    base_currency: 'UZS',
    currency_rates: { 'UZS': 1, 'USD': 12850 },
    dark_mode: false,
    theme_color: '#2563eb'
  },

  loading: false,

  // ==================================================
  // 1. АВТОРИЗАЦИЯ И ЗАГРУЗКА
  // ==================================================

  checkUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      set({ user });
      set({ isAuthChecked: true });

      if (user) {
        await get().fetchData();
        await get().checkRecurringTransactions();
      }
    } catch (error) {
      console.error("Auth Error:", error);
      set({ isAuthChecked: true });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      accounts: [],
      categories: [],
      counterparties: [],
      transactions: [],
      budgets: [],
      debts: [],
      recurring: [],
      goals: [],
      notifications: []
    });
  },

  fetchData: async () => {
    set({ loading: true });
    try {
      const user = get().user;
      if (!user) return;

      // 1. Грузим настройки
      let { data: settings } = await supabase.from('user_settings').select('*').single();
      if (!settings) {
        const { data: newSettings } = await supabase.from('user_settings').insert([{ user_id: user.id }]).select().single();
        settings = newSettings;
      }

      // 2. Грузим все данные параллельно
      const [acc, cat, cp, tx, bud, dbt, rec, goals, notif] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('counterparties').select('*').order('is_favorite', { ascending: false }).order('name'),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('budgets').select('*'),
        supabase.from('debts').select('*').order('created_at', { ascending: false }),
        supabase.from('recurring_transactions').select('*').order('day_of_month'),
        supabase.from('goals').select('*').order('is_completed').order('created_at'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      let accounts = acc.data || [];
      let categories = cat.data || [];

      // --- SEED DEFAULT DATA IF EMPTY ---
      if (accounts.length === 0 && categories.length === 0) {
        console.log("Seeding default data for new user...");
        // 1. Account
        const { data: newAcc } = await supabase.from('accounts').insert([{ user_id: user.id, name: 'Основной', currency: 'UZS', color: '#2563eb', icon: '💳', balance: 0 }]).select();
        if (newAcc) accounts = newAcc;

        // 2. Categories
        const defaultCats = [
          { user_id: user.id, name: 'Продукты', type: 'expense', icon: '🛒', color: '#f59e0b' },
          { user_id: user.id, name: 'Транспорт', type: 'expense', icon: '🚕', color: '#3b82f6' },
          { user_id: user.id, name: 'Развлечения', type: 'expense', icon: '🍿', color: '#ec4899' },
          { user_id: user.id, name: 'Зарплата', type: 'income', icon: '💰', color: '#10b981' }
        ];
        const { data: newCats } = await supabase.from('categories').insert(defaultCats).select();
        if (newCats) categories = newCats;

        toast.success('Добро пожаловать!', { icon: '👋' });
      }

      set({
        settings: settings || get().settings,
        accounts: accounts,
        categories: categories,
        counterparties: cp.data || [],
        transactions: tx.data || [],
        budgets: bud.data || [],
        debts: dbt.data || [],
        recurring: rec.data || [],
        goals: goals.data || [],
        notifications: notif.data || [],
        unreadNotifications: (notif.data || []).filter(n => !n.is_read).length
      });

    } catch (err) {
      console.error('Fetch Error:', err);
      toast.error('Ошибка загрузки данных');
    } finally {
      set({ loading: false });
    }
  },

  // ==================================================
  // 2. НАСТРОЙКИ И УТИЛИТЫ ВАЛЮТ
  // ==================================================

  updateSettings: async (newSettings) => {
    const user = get().user;
    const { data, error } = await supabase
      .from('user_settings')
      .update(newSettings)
      .eq('user_id', user.id)
      .select()
      .single();

    if (data) {
      set({ settings: data });
      return { success: true };
    }
    return { success: false, error };
  },

  convertCurrency: (amount, fromCurrency, toCurrency) => {
    const { settings } = get();
    const rates = settings.currency_rates;
    if (!amount) return 0;
    if (fromCurrency === toCurrency) return amount;
    const rateFrom = rates[fromCurrency] || 1;
    const rateTo = rates[toCurrency] || 1;
    return (amount * rateFrom) / rateTo;
  },

  getTotalBalanceInBaseCurrency: () => {
    const { accounts, getAccountBalance, settings, convertCurrency } = get();
    const base = settings.base_currency;
    return accounts.reduce((total, acc) => {
      const balance = getAccountBalance(acc.id);
      return total + convertCurrency(balance, acc.currency, base);
    }, 0);
  },

  // ==================================================
  // 3. ОСНОВНЫЕ СУЩНОСТИ (CRUD)
  // ==================================================

  // --- ACCOUNTS ---
  createAccount: async (name, currency = 'UZS', color, icon = '💳') => {
    const user = get().user;
    const { data } = await supabase.from('accounts').insert([{
      user_id: user.id, name, currency, color: color || getRandomColor(), icon
    }]).select();
    if (data) {
      set(state => ({ accounts: [...state.accounts, data[0]] }));
      toast.success('Счет создан');
    }
  },
  updateAccount: async (id, updates) => {
    const { data } = await supabase.from('accounts').update(updates).eq('id', id).select();
    if (data) set(state => ({ accounts: state.accounts.map(a => a.id === id ? data[0] : a) }));
  },
  deleteAccount: async (id) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) {
      set(state => ({ accounts: state.accounts.filter(a => a.id !== id) }));
      toast.success('Счет удален');
    }
  },
  getAccountBalance: (id) => {
    const { transactions } = get();
    return transactions.filter(t => t.account_id === id).reduce((acc, t) => {
      if (['income', 'transfer_in'].includes(t.type)) return acc + t.amount;
      if (['expense', 'transfer_out'].includes(t.type)) return acc - t.amount;
      return acc;
    }, 0);
  },

  // --- CATEGORIES ---
  createCategory: async (name, type, icon = '📌', color) => {
    const user = get().user;
    const { data } = await supabase.from('categories').insert([{
      user_id: user.id, name, type, icon, color: color || getRandomColor()
    }]).select();
    if (data) set(state => ({ categories: [...state.categories, data[0]] }));
  },

  // --- COUNTERPARTIES ---
  createCounterparty: async (form) => {
    const user = get().user;
    const { data } = await supabase.from('counterparties').insert([{
      user_id: user.id, ...form, color: form.color || getRandomColor()
    }]).select();
    if (data) set(state => ({ counterparties: [...state.counterparties, data[0]] }));
  },
  updateCounterparty: async (id, updates) => {
    const { data } = await supabase.from('counterparties').update(updates).eq('id', id).select();
    if (data) set(state => ({ counterparties: state.counterparties.map(c => c.id === id ? data[0] : c) }));
  },
  deleteCounterparty: async (id) => {
    const { error } = await supabase.from('counterparties').delete().eq('id', id);
    if (!error) set(state => ({ counterparties: state.counterparties.filter(c => c.id !== id) }));
  },

  toggleFavorite: async (id) => {
    const cp = get().counterparties.find(c => c.id === id);
    if (!cp) return;
    const { data } = await supabase.from('counterparties')
      .update({ is_favorite: !cp.is_favorite }).eq('id', id).select();
    if (data) {
      set(state => ({ counterparties: state.counterparties.map(c => c.id === id ? data[0] : c) }));
    }
  },
  getCounterpartyStats: (id) => {
    const { transactions } = get();
    const txs = transactions.filter(t => t.counterparty_id === id);
    const totalIncome = txs.filter(t => t.type === 'income' || t.type === 'transfer_in').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txs.filter(t => t.type === 'expense' || t.type === 'transfer_out').reduce((sum, t) => sum + t.amount, 0);
    return { transactionCount: txs.length, totalIncome, totalExpense };
  },
  // --- TRANSACTIONS ---
  addTransaction: async (form) => {
    const user = get().user;
    try {
      const newTx = {
        user_id: user.id,
        account_id: form.account_id,
        category_id: form.category_id,
        counterparty_id: form.counterparty_id || null,
        amount: Number(form.amount),
        type: form.type,
        comment: form.comment || '',
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString()
      };

      const { data, error } = await supabase.from('transactions').insert([newTx]).select();
      if (error) throw error;

      if (data) {
        set(state => ({ transactions: [data[0], ...state.transactions] }));
        if (!form.silent) toast.success('Транзакция добавлена');
        return true;
      }
    } catch (e) {
      console.error(e);
      toast.error('Ошибка создания');
      return false;
    }
  },
  deleteTransaction: async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      set(state => ({ transactions: state.transactions.filter(t => t.id !== id) }));
      toast.success('Транзакция удалена');
    }
  },

  // --- GOALS (NEW) ---
  addGoal: async (form) => {
    const user = get().user;
    const { data, error } = await supabase.from('goals').insert([{
      user_id: user.id, ...form
    }]).select();
    if (data) {
      set(state => ({ goals: [...state.goals, data[0]] }));
      toast.success('Цель создана! 🚀');
      return true;
    }
    if (error) toast.error(error.message);
  },
  updateGoal: async (id, updates) => {
    const { data } = await supabase.from('goals').update(updates).eq('id', id).select();
    if (data) {
      set(state => ({ goals: state.goals.map(g => g.id === id ? data[0] : g) }));
      toast.success('Цель обновлена');
    }
  },
  deleteGoal: async (id) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) {
      set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
      toast.success('Цель удалена');
    }
  },
  addMoneyToGoal: async (goalId, amount, accountId) => {
    // 1. Создаем транзакцию списания
    const goal = get().goals.find(g => g.id === goalId);
    const success = await get().addTransaction({
      account_id: accountId,
      category_id: null, // Без категории
      amount: amount,
      type: 'expense',
      comment: `Перевод на цель: ${goal.name}`,
      silent: true
    });

    if (success) {
      // 2. Обновляем цель
      const newAmount = Number(goal.current_amount) + Number(amount);
      await get().updateGoal(goalId, { current_amount: newAmount });
      toast.success(`Отложено ${amount} на цель!`);
    }
  },

  // --- NOTIFICATIONS (NEW) ---
  markNotificationRead: async (id) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) {
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? ({ ...n, is_read: true }) : n),
        unreadNotifications: state.unreadNotifications - 1
      }));
    }
  },
  clearAllNotifications: async () => {
    const user = get().user;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadNotifications: 0
    }));
  },

  // --- DEBTS ---
  addDebt: async (form) => {
    const user = get().user;
    const { data, error } = await supabase.from('debts').insert([{
      user_id: user.id, ...form
    }]).select();
    if (data) {
      set(state => ({ debts: [data[0], ...state.debts] }));
      return { success: true };
    }
    return { success: false, error };
  },
  payDebt: async (id, amount) => {
    const debt = get().debts.find(d => d.id === id);
    if (!debt) return;

    const newPaid = Number(debt.paid_amount) + Number(amount);
    const isClosed = newPaid >= debt.amount;

    const { data, error } = await supabase.from('debts')
      .update({ paid_amount: newPaid, is_closed: isClosed })
      .eq('id', id)
      .select();

    if (data) {
      set(state => ({ debts: state.debts.map(d => d.id === id ? data[0] : d) }));
      // Optional: Add transaction logic here if needed
      return { success: true };
    }
    return { success: false, error };
  },
  deleteDebt: async (id) => {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (!error) {
      set(state => ({ debts: state.debts.filter(d => d.id !== id) }));
    }
  },

  // --- RECURRING ---
  addRecurring: async (form) => {
    const user = get().user;
    const { data, error } = await supabase.from('recurring_transactions').insert([{
      user_id: user.id, ...form
    }]).select();
    if (data) {
      set(state => ({ recurring: [...state.recurring, data[0]] }));
      return { success: true };
    }
    return { success: false, error };
  },
  deleteRecurring: async (id) => {
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
    if (!error) {
      set(state => ({ recurring: state.recurring.filter(r => r.id !== id) }));
    }
  },

  // --- AUTOMATION ---
  checkRecurringTransactions: async () => {
    const { recurring, addTransaction } = get();
    const today = new Date();
    const currentDay = today.getDate();

    // Подписки, которые нужно выполнить сегодня
    const toRun = recurring.filter(r => {
      if (!r.active) return false;
      const lastRunDate = r.last_run ? new Date(r.last_run) : null;
      const isRunThisMonth = lastRunDate &&
        lastRunDate.getMonth() === today.getMonth() &&
        lastRunDate.getFullYear() === today.getFullYear();

      return !isRunThisMonth && currentDay >= r.day_of_month;
    });

    if (toRun.length === 0) return;

    let processed = 0;
    for (const item of toRun) {
      const res = await addTransaction({
        account_id: item.account_id,
        category_id: item.category_id,
        amount: item.amount,
        type: item.type,
        comment: `Авто: ${item.comment || 'Подписка'}`,
        silent: true
      });

      if (res) {
        await supabase.from('recurring_transactions')
          .update({ last_run: new Date().toISOString() })
          .eq('id', item.id);
        processed++;
      }
    }

    if (processed > 0) {
      // Обновляем список локально
      get().fetchData();
      toast.success(`Выполнено ${processed} регулярных операций`);
    }
  },

  // --- ANALYTICS HELPERS ---
  getIncomeByPeriod: (period = 'today') => {
    const { transactions } = get();
    const range = getPeriodRange(period);
    return transactions
      .filter(t => t.type === 'income' && isInRange(t.date, range))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getExpenseByPeriod: (period = 'today') => {
    const { transactions } = get();
    const range = getPeriodRange(period);
    return transactions
      .filter(t => t.type === 'expense' && isInRange(t.date, range))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getSpendingTrends: (period = 'month') => {
    const { transactions } = get();
    const today = new Date();
    // Простая реализация: группировка по дням за последние 30 дней
    // ... можно будет расширить в Insights
    return [];
  }

}));

// HELPERS
function getRandomColor() {
  const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#ec4899', '#8b5cf6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getPeriodRange(period) {
  const now = new Date();
  switch (period) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
    case 'month': return { start: startOfMonth(now), end: now };
    case 'year': return { start: startOfYear(now), end: now };
    default: return { start: startOfDay(now), end: endOfDay(now) };
  }
}

function isInRange(dateString, range) {
  try { return isWithinInterval(new Date(dateString), range); } catch { return false; }
}
