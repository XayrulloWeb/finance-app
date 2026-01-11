import { supabase } from '../../supabaseClient';
import { toast } from '../../components/ui/Toast';

export const createAccountSlice = (set, get) => ({
    accounts: [],
    categories: [],
    counterparties: [],

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
        const { data } = await supabase.from('categories').insert([{
            user_id: user.id, name, type, icon, color: color || getRandomColor()
        }]).select();
        if (data) set(state => ({ categories: [...state.categories, data[0]] }));
    },

    deleteCategory: async (id) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) {
            set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
            toast.success('Категория удалена');
        } else {
            console.error(error);
            toast.error('Не удалось удалить (возможно есть связанные транзакции)');
        }
    },

    deleteAllCategories: async () => {
        const user = get().user;
        const { error } = await supabase.from('categories').delete().eq('user_id', user.id);
        if (!error) {
            set({ categories: [] });
            toast.success('Все категории удалены');
        } else {
            console.error(error);
            toast.error('Ошибка очистки категорий');
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
