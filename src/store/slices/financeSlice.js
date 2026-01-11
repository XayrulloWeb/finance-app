import { supabase } from '../../supabaseClient';
import { toast } from '../../components/ui/Toast';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const createFinanceSlice = (set, get) => ({
    budgets: [],
    debts: [],
    recurring: [],
    goals: [],

    // --- BUDGETS ---
    saveBudget: async (categoryId, amount) => {
        const user = get().user;
        const existing = get().budgets.find(b => b.category_id === categoryId);

        if (existing) {
            const { data } = await supabase.from('budgets').update({ amount: Number(amount) }).eq('id', existing.id).select();
            if (data) set(state => ({ budgets: state.budgets.map(b => b.id === existing.id ? data[0] : b) }));
        } else {
            const { data } = await supabase.from('budgets').insert([{ user_id: user.id, category_id: categoryId, amount: Number(amount) }]).select();
            if (data) set(state => ({ budgets: [...state.budgets, data[0]] }));
        }
        toast.success('Бюджет сохранен');
    },

    deleteBudget: async (id) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (!error) {
            set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }));
            toast.success('Бюджет удален');
        }
    },

    getBudgetProgress: (categoryId) => {
        const { budgets, transactions } = get();
        const budget = budgets.find(b => b.category_id === categoryId);
        if (!budget) return null;

        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());

        const spent = transactions
            .filter(t => t.category_id === categoryId && t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
            .reduce((sum, t) => sum + t.amount, 0);

        const percent = (spent / budget.amount) * 100;

        return {
            spent,
            remaining: budget.amount - spent,
            percent,
            isOver: spent > budget.amount
        };
    },

    // --- DEBTS ---
    addDebt: async (form) => {
        const user = get().user;
        const { data, error } = await supabase.from('debts').insert([{
            user_id: user.id, ...form
        }]).select();
        if (data) {
            set(state => ({ debts: [data[0], ...state.debts] }));
            return { success: true };
        }
        return { success: false, error };
    },

    payDebt: async (id, amount, accountId) => {
        const debt = get().debts.find(d => d.id === id);
        if (!debt) return;

        const newPaid = Number(debt.paid_amount) + Number(amount);
        const isClosed = newPaid >= debt.amount;

        const { data, error } = await supabase.from('debts')
            .update({ paid_amount: newPaid, is_closed: isClosed })
            .eq('id', id)
            .select();

        if (data) {
            set(state => ({ debts: state.debts.map(d => d.id === id ? data[0] : d) }));

            const type = debt.type === 'i_owe' ? 'expense' : 'income';
            const comment = `Возврат долга: ${debt.name}`;

            let finalAccountId = accountId;
            if (!finalAccountId) {
                const accounts = get().accounts;
                if (accounts.length > 0) finalAccountId = accounts[0].id;
            }

            if (finalAccountId) {
                await get().addTransaction({
                    account_id: finalAccountId,
                    category_id: null,
                    amount: Number(amount),
                    type,
                    comment,
                    date: new Date().toISOString(),
                    silent: false
                });
            } else {
                toast.success('Долг обновлен (Транзакция не создана - нет счета)');
            }

            return { success: true };
        }
        return { success: false, error };
    },

    deleteDebt: async (id) => {
        const { error } = await supabase.from('debts').delete().eq('id', id);
        if (!error) {
            set(state => ({ debts: state.debts.filter(d => d.id !== id) }));
        }
    },

    // --- RECURRING ---
    addRecurring: async (form) => {
        const user = get().user;
        const { data, error } = await supabase.from('recurring_transactions').insert([{
            user_id: user.id, ...form
        }]).select();
        if (data) {
            set(state => ({ recurring: [...state.recurring, data[0]] }));
            return { success: true };
        }
        return { success: false, error };
    },

    deleteRecurring: async (id) => {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if (!error) {
            set(state => ({ recurring: state.recurring.filter(r => r.id !== id) }));
        }
    },

    checkRecurringTransactions: async () => {
        const { recurring, addTransaction } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const toRun = [];

        // Identify needed runs
        for (const r of recurring) {
            if (!r.active) continue;

            let lastRun = r.last_run ? new Date(r.last_run) : new Date(r.created_at);
            lastRun.setHours(0, 0, 0, 0);

            // Calculate next due date from last run
            let nextRun = new Date(lastRun);

            // LOGIC: Simple monthly iteration for now
            nextRun.setMonth(nextRun.getMonth() + 1);
            nextRun.setDate(r.day_of_month);

            // If nextRun is in the past or today, we need to run it
            // Limit to 3 months catch-up to avoid instant drain
            let safetyCounter = 0;
            while (nextRun <= today && safetyCounter < 3) {
                toRun.push({ ...r, dateForTx: new Date(nextRun) });

                // Advance to next month for next iteration check
                nextRun.setMonth(nextRun.getMonth() + 1);
                nextRun.setDate(r.day_of_month);
                safetyCounter++;
            }
        }

        if (toRun.length === 0) return;

        let processed = 0;
        for (const item of toRun) {
            const res = await addTransaction({
                account_id: item.account_id,
                category_id: item.category_id,
                amount: item.amount,
                type: item.type,
                comment: `Авто: ${item.comment || 'Подписка'} (${item.dateForTx.toLocaleDateString()})`,
                date: item.dateForTx.toISOString(),
                silent: true
            });

            if (res) {
                // Update last_run to the date we just processed
                await supabase.from('recurring_transactions')
                    .update({ last_run: item.dateForTx.toISOString() })
                    .eq('id', item.id);
                processed++;
            }
        }

        if (processed > 0) {
            get().fetchData();
            toast.success(`Проведено регулярных платежей: ${processed}`);
        }
    },

    // --- GOALS ---
    addGoal: async (form) => {
        const user = get().user;
        const { data, error } = await supabase.from('goals').insert([{
            user_id: user.id, ...form
        }]).select();
        if (data) {
            set(state => ({ goals: [...state.goals, data[0]] }));
            toast.success('Цель создана! 🚀');
            return true;
        }
        if (error) toast.error(error.message);
    },

    updateGoal: async (id, updates) => {
        const { data } = await supabase.from('goals').update(updates).eq('id', id).select();
        if (data) {
            set(state => ({ goals: state.goals.map(g => g.id === id ? data[0] : g) }));
            toast.success('Цель обновлена');
        }
    },

    deleteGoal: async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (!error) {
            set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
            toast.success('Цель удалена');
        }
    },

    addMoneyToGoal: async (goalId, amount, accountId) => {
        const goal = get().goals.find(g => g.id === goalId);
        const success = await get().addTransaction({
            account_id: accountId,
            category_id: null,
            amount: amount,
            type: 'expense',
            comment: `Перевод на цель: ${goal.name}`,
            silent: true
        });

        if (success) {
            const newAmount = Number(goal.current_amount) + Number(amount);
            await get().updateGoal(goalId, { current_amount: newAmount });
            toast.success(`Отложено ${amount} на цель!`);
        }
    },
});
