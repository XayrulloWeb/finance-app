import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';

export const useFinanceStore = create((set, get) => ({
  user: null,
  isAuthChecked: false, 
  accounts: [],
  categories: [],
  counterparties: [],
  transactions: [],
  loading: false,

  // --- 1. АВТОРИЗАЦИЯ И ЗАГРУЗКА ---
  checkUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      set({ user });
      
      if (user) {
        await get().fetchData();
      }
    } catch (error) {
      console.error("Ошибка проверки пользователя:", error);
    } finally {
      // Важно: говорим приложению, что первоначальная проверка закончена
      set({ isAuthChecked: true }); 
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, accounts: [], categories: [], counterparties: [], transactions: [] });
  },

  fetchData: async () => {
    set({ loading: true });

    // Грузим Счета
    const { data: accounts } = await supabase.from('accounts').select('*').order('created_at');
    // Грузим Категории
    const { data: categories } = await supabase.from('categories').select('*').order('name');
    // Грузим Контрагентов
    const { data: counterparties } = await supabase.from('counterparties').select('*').order('favorite', { ascending: false }).order('name');
    // Грузим Операции
    const { data: transactions } = await supabase.from('transactions').select('*').order('date', { ascending: false });

    if (accounts) set({ accounts });
    if (categories) set({ categories });
    if (counterparties) set({ counterparties });
    if (transactions) set({ transactions });

    set({ loading: false });
  },

  // --- 2. УПРАВЛЕНИЕ СЧЕТАМИ ---

  createAccount: async (name, currency = 'UZS') => {
    const user = get().user;
    if (!user) return;
    const { data, error } = await supabase.from('accounts').insert([{
      user_id: user.id,
      name,
      currency,
      color: getRandomColor()
    }]).select();
    if (!error && data) {
      set(state => ({ accounts: [...state.accounts, data[0]] }));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  },

  updateAccount: async (accountId, updates) => {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select();

    if (!error && data) {
      set(state => ({
        accounts: state.accounts.map(a => a.id === accountId ? data[0] : a)
      }));
      return { success: true };
    }
    return { success: false, error };
  },

  deleteAccount: async (accountId) => {
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);
    if (!error) {
      set(state => ({
        accounts: state.accounts.filter(a => a.id !== accountId)
      }));
      return { success: true };
    }
    return { success: false, error };
  },

  // --- 3. УПРАВЛЕНИЕ КАТЕГОРИЯМИ ---

  seedCategories: async () => {
    const user = get().user;
    if (!user) return;

    const defaults = [
      { name: 'Зарплата', type: 'income', icon: '💰' },
      { name: 'Фриланс', type: 'income', icon: '💻' },
      { name: 'Подарки', type: 'income', icon: '🎁' },
      { name: 'Продукты', type: 'expense', icon: '🍎' },
      { name: 'Кафе', type: 'expense', icon: '☕' },
      { name: 'Транспорт', type: 'expense', icon: '🚕' },
      { name: 'Дом', type: 'expense', icon: '🏠' },
      { name: 'Развлечения', type: 'expense', icon: '🎬' },
      { name: 'Здоровье', type: 'expense', icon: '💊' },
      { name: 'Одежда', type: 'expense', icon: '👕' },
    ];

    const toInsert = defaults.map(c => ({ ...c, user_id: user.id }));
    const { data, error } = await supabase.from('categories').insert(toInsert).select();

    if (!error && data) {
      set(state => ({ categories: [...state.categories, ...data] }));
      return { success: true, message: 'Категории созданы!' };
    }
    return { success: false, error };
  },

  createCategory: async (name, type, icon = '📌') => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ user_id: user.id, name, type, icon }])
      .select();

    if (!error && data) {
      set(state => ({ categories: [...state.categories, data[0]] }));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  },

  // --- 4. УПРАВЛЕНИЕ КОНТРАГЕНТАМИ ---

  createCounterparty: async (name, type = 'company', icon = '👤', color = '#6366f1', notes = '') => {
    const user = get().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('counterparties')
      .insert([{ user_id: user.id, name, type, icon, color, notes }])
      .select();

    if (!error && data) {
      set(state => ({ counterparties: [...state.counterparties, data[0]] }));
      return { success: true, data: data[0] };
    }
    return { success: false, error };
  },

  updateCounterparty: async (counterpartyId, updates) => {
    const { data, error } = await supabase
      .from('counterparties')
      .update(updates)
      .eq('id', counterpartyId)
      .select();

    if (!error && data) {
      set(state => ({
        counterparties: state.counterparties.map(c => c.id === counterpartyId ? data[0] : c)
      }));
      return { success: true };
    }
    return { success: false, error };
  },

  deleteCounterparty: async (counterpartyId) => {
    const { error } = await supabase.from('counterparties').delete().eq('id', counterpartyId);
    if (!error) {
      set(state => ({
        counterparties: state.counterparties.filter(c => c.id !== counterpartyId)
      }));
      return { success: true };
    }
    return { success: false, error };
  },

  toggleFavorite: async (counterpartyId) => {
    const counterparty = get().counterparties.find(c => c.id === counterpartyId);
    if (!counterparty) return { success: false, error: 'Counterparty not found' };

    return get().updateCounterparty(counterpartyId, { favorite: !counterparty.favorite });
  },

  // --- 5. ТРАНЗАКЦИИ ---

  addTransaction: async (form) => {
    const user = get().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    // Проверка обязательных полей
    if (!form.account_id) {
      console.error('Missing account_id');
      return { success: false, error: 'Выбери счет' };
    }
    if (!form.category_id) {
      console.error('Missing category_id');
      return { success: false, error: 'Выбери категорию' };
    }
    if (!form.amount || Number(form.amount) <= 0) {
      console.error('Invalid amount:', form.amount);
      return { success: false, error: 'Введи корректную сумму' };
    }

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

    console.log('Sending transaction:', newTx);

    const { data, error } = await supabase.from('transactions').insert([newTx]).select();

    if (error) {
      console.error('Transaction error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    set(state => ({ transactions: [data[0], ...state.transactions] }));
    return { success: true, data: data[0] };
  },

  // НОВОЕ: Перевод между счетами
  addTransfer: async (fromAccountId, toAccountId, amount, comment = '') => {
    const user = get().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    // Создаем категорию "Перевод" если её нет
    let transferCategory = get().categories.find(c => c.name === 'Перевод' && c.type === 'transfer');

    if (!transferCategory) {
      const { data: catData } = await supabase
        .from('categories')
        .insert([{ user_id: user.id, name: 'Перевод', type: 'transfer', icon: '🔄' }])
        .select();

      if (catData && catData[0]) {
        transferCategory = catData[0];
        set(state => ({ categories: [...state.categories, catData[0]] }));
      }
    }

    if (!transferCategory) {
      return { success: false, error: 'Could not create transfer category' };
    }

    const now = new Date().toISOString();

    // Создаем ДВЕ транзакции
    const transactions = [
      {
        user_id: user.id,
        account_id: fromAccountId,
        category_id: transferCategory.id,
        amount: Number(amount),
        type: 'transfer_out',
        comment: comment || `Перевод → ${get().accounts.find(a => a.id === toAccountId)?.name}`,
        date: now
      },
      {
        user_id: user.id,
        account_id: toAccountId,
        category_id: transferCategory.id,
        amount: Number(amount),
        type: 'transfer_in',
        comment: comment || `Перевод ← ${get().accounts.find(a => a.id === fromAccountId)?.name}`,
        date: now
      }
    ];

    const { data, error } = await supabase.from('transactions').insert(transactions).select();

    if (error) {
      console.error('Transfer error:', error);
      return { success: false, error: error.message };
    }

    set(state => ({ transactions: [...data, ...state.transactions] }));
    return { success: true, data };
  },

  deleteTransaction: async (transactionId) => {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (!error) {
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== transactionId)
      }));
      return { success: true };
    }
    return { success: false, error };
  },

  // --- 6. ПОДСЧЕТЫ (МАТЕМАТИКА) ---

  // Баланс конкретного кошелька
  getAccountBalance: (accountId) => {
    const { transactions } = get();
    return transactions
      .filter(t => t.account_id === accountId)
      .reduce((acc, t) => {
        if (t.type === 'income' || t.type === 'transfer_in') {
          return acc + t.amount;
        } else if (t.type === 'expense' || t.type === 'transfer_out') {
          return acc - t.amount;
        }
        return acc;
      }, 0);
  },

  // Общий капитал (сумма всех кошельков)
  getTotalBalance: () => {
    const { accounts, getAccountBalance } = get();
    return accounts.reduce((acc, account) => acc + getAccountBalance(account.id), 0);
  },

  // НОВОЕ: Доходы за период
  getIncomeByPeriod: (period = 'today') => {
    const { transactions } = get();
    const range = getPeriodRange(period);

    return transactions
      .filter(t => t.type === 'income' && isInRange(t.date, range))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // НОВОЕ: Расходы за период
  getExpenseByPeriod: (period = 'today') => {
    const { transactions } = get();
    const range = getPeriodRange(period);

    return transactions
      .filter(t => t.type === 'expense' && isInRange(t.date, range))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // НОВОЕ: Разбивка по категориям
  getCategoryBreakdown: (type = 'expense', period = 'month') => {
    const { transactions, categories } = get();
    const range = getPeriodRange(period);

    const filtered = transactions.filter(
      t => t.type === type && isInRange(t.date, range)
    );

    const breakdown = {};
    filtered.forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const catName = cat?.name || 'Без категории';
      breakdown[catName] = (breakdown[catName] || 0) + t.amount;
    });

    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  },

  // НОВОЕ: Транзакции за период
  getTransactionsByPeriod: (period = 'month') => {
    const { transactions } = get();
    const range = getPeriodRange(period);
    return transactions.filter(t => isInRange(t.date, range));
  },

  // --- 7. АНАЛИТИКА ПО КОНТРАГЕНТАМ ---

  // ТОП источников дохода
  getTopIncomeCounterparties: (limit = 5, period = 'month') => {
    const { transactions, counterparties } = get();
    const range = getPeriodRange(period);

    const incomeByCounterparty = {};
    transactions
      .filter(t => t.type === 'income' && t.counterparty_id && isInRange(t.date, range))
      .forEach(t => {
        incomeByCounterparty[t.counterparty_id] = (incomeByCounterparty[t.counterparty_id] || 0) + t.amount;
      });

    return Object.entries(incomeByCounterparty)
      .map(([id, amount]) => {
        const cp = counterparties.find(c => c.id === id);
        return { counterparty: cp, amount };
      })
      .filter(item => item.counterparty)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  },

  // ТОП получателей платежей
  getTopExpenseCounterparties: (limit = 5, period = 'month') => {
    const { transactions, counterparties } = get();
    const range = getPeriodRange(period);

    const expenseByCounterparty = {};
    transactions
      .filter(t => t.type === 'expense' && t.counterparty_id && isInRange(t.date, range))
      .forEach(t => {
        expenseByCounterparty[t.counterparty_id] = (expenseByCounterparty[t.counterparty_id] || 0) + t.amount;
      });

    return Object.entries(expenseByCounterparty)
      .map(([id, amount]) => {
        const cp = counterparties.find(c => c.id === id);
        return { counterparty: cp, amount };
      })
      .filter(item => item.counterparty)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  },

  // Все транзакции с конкретным контрагентом
  getCounterpartyTransactions: (counterpartyId) => {
    const { transactions } = get();
    return transactions.filter(t => t.counterparty_id === counterpartyId);
  },

  // Статистика по контрагенту
  getCounterpartyStats: (counterpartyId) => {
    const transactions = get().getCounterpartyTransactions(counterpartyId);

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transactionCount: transactions.length
    };
  }
}));

// --- УТИЛИТЫ ---

const getRandomColor = () => {
  const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];
  return colors[Math.floor(Math.random() * colors.length)];
};

function getPeriodRange(period) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
    case 'month':
      return { start: startOfMonth(now), end: now };
    case 'year':
      return { start: startOfYear(now), end: now };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

function isInRange(dateString, range) {
  try {
    const date = new Date(dateString);
    return isWithinInterval(date, range);
  } catch {
    return false;
  }
}
