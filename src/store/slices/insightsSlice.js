
import { supabase } from '../../supabaseClient';

export const createInsightsSlice = (set) => ({
    insightsData: null,
    isInsightsLoading: false,

    fetchInsights: async () => {
        set({ isInsightsLoading: true });
        try {
            const { data, error } = await supabase.rpc('get_insights_data');
            if (error) throw error;
            set({ insightsData: data, isInsightsLoading: false });
        } catch (e) {
            console.error('Failed to fetch insights:', e);
            set({ isInsightsLoading: false });
        }
    },
});