import { supabase } from '../../supabaseClient';
import i18n from '../../i18n'; // Import i18n

const isMoreThanADayAgo = (date) => {
    if (!date) return true;
    const oneDay = 24 * 60 * 60 * 1000;
    return new Date() - new Date(date) > oneDay;
};

export const createUserSlice = (set, get) => ({
    user: null,
    isAuthChecked: false,
    loading: false,

    // Settings
    settings: {
        base_currency: 'UZS',
        currency_rates: { 'USD': 12850, 'EUR': 13500, 'RUB': 140 },
        dark_mode: false,
        isPrivacyEnabled: false
    },
    notifications: [],
    unreadNotifications: 0,

    // --- ACTIONS ---

    checkUser: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            set({ user });
            set({ isAuthChecked: true });

            if (user) {
                // Trigger generic fetch when user is found
                // We will call the composite fetchData from the main store
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
    updateCurrencyRatesIfNeeded: async () => {
        const lastUpdate = localStorage.getItem('currency_last_update');
        if (!isMoreThanADayAgo(lastUpdate)) {
            console.log('Currency rates are up to date.');
            return;
        }

        console.log('Fetching new currency rates...');
        try {
            // API Центробанка Узбекистана
            const response = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/');
            if (!response.ok) throw new Error('CBU API not available');
            const ratesData = await response.json();

            const newRates = {
                UZS: 1, // Базовая валюта
                USD: parseFloat(ratesData.find(r => r.Ccy === 'USD')?.Rate) || get().settings.currency_rates.USD,
                EUR: parseFloat(ratesData.find(r => r.Ccy === 'EUR')?.Rate) || get().settings.currency_rates.EUR,
                RUB: parseFloat(ratesData.find(r => r.Ccy === 'RUB')?.Rate) || get().settings.currency_rates.RUB,
            };

            // Обновляем настройки в базе данных
            const success = await get().updateSettings({ currency_rates: newRates });

            if (success) {
                localStorage.setItem('currency_last_update', new Date().toISOString());
                toast.success(i18n.t('toasts.currency_updated'));
            }

        } catch (error) {
            console.error('Failed to update currency rates:', error);
            // Не показываем ошибку пользователю, чтобы не раздражать, если API недоступен
        }
    },
    updateSettings: async (newSettings) => {
        const user = get().user;
        if (!user) return { success: false, error: 'No user' };

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

    togglePrivacy: () => {
        set(state => {
            const newState = !state.settings.isPrivacyEnabled;
            const newSettings = { ...state.settings, isPrivacyEnabled: newState };
            localStorage.setItem('finance_privacy', JSON.stringify(newState));
            return { settings: newSettings };
        });
    },

    // --- NOTIFICATIONS ---
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
        if (!user) return;

        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadNotifications: 0
        }));
    }
});
