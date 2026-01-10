-- ==========================================
-- FINANCE APP - ENHANCED SCHEMA v2.1
-- ==========================================

-- ==========================================
-- 1. СБРОС (Reset)
-- ==========================================
DROP VIEW IF EXISTS view_account_balances;
DROP VIEW IF EXISTS view_monthly_category_stats;
DROP VIEW IF EXISTS view_top_counterparties;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS counterparties CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer_in', 'transfer_out');
CREATE TYPE notification_type AS ENUM ('success', 'warning', 'error', 'info');

-- ==========================================
-- 2. ТАБЛИЦЫ (Tables)
-- ==========================================

-- 2.1 Настройки пользователя
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  base_currency TEXT DEFAULT 'UZS',
  currency_rates JSONB DEFAULT '{"UZS": 1, "USD": 12850}'::jsonb,
  dark_mode BOOLEAN DEFAULT false,
  theme_color TEXT DEFAULT '#2563eb',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Счета
CREATE TABLE accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'UZS',
    color TEXT DEFAULT '#2563eb',
    icon TEXT DEFAULT '💳',
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Категории
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- income, expense, transfer
    icon TEXT DEFAULT '🏷️',
    color TEXT DEFAULT '#64748b',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 Контрагенты
CREATE TABLE counterparties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'company', -- person, company, service
    icon TEXT DEFAULT '👤',
    color TEXT DEFAULT '#64748b',
    is_favorite BOOLEAN DEFAULT false,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Транзакции
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    counterparty_id UUID REFERENCES counterparties(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    type transaction_type NOT NULL,
    comment TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Бюджеты
CREATE TABLE budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  period TEXT DEFAULT 'month', -- week, month, year
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id, period)
);

-- 2.7 Долги
CREATE TABLE debts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  counterparty_id UUID REFERENCES counterparties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('i_owe', 'owes_me')),
  due_date DATE,
  is_closed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.8 Регулярные операции
CREATE TABLE recurring_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  counterparty_id UUID REFERENCES counterparties(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  type transaction_type NOT NULL,
  frequency TEXT DEFAULT 'monthly', -- weekly, monthly, yearly
  day_of_month INTEGER,
  day_of_week INTEGER, -- 0-6 for weekly
  comment TEXT,
  active BOOLEAN DEFAULT true,
  last_run DATE,
  next_run DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.9 Цели (Goals) - NEW
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#2563eb',
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10 Уведомления (Notifications) - NEW
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  related_type TEXT, -- 'transaction', 'budget', 'goal', 'debt'
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. VIEWS (Представления)
-- ==========================================

-- 3.1 Балансы счетов
CREATE OR REPLACE VIEW view_account_balances AS
SELECT 
  a.id,
  a.user_id,
  a.name,
  a.currency,
  a.color,
  a.icon,
  a.is_hidden,
  COALESCE(
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) +
    SUM(CASE WHEN t.type = 'transfer_in' THEN t.amount ELSE 0 END) -
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) -
    SUM(CASE WHEN t.type = 'transfer_out' THEN t.amount ELSE 0 END),
    0
  ) as balance,
  COUNT(t.id) as transaction_count,
  MAX(t.date) as last_transaction_date
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.user_id, a.name, a.currency, a.color, a.icon, a.is_hidden;

-- 3.2 Статистика по категориям за месяц
CREATE OR REPLACE VIEW view_monthly_category_stats AS
SELECT 
  c.id as category_id,
  c.user_id,
  c.name as category_name,
  c.type,
  c.icon,
  DATE_TRUNC('month', t.date) as month,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_amount,
  AVG(t.amount) as avg_amount,
  MAX(t.amount) as max_amount,
  MIN(t.amount) as min_amount
FROM categories c
LEFT JOIN transactions t ON c.id = t.category_id
WHERE t.date IS NOT NULL
GROUP BY c.id, c.user_id, c.name, c.type, c.icon, DATE_TRUNC('month', t.date);

-- 3.3 Топ контрагентов
CREATE OR REPLACE VIEW view_top_counterparties AS
SELECT 
  cp.id,
  cp.user_id,
  cp.name,
  cp.type,
  cp.icon,
  cp.is_favorite,
  COUNT(t.id) as transaction_count,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_received,
  MAX(t.date) as last_transaction_date
