import { supabase } from '../../supabaseClient';
import { toast } from '../../components/ui/Toast';

export const createFinanceSlice = (set, get) => ({
    budgets: [],
    debts: [],
    recurring: [],
    goals: [],

    // ========================
    // GOALS (Цели)
    // ========================

    addGoal: async (form) => {
        const user = get().user;
        const { data, error } = await supabase.from('goals').insert([{ ...form, user_id: user.id }]).select();

        if (error) {
            console.error(error);
            toast.error('Ошибка создания цели');
            return;
        }

        if (data) {
            set(state => ({ goals: [...state.goals, data[0]] }));
            toast.success('Цель создана');
        }
    },

    deleteGoal: async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);

        if (error) {
            toast.error('Не удалось удалить цель');
            return;
        }

        set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
        toast.success('Цель удалена');
    },

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Создаем транзакцию при пополнении
    addMoneyToGoal: async (goalId, amount, accountId) => {
        const user = get().user;
        const amountVal = parseFloat(amount);
        const goal = get().goals.find(g => g.id === goalId);

        if (!goal || !accountId || amountVal <= 0) {
            toast.error('Некорректные данные');
            return;
        }

        try {
            // 1. Обновляем сумму в цели
            const newAmount = goal.current_amount + amountVal;

            // Если цель достигнута, можно отметить её завершенной (опционально)
            // Триггер в БД может сделать это сам, но обновим и здесь
            const isCompleted = newAmount >= goal.target_amount;

            const { error: goalError } = await supabase
                .from('goals')
                .update({
                    current_amount: newAmount,
                    is_completed: isCompleted ? true : goal.is_completed // Не сбрасываем, если уже была завершена
                })
                .eq('id', goalId);

            if (goalError) throw goalError;

            // 2. Создаем транзакцию списания (чтобы деньги ушли со счета)
            // Мы помечаем это как 'expense' (Расход), так как деньги уходят с текущего баланса
            // В идеале можно добавить тип 'goal_contribution', но 'expense' проще для текущей логики
            const { error: txError } = await supabase.from('transactions').insert([{
                user_id: user.id,
                account_id: accountId,
                amount: amountVal,
                type: 'expense',
                category_id: null, // Без категории или специальная системная категория
                comment: `Пополнение цели: ${goal.name}`,
                date: new Date().toISOString()
            }]);

            if (txError) throw txError;

            // 3. Обновляем локальный стейт (UI)
            set(state => ({
                goals: state.goals.map(g => g.id === goalId ? {
                    ...g,
                    current_amount: newAmount,
                    is_completed: isCompleted ? true : g.is_completed
                } : g)
            }));

            // Важно: Обновляем счета и историю, так как баланс изменился
            await get().fetchAccounts();
            await get().fetchRecentTransactions();

            if (isCompleted && !goal.is_completed) {
                toast.success(`Поздравляем! Цель "${goal.name}" достигнута! 🎉`);
            } else {
                toast.success('Цель пополнена');
            }

        } catch (e) {
            console.error(e);
            toast.error('Ошибка пополнения: ' + e.message);
        }
    },

    // ========================
    // DEBTS (Долги)
    // ========================

    addDebt: async (form) => {
        const user = get().user;
        const { data, error } = await supabase.from('debts').insert([{ ...form, user_id: user.id }]).select();

        if (error) {
            toast.error('Ошибка создания долга');
            return;
        }

        if (data) {
            set(state => ({ debts: [data[0], ...state.debts] }));
            toast.success('Долг записан');
        }
    },

    deleteDebt: async (id) => {
        const { error } = await supabase.from('debts').delete().eq('id', id);
        if (!error) {
            set(state => ({ debts: state.debts.filter(d => d.id !== id) }));
            toast.success('Запись удалена');
        }
    },

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Транзакция при возврате долга
    payDebt: async (debtId, amount, accountId) => {
        const user = get().user;
        const amountVal = parseFloat(amount);
        const debt = get().debts.find(d => d.id === debtId);

        if (!debt || !accountId || amountVal <= 0) return;

        try {
            // 1. Обновляем запись о долге
            const newPaid = (debt.paid_amount || 0) + amountVal;
            const isClosed = newPaid >= debt.amount;

            const { error: debtError } = await supabase
                .from('debts')
                .update({
                    paid_amount: newPaid,
                    is_closed: isClosed
                })
                .eq('id', debtId);

            if (debtError) throw debtError;

            // 2. Создаем транзакцию движения средств
            // Логика:
            // Если "Я должен" (i_owe) и я плачу -> Деньги уходят с моего счета (Expense)
            // Если "Мне должны" (owes_me) и мне платят -> Деньги приходят на мой счет (Income)
            const type = debt.type === 'i_owe' ? 'expense' : 'income';

            const { error: txError } = await supabase.from('transactions').insert([{
                user_id: user.id,
                account_id: accountId,
                amount: amountVal,
                type: type,
                category_id: null,
                comment: `${debt.type === 'i_owe' ? 'Возврат долга' : 'Получение долга'}: ${debt.name}`,
                date: new Date().toISOString()
            }]);

            if (txError) throw txError;

            // 3. Обновляем UI
            set(state => ({
                debts: state.debts.map(d => d.id === debtId ? { ...d, paid_amount: newPaid, is_closed: isClosed } : d)
            }));

            // Обновляем балансы
            await get().fetchAccounts();
            await get().fetchRecentTransactions();

            toast.success(isClosed ? 'Долг полностью закрыт! 🎉' : 'Платеж записан');

        } catch (e) {
            console.error(e);
            toast.error('Ошибка записи платежа');
        }
    },

    // ========================
    // BUDGETS (Бюджеты)
    // ========================

    saveBudget: async (categoryId, amount) => {
        const user = get().user;

        // Upsert: обновляем если есть, создаем если нет (по уникальному ключу user_id + category_id)
        const { data, error } = await supabase.from('budgets').upsert(
            {
                user_id: user.id,
                category_id: categoryId,
                amount: parseFloat(amount),
                period: 'month'
            },
            { onConflict: 'user_id, category_id, period' }
        ).select();

        if (error) {
            toast.error('Не удалось сохранить бюджет');
            return;
        }

        if (data) {
            // Чтобы не усложнять обновление стейта при upsert, просто перезагрузим список бюджетов
            // или найдем и заменим в массиве. Для надежности перезагрузим.
            const { data: allBudgets } = await supabase.from('budgets').select('*');
            set({ budgets: allBudgets || [] });
            toast.success('Бюджет установлен');
        }
    },

    deleteBudget: async (id) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (!error) {
            set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }));
            toast.success('Бюджет удален');
        }
    },

    getBudgetProgress: (categoryId) => {
        // Эта функция синхронная и быстрая, она берет данные из уже загруженного стейта
        const { budgets, transactions, categories } = get();
        const budget = budgets.find(b => b.category_id === categoryId);

        if (!budget) return null;

        // Считаем траты за ТЕКУЩИЙ месяц
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Конец месяца

        const spent = transactions
            .filter(t =>
                t.category_id === categoryId &&
                t.type === 'expense' &&
                new Date(t.date) >= startOfMonth &&
                new Date(t.date) <= endOfMonth
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const cat = categories.find(c => c.id === categoryId);

        return {
            spent,
            limit: budget.amount,
            remaining: Math.max(0, budget.amount - spent),
            percent: (spent / budget.amount) * 100,
            isOver: spent > budget.amount,
            overAmount: Math.max(0, spent - budget.amount),
            categoryName: cat ? cat.name : 'Категория'
        };
    },

    // ========================
    // RECURRING (Подписки)
    // ========================

    checkRecurringTransactions: async () => {
        const user = get().user;
        if (!user) return;

        const { data: recurring, error } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('active', true);

        if (error || !recurring) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();

        let newTransactionsCount = 0;

        for (const item of recurring) {
            // Разбираем дату последнего запуска
            const lastRunDate = item.last_run ? new Date(item.last_run) : null;

            // Проверяем: был ли запуск в ЭТОМ месяце ЭТОГО года?
            const alreadyRanThisMonth = lastRunDate &&
                lastRunDate.getMonth() === currentMonth &&
                lastRunDate.getFullYear() === currentYear;

            // Если еще не запускали И наступил (или прошел) день списания
            if (!alreadyRanThisMonth && currentDay >= item.day_of_month) {

                // 1. Создаем транзакцию
                const { error: txError } = await supabase.from('transactions').insert([{
                    user_id: user.id,
                    account_id: item.account_id,
                    category_id: item.category_id,
                    amount: item.amount,
                    type: item.type, // 'expense' или 'income'
                    comment: `Авто-платеж: ${item.comment || 'Подписка'}`,
                    date: new Date().toISOString()
                }]);

                if (!txError) {
                    // 2. Обновляем last_run у подписки
                    await supabase
                        .from('recurring_transactions')
                        .update({ last_run: new Date().toISOString() })
                        .eq('id', item.id);

                    newTransactionsCount++;
                }
            }
        }

        // Если были созданы новые транзакции, обновляем данные в приложении
        if (newTransactionsCount > 0) {
            toast.success(`Обработано регулярных платежей: ${newTransactionsCount}`);
            get().fetchAccounts(); // Обновить балансы
            get().fetchRecentTransactions(); // Обновить историю
        }
    },

    addRecurring: async (form) => {
        const user = get().user;
        const { data, error } = await supabase.from('recurring_transactions').insert([{...form, user_id: user.id}]).select();

        if(error) return { success: false, error };

        set(s => ({ recurring: [...s.recurring, data[0]] }));
        return { success: true };
    },

    deleteRecurring: async (id) => {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);

        if (!error) {
            set(s => ({ recurring: s.recurring.filter(r => r.id !== id) }));
        }
    }
});