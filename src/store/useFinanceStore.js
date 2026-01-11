import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { toast } from '../components/ui/Toast';
import * as XLSX from 'xlsx';

// Slices
import { createUserSlice } from './slices/userSlice';
import { createAccountSlice } from './slices/accountSlice';
import { createTransactionSlice } from './slices/transactionSlice';
import { createFinanceSlice } from './slices/financeSlice';

export const useFinanceStore = create((set, get) => ({
  ...createUserSlice(set, get),
  ...createAccountSlice(set, get),
  ...createTransactionSlice(set, get),
  ...createFinanceSlice(set, get),

  // ==================================================
  // ORCHESTRATOR ACTIONS (Cross-slice logic)
  // ==================================================

  fetchData: async () => {
    set({ loading: true });
    try {
      const user = get().user;
      if (!user) return;

      // 1. Settings
      let { data: settings } = await supabase.from('user_settings').select('*').single();
      if (!settings) {
        const { data: newSettings } = await supabase.from('user_settings').insert([{ user_id: user.id }]).select().single();
        settings = newSettings;
      }

      // 2. Load Data Parallel
      // We no longer load all transactions here. Dashboard will load recent, History will load paginated.

      const [cat, cp, bud, dbt, rec, goals, notif] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('counterparties').select('*').order('is_favorite', { ascending: false }).order('name'),
        supabase.from('budgets').select('*'),
        supabase.from('debts').select('*').order('created_at', { ascending: false }),
        supabase.from('recurring_transactions').select('*').order('day_of_month'),
        supabase.from('goals').select('*').order('is_completed').order('created_at'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      // Load accounts via action (to get view data)
      await get().fetchAccounts();

      // Load recent transactions for dashboard
      await get().fetchRecentTransactions();

      let categories = cat.data || [];
      const accounts = get().accounts; // Already set by fetchAccounts

      // Seed Logic
      if (accounts.length === 0 && categories.length === 0) {
        // Seed logic omitted for brevity
      }

      set({
        settings: settings || get().settings,
        categories: categories,
        counterparties: cp.data || [],
        // transactions: [], // Don't set transactions here, let History manage it
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

  importData: async (jsonData) => {
    const user = get().user;
    if (!user) return { success: false, error: 'User not logged in' };

    try {
      set({ loading: true });

      // Basic structure check
      if (!jsonData.accounts && !jsonData.transactions) {
        throw new Error('Invalid backup file format');
      }

      const safeMap = (arr) => arr ? arr.map(item => ({ ...item, user_id: user.id })) : [];

      const accounts = safeMap(jsonData.accounts);
      const categories = safeMap(jsonData.categories);
      const counterparties = safeMap(jsonData.counterparties);
      const transactions = safeMap(jsonData.transactions);
      const budgets = safeMap(jsonData.budgets);
      const debts = safeMap(jsonData.debts);
      const recurring = safeMap(jsonData.recurring);
      const goals = safeMap(jsonData.goals);

      await Promise.all([
        accounts.length && supabase.from('accounts').upsert(accounts),
        categories.length && supabase.from('categories').upsert(categories),
        counterparties.length && supabase.from('counterparties').upsert(counterparties),
        budgets.length && supabase.from('budgets').upsert(budgets),
        debts.length && supabase.from('debts').upsert(debts),
        recurring.length && supabase.from('recurring_transactions').upsert(recurring),
        goals.length && supabase.from('goals').upsert(goals)
      ]);

      if (transactions.length) {
        await supabase.from('transactions').upsert(transactions);
      }

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
      const txSheet = XLSX.utils.json_to_sheet(transactions);
      const accSheet = XLSX.utils.json_to_sheet(accounts);
      const debtSheet = XLSX.utils.json_to_sheet(debts);
      const catSheet = XLSX.utils.json_to_sheet(categories);
      const cpSheet = XLSX.utils.json_to_sheet(counterparties);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");
      XLSX.utils.book_append_sheet(wb, accSheet, "Accounts");
      XLSX.utils.book_append_sheet(wb, debtSheet, "Debts");
      XLSX.utils.book_append_sheet(wb, catSheet, "Categories");
      XLSX.utils.book_append_sheet(wb, cpSheet, "Counterparties");

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Finance_Backup_${dateStr}.xlsx`);
      toast.success('Данные экспортированы в Excel');
      return true;
    } catch (e) {
      console.error("Export Error:", e);
      toast.error('Ошибка экспорта');
      return false;
    }
  }
}));
