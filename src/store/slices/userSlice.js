import { supabase } from '../../supabaseClient';

export const createUserSlice = (set, get) => ({
    user: null,
    isAuthChecked: false,
    loading: false,

    // Settings
    settings: {
        base_currency: 'UZS',
        currency_rates: { 'UZS': 1, 'USD': 12850 },
        dark_mode: false,
        theme_color: '#2563eb',
        isPrivacyEnabled: JSON.parse(localStorage.getItem('finance_privacy') || 'false')
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
