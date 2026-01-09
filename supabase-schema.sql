-- ИСПРАВЛЕННАЯ СХЕМА С ПОДДЕРЖКОЙ ПРОФЕССИОНАЛЬНЫХ ФИЧ
-- Выполни этот SQL в Supabase SQL Editor

-- 1. УДАЛЯЕМ СТАРЫЕ ТАБЛИЦЫ
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS counterparties CASCADE;

-- 2. ТАБЛИЦА СЧЕТОВ
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'UZS',
  color TEXT DEFAULT '#2563eb',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ТАБЛИЦА КАТЕГОРИЙ
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ТАБЛИЦА КОНТРАГЕНТОВ (НОВОЕ! 🆕)
CREATE TABLE counterparties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('person', 'company', 'organization')) DEFAULT 'company',
  category TEXT,
  icon TEXT DEFAULT '👤',
  color TEXT DEFAULT '#6366f1',
  notes TEXT,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ТАБЛИЦА ТРАНЗАКЦИЙ (С ПОДДЕРЖКОЙ type И counterparty_id!)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  counterparty_id UUID REFERENCES counterparties(id) ON DELETE SET NULL,  -- 🆕 КТО
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer_in', 'transfer_out')), -- 🆕
  amount NUMERIC NOT NULL,
  comment TEXT,
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ИНДЕКСЫ ДЛЯ БЫСТРЫХ ЗАПРОСОВ
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_counterparties_user ON counterparties(user_id);
CREATE INDEX idx_counterparties_favorite ON counterparties(user_id, favorite) WHERE favorite = true;
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_counterparty ON transactions(counterparty_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, date DESC);

-- 7. БЕЗОПАСНОСТЬ (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 8. ПОЛИТИКИ ДОСТУПА
-- Accounts
CREATE POLICY "Accounts: view own" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Accounts: insert own" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Accounts: update own" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Accounts: delete own" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Categories: view own" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Categories: insert own" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Categories: delete own" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Counterparties (🆕)
CREATE POLICY "Counterparties: view own" ON counterparties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Counterparties: insert own" ON counterparties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Counterparties: update own" ON counterparties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Counterparties: delete own" ON counterparties FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Transactions: view own" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions: insert own" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Transactions: delete own" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- 9. ТРИГГЕР ДЛЯ АВТООБНОВЛЕНИЯ ВРЕМЕНИ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ГОТОВО! 🎉
-- Теперь у тебя профессиональная финансовая система с:
-- ✅ Счетами (где деньги)
-- ✅ Категориями (на что)
-- ✅ Контрагентами (от кого/кому) 🆕
-- ✅ Транзакциями с полным контролем
