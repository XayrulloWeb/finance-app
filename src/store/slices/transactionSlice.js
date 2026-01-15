import { supabase } from '../../supabaseClient';
import { toast } from '../../components/ui/Toast';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';
import i18n from '../../i18n'; // Import i18n

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

    updateTransaction: async (id, updates) => {
        const user = get().user;
        try {
            // 1. Обновляем в БД
            const { data, error } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) throw error;

            if (data) {
                // 2. Обновляем локальный стейт
                set(state => ({
                    transactions: state.transactions.map(t => t.id === id ? data[0] : t),
                    // Обновляем и в списке "недавних", если она там есть
                    recentTransactions: state.recentTransactions.map(t => t.id === id ? data[0] : t)
                }));

                // 3. Если изменилась сумма, счет или тип - нужно обновить балансы аккаунтов
                // Для надежности обновляем их всегда при редактировании
                get().fetchAccounts();

                toast.success(i18n.t('toasts.tx_updated'));
                return true;
            }
        } catch (e) {
            console.error(e);
            toast.error(i18n.t('toasts.update_error'));
            return false;
        }
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
            toast.error(i18n.t('toasts.tx_load_error'));
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

                if (!form.silent) toast.success(i18n.t('toasts.tx_added'));
                return true;
            }
        } catch (e) {
            console.error(e);
            toast.error(i18n.t('toasts.create_error'));
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
            toast.success(i18n.t('toasts.tx_deleted'));
        }
    },

    addTransfer: async (fromAccountId, toAccountId, amount, comment) => {
        const user = get().user;
        const amountVal = Number(amount);
        const date = new Date().toISOString();

        if (!user || !fromAccountId || !toAccountId) {
            toast.error(i18n.t('toasts.transfer_invalid'));
            return { success: false };
        }

        if (fromAccountId === toAccountId) {
            toast.error(i18n.t('toasts.transfer_same_account'));
            return { success: false };
        }

        if (amountVal <= 0) {
            toast.error(i18n.t('toasts.amount_positive'));
            return { success: false };
        }

        try {
            // ИСПОЛЬЗУЕМ RPC (Безопасный перевод)
            const { data, error } = await supabase.rpc('perform_transfer', {
                p_user_id: user.id,
                p_from_account_id: fromAccountId,
                p_to_account_id: toAccountId,
                p_amount: amountVal,
                p_comment: comment || 'Перевод средств',
                p_date: date
            });

            if (error) throw error;
            if (!data || data.success === false) throw new Error(data?.error || 'Unknown error');

            // Обновляем данные локально
            get().fetchAccounts(); // Обновить балансы
            get().fetchRecentTransactions(); // Обновить список на главной
            toast.success(i18n.t('toasts.transfer_success'));
            return { success: true };

        } catch (err) {
            console.error('Transfer Error:', err);
            toast.error(i18n.t('toasts.transfer_error') + err.message);
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
