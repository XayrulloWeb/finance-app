import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, subMonths, endOfMonth } from 'date-fns';
import { toast } from '../components/ui/Toast';
import * as XLSX from 'xlsx';

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
    theme_color: '#2563eb',
    isPrivacyEnabled: JSON.parse(localStorage.getItem('finance_privacy') || 'false')
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
        supabase.from('view_account_balances').select('*').order('name'),
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
  // 2. IMPORT / EXPORT & SETTINGS
  // ==================================================

  importData: async (jsonData) => {
    // ... import logic existing ...
    const user = get().user;
    if (!user) return { success: false, error: 'User not logged in' };

    try {
      set({ loading: true });

      // 1. Validate structure (basic check)
      if (!jsonData.accounts && !jsonData.transactions) {
        throw new Error('Invalid backup file format');
      }

      // 2. Prepare data with current user_id (safety)
      const safeMap = (arr) => arr ? arr.map(item => ({ ...item, user_id: user.id })) : [];

      const accounts = safeMap(jsonData.accounts);
      const categories = safeMap(jsonData.categories);
      const counterparties = safeMap(jsonData.counterparties);
      const transactions = safeMap(jsonData.transactions);
      const budgets = safeMap(jsonData.budgets);
      const debts = safeMap(jsonData.debts);
      const recurring = safeMap(jsonData.recurring);
      const goals = safeMap(jsonData.goals);

      // 3. Upsert to Supabase
      await Promise.all([
        accounts.length && supabase.from('accounts').upsert(accounts),
        categories.length && supabase.from('categories').upsert(categories),
        counterparties.length && supabase.from('counterparties').upsert(counterparties),
        budgets.length && supabase.from('budgets').upsert(budgets),
        debts.length && supabase.from('debts').upsert(debts),
        recurring.length && supabase.from('recurring_transactions').upsert(recurring),
        goals.length && supabase.from('goals').upsert(goals)
      ]);

      // Transactions need to be handled carefuly (maybe batches? but let's try direct first)
      if (transactions.length) {
        await supabase.from('transactions').upsert(transactions);
      }

      // 4. Refresh local state
      await get().fetchData();

      toast.success('Данные успешно импортированы!');
      return { success: true };

    } catch (e) {
      console.error('Import Error:', e);
      toast.error('Ошибка импорта: ' + e.message);
      return { success: false, error: e.message };
    } finally {
      set({ loading: false });
    }
  },

  exportDataToExcel: () => {
    const { transactions, accounts, debts, categories, counterparties } = get();
    try {
      // 1. Prepare data for sheets
      const txSheet = XLSX.utils.json_to_sheet(transactions);
      const accSheet = XLSX.utils.json_to_sheet(accounts);
      const debtSheet = XLSX.utils.json_to_sheet(debts);
      const catSheet = XLSX.utils.json_to_sheet(categories);
      const cpSheet = XLSX.utils.json_to_sheet(counterparties);

      // 2. Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");
      XLSX.utils.book_append_sheet(wb, accSheet, "Accounts");
      XLSX.utils.book_append_sheet(wb, debtSheet, "Debts");
      XLSX.utils.book_append_sheet(wb, catSheet, "Categories");
      XLSX.utils.book_append_sheet(wb, cpSheet, "Counterparties");

      // 3. Save file
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Finance_Backup_${dateStr}.xlsx`);
      toast.success('Данные экспортированы в Excel');
      return true;
    } catch (e) {
      console.error("Export Error:", e);
      toast.error('Ошибка экспорта');
      return false;
    }
  },

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
  payDebt: async (id, amount, accountId) => {
    const debt = get().debts.find(d => d.id === id);
    if (!debt) return;

    const newPaid = Number(debt.paid_amount) + Number(amount);
    const isClosed = newPaid >= debt.amount;

    // 1. Update Debt Record
    const { data, error } = await supabase.from('debts')
      .update({ paid_amount: newPaid, is_closed: isClosed })
      .eq('id', id)
      .select();

    if (data) {
      set(state => ({ debts: state.debts.map(d => d.id === id ? data[0] : d) }));

      // 2. Create Transaction for History
      // 'i_owe' -> I paid -> Expense
      // 'owes_me' -> They paid me -> Income
      const type = debt.type === 'i_owe' ? 'expense' : 'income';
      const comment = `Возврат долга: ${debt.name}`;

      // We need an accountId. Passed in args or default?
      // Since UI currently doesn't ask for account, we might need to prompt user or pick first.
      // For now, let's try to pick the first account or safely skip if no account provided.
      // Ideally UI should provide accountId.
      let finalAccountId = accountId;
      if (!finalAccountId) {
        const accounts = get().accounts;
        if (accounts.length > 0) finalAccountId = accounts[0].id;
      }

      if (finalAccountId) {
        await get().addTransaction({
          account_id: finalAccountId,
          category_id: null,
          amount: Number(amount),
          type,
          comment,
          date: new Date().toISOString(),
          silent: false
        });
      } else {
        toast.success('Долг обновлен (Транзакция не создана - нет счета)');
      }

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

  // --- BUDGETS ---
  saveBudget: async (categoryId, amount) => {
    const user = get().user;
    const existing = get().budgets.find(b => b.category_id === categoryId);

    if (existing) {
      // Update
      const { data } = await supabase.from('budgets').update({ amount: Number(amount) }).eq('id', existing.id).select();
      if (data) set(state => ({ budgets: state.budgets.map(b => b.id === existing.id ? data[0] : b) }));
    } else {
      // Create
      const { data } = await supabase.from('budgets').insert([{ user_id: user.id, category_id: categoryId, amount: Number(amount) }]).select();
      if (data) set(state => ({ budgets: [...state.budgets, data[0]] }));
    }
    toast.success('Бюджет сохранен');
  },
  deleteBudget: async (id) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (!error) {
      set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }));
      toast.success('Бюджет удален');
    }
  },

  getBudgetProgress: (categoryId) => {
    const { budgets, getExpenseByPeriod } = get();
    const budget = budgets.find(b => b.category_id === categoryId);
    if (!budget) return null;

    // Calculate expense for this specific category in current month
    const { transactions } = get();
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const spent = transactions
      .filter(t => t.category_id === categoryId && t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
      .reduce((sum, t) => sum + t.amount, 0);

    const percent = (spent / budget.amount) * 100;

    return {
      spent,
      remaining: budget.amount - spent,
      percent,
      isOver: spent > budget.amount
    };
  },

  // --- AUTOMATION ---
  checkRecurringTransactions: async () => {
    const { recurring, addTransaction } = get();
    const today = new Date();

    // Фильтруем активные подписки
    const toRun = recurring.filter(r => {
      if (!r.active) return false;

      // Если дата последнего запуска не стоит, считаем что нужно запустить (или используем created_at)
      const lastRun = r.last_run ? new Date(r.last_run) : new Date(r.created_at);
      const nextRunDate = new Date(lastRun);

      // Логика: добавляем месяц к последнему запуску
      nextRunDate.setMonth(nextRunDate.getMonth() + 1);

      // Устанавливаем день месяца, указанный в подписке
      // (Нужно обработать случай, если в месяце нет 31 числа, но для простоты пока так)
      nextRunDate.setDate(r.day_of_month);

      // Если "следующая дата" уже наступила или прошла -> пора платить
      return nextRunDate <= today;
    });

    if (toRun.length === 0) return;

    let processed = 0;
    for (const item of toRun) {
      // Создаем транзакцию
      const res = await addTransaction({
        account_id: item.account_id,
        category_id: item.category_id,
        amount: item.amount,
        type: item.type,
        comment: `Авто: ${item.comment || 'Подписка'}`,
        date: new Date().toISOString(), // Важно: ставим текущую дату
        silent: true
      });

      if (res) {
        // Обновляем last_run на СЕГОДНЯ
        await supabase.from('recurring_transactions')
          .update({ last_run: new Date().toISOString() })
          .eq('id', item.id);
        processed++;
      }
    }

    if (processed > 0) {
      get().fetchData(); // Обновляем данные, чтобы пересчитать балансы
      toast.success(`Проведено регулярных платежей: ${processed}`);
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
    const result = [];

    // Determine range and format
    let days = 30;
    if (period === 'week') days = 7;
    if (period === 'year') days = 365; // Or 12 months, but let's stick to daily for now or group by month?

    // For 'month' (last 30 days)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

      // Sum income/expense for this day
      const dayTxs = transactions.filter(t => t.date.startsWith(dateStr));
      const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      result.push({
        date: dateStr,
        name: dateStr.split('-').slice(1).reverse().join('.'), // DD.MM
        income,
        expense
      });
    }
    return result;
  },
  // Добавь это в useFinanceStore.js после addTransaction

  // --- PRIVACY MODE ---
  togglePrivacy: () => {
    set(state => {
      const newState = !state.settings.isPrivacyEnabled;
      const newSettings = { ...state.settings, isPrivacyEnabled: newState };
      localStorage.setItem('finance_privacy', JSON.stringify(newState));
      return { settings: newSettings };
    });
  },

  // --- TRANSACTIONS HELPERS ---
  addTransfer: async (fromAccountId, toAccountId, amount, comment) => {
    const user = get().user;
    const amountVal = Number(amount);
    const date = new Date().toISOString();

    if (!user || !fromAccountId || !toAccountId) {
      toast.error('Некорректные данные перевода');
      return { success: false };
    }

    if (fromAccountId === toAccountId) {
      toast.error('Нельзя перевести на тот же счет');
      return { success: false };
    }

    if (amountVal <= 0) {
      toast.error('Сумма должна быть больше нуля');
      return { success: false };
    }

    // Перевод — это две транзакции: расход с одного счета и доход на другой
    const txOut = {
      user_id: user.id,
      account_id: fromAccountId,
      amount: amountVal,
      type: 'transfer_out',
      comment: comment || 'Перевод (списание)',
      date: date
    };

    const txIn = {
      user_id: user.id,
      account_id: toAccountId,
      amount: amountVal, // Сумма та же (если валюты разные, тут нужна конвертация, но пока оставим так)
      type: 'transfer_in',
      comment: comment || 'Перевод (зачисление)',
      date: date
    };

    try {
      const { data, error } = await supabase.from('transactions').insert([txOut, txIn]).select();

      if (error) throw error;

      if (data) {
        // Обновляем стейт, добавляя обе транзакции
        set(state => ({ transactions: [...data, ...state.transactions] }));
        toast.success('Перевод выполнен');
        return { success: true };
      }
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при переводе');
      return { success: false };
    }
  },

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