FROM counterparties cp
LEFT JOIN transactions t ON cp.id = t.counterparty_id
GROUP BY cp.id, cp.user_id, cp.name, cp.type, cp.icon, cp.is_favorite;

-- ==========================================
-- 4. БЕЗОПАСНОСТЬ (RLS Security)
-- ==========================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политики для ВСЕХ операций (SELECT, INSERT, UPDATE, DELETE)

-- User Settings
CREATE POLICY "RLS_Settings_All" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Accounts
CREATE POLICY "RLS_Accounts_Select" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Accounts_Insert" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Accounts_Update" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Accounts_Delete" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "RLS_Categories_Select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Categories_Insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Categories_Update" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Categories_Delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Counterparties
CREATE POLICY "RLS_Counterparties_Select" ON counterparties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Counterparties_Insert" ON counterparties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Counterparties_Update" ON counterparties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Counterparties_Delete" ON counterparties FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "RLS_Transactions_Select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Transactions_Insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Transactions_Update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Transactions_Delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "RLS_Budgets_Select" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Budgets_Insert" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Budgets_Update" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Budgets_Delete" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Debts
CREATE POLICY "RLS_Debts_Select" ON debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Debts_Insert" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Debts_Update" ON debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Debts_Delete" ON debts FOR DELETE USING (auth.uid() = user_id);

-- Recurring Transactions
CREATE POLICY "RLS_Recurring_Select" ON recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Recurring_Insert" ON recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Recurring_Update" ON recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Recurring_Delete" ON recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- Goals
CREATE POLICY "RLS_Goals_Select" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Goals_Insert" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Goals_Update" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Goals_Delete" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "RLS_Notifications_Select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS_Notifications_Insert" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Notifications_Update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS_Notifications_Delete" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 5. ИНДЕКСЫ (Performance)
-- ==========================================
CREATE INDEX idx_tx_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_tx_account ON transactions(account_id);
CREATE INDEX idx_tx_category ON transactions(category_id);
CREATE INDEX idx_tx_counterparty ON transactions(counterparty_id);
CREATE INDEX idx_tx_type ON transactions(type);

CREATE INDEX idx_debts_user ON debts(user_id, is_closed);
CREATE INDEX idx_goals_user ON goals(user_id, is_completed);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_recurring_user ON recurring_transactions(user_id, active);

CREATE INDEX idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_counterparties_user ON counterparties(user_id);

-- ==========================================
-- 6. ТРИГГЕРЫ (Triggers)
-- ==========================================

