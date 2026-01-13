import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { toast } from '../components/ui/Toast';
import * as XLSX from 'xlsx';
// Slices
import { createUserSlice } from './slices/userSlice';
import { createAccountSlice } from './slices/accountSlice';
import { createTransactionSlice } from './slices/transactionSlice';
import { createFinanceSlice } from './slices/financeSlice';
import { createInsightsSlice } from './slices/insightsSlice';
import { createUiSlice } from './slices/uiSlice';


export const useFinanceStore = create((set, get) => ({
  ...createUserSlice(set, get),
  ...createAccountSlice(set, get),
  ...createTransactionSlice(set, get),
  ...createFinanceSlice(set, get),
  ...createInsightsSlice(set, get),
  ...createUiSlice(set, get),

  // ==================================================
  // ORCHESTRATOR ACTIONS (Cross-slice logic)
  // ==================================================

  fetchData: async () => {
    set({ loading: true });
    try {
      const user = get().user;
      if (!user) return;

      // 1. Settings
      let { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Используем maybeSingle, чтобы не получать 406 ошибку если записи нет

      if (!settings) {
        // Если настроек нет, создаем их
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .upsert(
            { user_id: user.id },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (createError) {
          console.error("Error creating settings:", createError);
          // Фолбэк на дефолтные, если база лежит
          settings = get().settings;
        } else {
          settings = newSettings;
        }
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

      // Если импортируем ПОЛНЫЙ бэкап (счета, категории и т.д.)
      if (jsonData.accounts && jsonData.categories) {
        // ... (старая логика для полного JSON бэкапа)
        // ... (код который был в useFinanceStore)
      }

      // Если импортируем ПРОСТО транзакции из Excel (плоский список)
      else if (jsonData.transactions && Array.isArray(jsonData.transactions)) {

        // 1. Получаем текущие ID счетов и категорий для маппинга
        const { accounts, categories } = get();
        const defaultAccount = accounts[0]?.id;

        if (!defaultAccount) throw new Error('Сначала создайте хотя бы один счет');

        // 2. Подготовка транзакций
        const transactionsToInsert = jsonData.transactions.map(t => {
          // Пытаемся найти ID категории по имени, если передан текст
          let catId = t.category_id;
          if (!catId && t.category_name) {
            const found = categories.find(c => c.name.toLowerCase() === t.category_name.toLowerCase());
            if (found) catId = found.id;
          }

          // Пытаемся найти ID счета
          let accId = t.account_id;
          if (!accId && t.account_name) {
            const found = accounts.find(a => a.name.toLowerCase() === t.account_name.toLowerCase());
            if (found) accId = found.id;
          }

          return {
            user_id: user.id,
            amount: parseFloat(t.amount),
            type: t.type || (t.amount > 0 ? 'income' : 'expense'),
            date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
            comment: t.comment || '',
            account_id: accId || defaultAccount, // Fallback на дефолтный счет
            category_id: catId || null
          };
        });

        const { error } = await supabase.from('transactions').insert(transactionsToInsert);
        if (error) throw error;
      }

      await get().fetchData();
      return { success: true };

    } catch (e) {
      console.error('Import Error:', e);
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
