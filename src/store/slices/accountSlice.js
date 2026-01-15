import { supabase } from '../../supabaseClient';
import { toast } from '../../components/ui/Toast';
import i18n from '../../i18n'; // Import i18n

export const createAccountSlice = (set, get) => ({
    accounts: [],
    categories: [],
    counterparties: [],

    // --- ACCOUNTS ---
    createAccount: async (name, currency = 'UZS', color, icon = '💳', initialBalance = 0) => {
        const user = get().user;
        try {
            // 1. Создаем счет
            const { data: accounts, error: accError } = await supabase.from('accounts').insert([{
                user_id: user.id,
                name,
                currency,
                color: color || getRandomColor(),
                icon
            }]).select();

            if (accError) throw accError;

            const newAccount = accounts[0];

            // 2. Если есть начальный баланс, создаем транзакцию корректировки
            if (initialBalance && initialBalance != 0) {
                const isPositive = initialBalance > 0;
                // Используем тип income/expense, чтобы баланс посчитался через view
                // Но пометим в комментарии, что это корректировка
                await supabase.from('transactions').insert([{
                    user_id: user.id,
                    account_id: newAccount.id,
                    amount: Math.abs(initialBalance),
                    type: isPositive ? 'income' : 'expense',
                    category_id: null, // Без категории
                    comment: i18n.t('toasts.initial_balance'),
                    date: new Date().toISOString()
                }]);
            }

            // 3. Обновляем стейт локально
            // Важно: так как баланс считается во view, нам нужно либо пересчитать view,
            // либо вручную добавить баланс в объект для UI
            const accountWithBalance = {
                ...newAccount,
                balance: Number(initialBalance)
            };

            set(state => ({ accounts: [...state.accounts, accountWithBalance] }));

            // Триггерим обновление транзакций, чтобы "Начальный остаток" появился в истории
            if (initialBalance != 0) {
                get().fetchRecentTransactions();
            }

            toast.success(i18n.t('toasts.acc_created'));
            return true;
        } catch (e) {
            console.error(e);
            toast.error(i18n.t('toasts.acc_create_error'));
            return false;
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
            toast.success(i18n.t('toasts.acc_deleted'));
        }
    },

    getAccountBalance: (id) => {
        const account = get().accounts.find(a => a.id === id);
        return account ? account.balance : 0;
    },

    fetchAccounts: async () => {
        const { data, error } = await supabase.from('view_account_balances').select('*').order('name');
        if (!error && data) {
            set({ accounts: data });
        }
    },

    // --- CATEGORIES ---
    createCategory: async (name, type, icon = '📌', color) => {
        const user = get().user;
        // Basic validation for icon
        const safeIcon = (icon && icon.trim()) ? icon : '📌';

        const { data } = await supabase.from('categories').insert([{
            user_id: user.id, name, type, icon: safeIcon, color: color || getRandomColor()
        }]).select();
        if (data) set(state => ({ categories: [...state.categories, data[0]] }));
    },

    deleteCategory: async (id) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) {
            set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
            toast.success(i18n.t('toasts.cat_deleted'));
        } else {
            console.error(error);
            toast.error(i18n.t('toasts.cat_delete_error'));
        }
    },

    deleteAllCategories: async () => {
        const user = get().user;
        const { error } = await supabase.from('categories').delete().eq('user_id', user.id);
        if (!error) {
            set({ categories: [] });
            toast.success(i18n.t('toasts.cats_cleared'));
        } else {
            console.error(error);
            toast.error(i18n.t('toasts.cats_clear_error'));
        }
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

    // Helpers
    getTotalBalanceInBaseCurrency: () => {
        const { accounts, getAccountBalance, settings, convertCurrency } = get();
        const base = settings.base_currency;
        return accounts.reduce((total, acc) => {
            const balance = getAccountBalance(acc.id);
            return total + convertCurrency(balance, acc.currency, base);
        }, 0);
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
});

function getRandomColor() {
    const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#ec4899', '#8b5cf6'];
    return colors[Math.floor(Math.random() * colors.length)];
}
