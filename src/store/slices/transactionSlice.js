import { supabase } from '../../supabaseClient';
import { toast } from '../../components/ui/Toast';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';

export const createTransactionSlice = (set, get) => ({
    transactions: [],
    recentTransactions: [], // For Dashboard
    hasMore: true,
    currentPage: 0,
    isLoadingTransactions: false,

    fetchRecentTransactions: async () => {
        const user = get().user;
        const { data } = await supabase.from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(5);

        if (data) set({ recentTransactions: data });
    },

    fetchTransactions: async ({ page = 0, limit = 20, filters = {}, append = false } = {}) => {
        set({ isLoadingTransactions: true });
        try {
            const user = get().user;
            let query = supabase
                .from('transactions')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .range(page * limit, (page + 1) * limit - 1);

            // Apply Filters
            if (filters.account_id && filters.account_id !== 'all') query = query.eq('account_id', filters.account_id);
            if (filters.category_id && filters.category_id !== 'all') query = query.eq('category_id', filters.category_id);
            if (filters.type && filters.type !== 'all') {
                if (filters.type === 'transfer') query = query.in('type', ['transfer_in', 'transfer_out']);
                else query = query.eq('type', filters.type);
            }
            if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
            if (filters.dateTo) query = query.lte('date', filters.dateTo + 'T23:59:59');
            if (filters.search) query = query.ilike('comment', `%${filters.search}%`);

            const { data, count, error } = await query;

            if (error) throw error;

            set(state => ({
                transactions: append ? [...state.transactions, ...data] : data,
                hasMore: data.length === limit,
                currentPage: page,
                isLoadingTransactions: false
            }));

            return { count };

        } catch (e) {
            console.error(e);
            toast.error('Ошибка загрузки транзакций');
            set({ isLoadingTransactions: false });
        }
    },


    // --- ACTIONS ---

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
                // Refresh balances and recent list
                get().fetchAccounts();
                get().fetchRecentTransactions();

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
            // Refresh balances and recent
            get().fetchAccounts();
            get().fetchRecentTransactions();
            toast.success('Транзакция удалена');
        }
    },

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
            amount: amountVal,
            type: 'transfer_in',
            comment: comment || 'Перевод (зачисление)',
            date: date
        };

        try {
            const { data, error } = await supabase.from('transactions').insert([txOut, txIn]).select();
            if (error) throw error;

            if (data) {
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

    // --- ANALYTICS ---

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

        let days = 30;
        if (period === 'week') days = 7;
        // if (period === 'year') days = 365;

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

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

    // Monthly Statistics
    getMonthlyIncome: () => {
        const { transactions } = get();
        const now = new Date();
        const start = startOfMonth(now);
        const end = new Date();

        return transactions
            .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start, end }))
            .reduce((sum, t) => sum + t.amount, 0);
    },

    getMonthlyExpense: () => {
        const { transactions } = get();
        const now = new Date();
        const start = startOfMonth(now);
        const end = new Date();

        return transactions
            .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
            .reduce((sum, t) => sum + t.amount, 0);
    },

    getMonthlyProfit: () => {
        const income = get().getMonthlyIncome();
        const expense = get().getMonthlyExpense();
        return income - expense;
    },

    getBudgetCompletion: () => {
        const { budgets } = get();
        if (budgets.length === 0) return 0;

        let totalCompletion = 0;
        budgets.forEach(budget => {
            const progress = get().getBudgetProgress(budget.category_id);
            if (progress) {
                totalCompletion += Math.min(progress.percent, 100);
            }
        });

        return budgets.length > 0 ? Math.round(totalCompletion / budgets.length) : 0;
    },

    // Top Expense Categories
    getTopExpenseCategories: (limit = 3) => {
        const { transactions, categories } = get();
        const now = new Date();
        const start = startOfMonth(now);
        const end = new Date();

        // Get all expense transactions for current month
        const monthExpenses = transactions.filter(t =>
            t.type === 'expense' &&
            t.category_id &&
            isWithinInterval(new Date(t.date), { start, end })
        );

        // Calculate total per category
        const categoryTotals = {};
        monthExpenses.forEach(t => {
            if (!categoryTotals[t.category_id]) {
                categoryTotals[t.category_id] = 0;
            }
            categoryTotals[t.category_id] += t.amount;
        });

        // Convert to array and sort by amount
        const sortedCategories = Object.entries(categoryTotals)
            .map(([categoryId, amount]) => {
                const category = categories.find(c => c.id === categoryId);
                return {
                    categoryId,
                    name: category?.name || 'Неизвестно',
                    icon: category?.icon || '📌',
                    amount,
                };
            })
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);

        // Calculate total expenses for percentage
        const totalExpenses = get().getMonthlyExpense();

        return sortedCategories.map(cat => ({
            ...cat,
            percentage: totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0
        }));
    },

    // Top Used Categories (by transaction count)
    getTopUsedCategories: (limit = 6) => {
        const { transactions, categories } = get();
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        // Count transactions per category
        const categoryCounts = {};
        transactions
            .filter(t => t.type === 'expense' && t.category_id && new Date(t.date) >= last30Days)
            .forEach(t => {
                if (!categoryCounts[t.category_id]) {
                    categoryCounts[t.category_id] = 0;
                }
                categoryCounts[t.category_id]++;
            });

        // Convert to array and sort by count
        const sortedCategories = Object.entries(categoryCounts)
            .map(([categoryId, count]) => {
                const category = categories.find(c => c.id === categoryId);
                return {
                    categoryId,
                    name: category?.name || 'Неизвестно',
                    icon: category?.icon || '📌',
                    count,
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        // If less than limit, add default categories
        const defaultCategories = [
            { name: 'Кофе', icon: '☕' },
            { name: 'Продукты', icon: '🛒' },
            { name: 'Транспорт', icon: '🚕' },
            { name: 'Обед', icon: '🍽️' },
            { name: 'Такси', icon: '🚖' },
            { name: 'Кино', icon: '🎬' },
        ];

        while (sortedCategories.length < limit && defaultCategories.length > 0) {
            const defaultCat = defaultCategories.shift();
            const existingCat = categories.find(c => c.name.toLowerCase().includes(defaultCat.name.toLowerCase()));
            if (existingCat && !sortedCategories.find(sc => sc.categoryId === existingCat.id)) {
                sortedCategories.push({
                    categoryId: existingCat.id,
                    name: existingCat.name,
                    icon: existingCat.icon || defaultCat.icon,
                    count: 0,
                });
            } else if (!existingCat) {
                sortedCategories.push({
                    categoryId: null,
                    name: defaultCat.name,
                    icon: defaultCat.icon,
                    count: 0,
                });
            }
        }

        return sortedCategories;
    }
});

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