-- 6.1 Триггер для новых пользователей
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- 1. Настройки
  INSERT INTO public.user_settings (user_id) VALUES (new.id);
  
  -- 2. Базовые категории (РАСШИРЕННЫЙ СПИСОК)
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES 
    -- ДОХОДЫ
    (new.id, 'Зарплата', 'income', '💰', '#10b981'),
    (new.id, 'Фриланс', 'income', '💻', '#3b82f6'),
    (new.id, 'Подарки', 'income', '🎁', '#ec4899'),
    (new.id, 'Инвестиции', 'income', '📈', '#8b5cf6'),
    (new.id, 'Кэшбэк', 'income', '💸', '#f59e0b'),
    
    -- РАСХОДЫ: Обязательные
    (new.id, 'Продукты', 'expense', '🛒', '#ef4444'),
    (new.id, 'Транспорт', 'expense', '🚕', '#f59e0b'),
    (new.id, 'Аренда/Ипотека', 'expense', '🏠', '#0ea5e9'),
    (new.id, 'Коммуналка', 'expense', '💡', '#6366f1'),
    (new.id, 'Связь и Интернет', 'expense', '📱', '#3b82f6'),
    
    -- РАСХОДЫ: Личное
    (new.id, 'Кафе и Рестораны', 'expense', '☕', '#8b5cf6'),
    (new.id, 'Досуг и Кино', 'expense', '🎬', '#ec4899'),
    (new.id, 'Шоппинг', 'expense', '🛍️', '#a855f7'),
    (new.id, 'Уход и Косметика', 'expense', '💅', '#db2777'),
    (new.id, 'Здоровье', 'expense', '💊', '#14b8a6'),
    (new.id, 'Спорт', 'expense', '💪', '#f97316'),
    
    -- РАСХОДЫ: Разное
    (new.id, 'Образование', 'expense', '📚', '#6366f1'),
    (new.id, 'Путешествия', 'expense', '✈️', '#06b6d4'),
    (new.id, 'Машина', 'expense', '🚗', '#e11d48'),
    (new.id, 'Дети', 'expense', '👶', '#fbbf24'),
    (new.id, 'Питомцы', 'expense', '🐾', '#78350f'),
    (new.id, 'Благотворительность', 'expense', '🙏', '#10b981'),
    (new.id, 'Техника', 'expense', '💻', '#64748b'),
    
    -- СЛУЖЕБНЫЕ
    (new.id, 'Перевод', 'transfer', '🔄', '#64748b');
  
  -- 3. Приветственное уведомление
  INSERT INTO public.notifications (user_id, title, message, type) VALUES 
    (new.id, 'Добро пожаловать! 🎉', 'Мы подготовили для вас начальные категории. Вы можете скрыть или удалить ненужные в настройках.', 'success');
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6.2 Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6.3 Триггер для автоматического закрытия целей
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount AND NOT NEW.is_completed THEN
    NEW.is_completed = true;
    NEW.completed_at = now();
    
    -- Создать уведомление о достижении цели
    INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
    VALUES (NEW.user_id, 'Цель достигнута! 🎉', 'Поздравляем! Вы достигли цели: ' || NEW.name, 'success', NEW.id, 'goal');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goal_completion
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION check_goal_completion();

-- 6.4 Триггер для предупреждений о бюджете
CREATE OR REPLACE FUNCTION check_budget_limit()
RETURNS TRIGGER AS $$
DECLARE
  budget_amount DECIMAL(12,2);
  spent_amount DECIMAL(12,2);
  budget_exists BOOLEAN;
BEGIN
  -- Проверяем только для расходов
  IF NEW.type = 'expense' AND NEW.category_id IS NOT NULL THEN
    -- Получаем лимит бюджета для категории
    SELECT amount, true INTO budget_amount, budget_exists
    FROM budgets 
    WHERE user_id = NEW.user_id 
      AND category_id = NEW.category_id 
      AND period = 'month'
    LIMIT 1;
    
    IF budget_exists THEN
      -- Считаем траты за текущий месяц
      SELECT COALESCE(SUM(amount), 0) INTO spent_amount
      FROM transactions
      WHERE user_id = NEW.user_id
        AND category_id = NEW.category_id
        AND type = 'expense'
        AND DATE_TRUNC('month', date) = DATE_TRUNC('month', NEW.date);
      
      -- Если превышено 80% бюджета
      IF spent_amount >= budget_amount * 0.8 THEN
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (
          NEW.user_id, 
          'Превышение бюджета! ⚠️', 
          'Вы потратили ' || ROUND((spent_amount/budget_amount * 100)::numeric, 0) || '% от бюджета в категории',
          'warning',
          NEW.category_id,
          'budget'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_budget_warning
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_budget_limit();

-- ==========================================
-- 7. ФУНКЦИИ (Functions)
-- ==========================================

-- 7.1 Получить баланс счета
CREATE OR REPLACE FUNCTION get_account_balance(account_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
  SELECT balance FROM view_account_balances WHERE id = account_uuid;
$$ LANGUAGE SQL;

-- 7.2 Получить общий капитал пользователя
CREATE OR REPLACE FUNCTION get_total_balance(user_uuid UUID, base_curr TEXT DEFAULT 'UZS')
RETURNS DECIMAL(12,2) AS $$
DECLARE
  total DECIMAL(12,2) := 0;
BEGIN
  SELECT COALESCE(SUM(balance), 0) INTO total
  FROM view_account_balances
  WHERE user_id = user_uuid AND currency = base_curr;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ГОТОВО! 🎉
-- ==========================================
