-- ОЧИСТКА ВСЕХ ДАННЫХ ИЗ БД
-- Выполни этот SQL в Supabase SQL Editor чтобы начать заново

-- ⚠️ ВНИМАНИЕ: Это удалит ВСЕ данные! Будь осторожен!

-- 1. Удаляем все транзакции
DELETE FROM transactions;

-- 2. Удаляем всех контрагентов
DELETE FROM counterparties;

-- 3. Удаляем все категории
DELETE FROM categories;

-- 4. Удаляем все счета
DELETE FROM accounts;

-- 5. Удаляем всех пользователей (из auth.users)
-- ВАЖНО: Это можно сделать только через Supabase Dashboard
-- Перейди: Authentication → Users → выбери пользователей → Delete users

-- Готово! Теперь можно регистрироваться заново! ✅
