import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react';

export default function Settings() {
  const store = useFinanceStore();
  const [newAcc, setNewAcc] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', icon: '📌' });
  const [editingAccount, setEditingAccount] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreateAccount = async () => {
    if (!newAcc.trim()) return alert('Введи название счета!');
    const result = await store.createAccount(newAcc);
    if (result?.success) {
      setNewAcc('');
    }
  };

  const handleDeleteAccount = async (accountId, accountName) => {
    const confirmed = confirm(`Удалить счет "${accountName}"? Все транзакции по этому счету останутся.`);
    if (confirmed) {
      await store.deleteAccount(accountId);
    }
  };

  const handleSaveEdit = async (accountId) => {
    if (!editName.trim()) return;
    const result = await store.updateAccount(accountId, { name: editName });
    if (result?.success) {
      setEditingAccount(null);
      setEditName('');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return alert('Введи название категории!');
    const result = await store.createCategory(newCategory.name, newCategory.type, newCategory.icon);
    if (result?.success) {
      setNewCategory({ name: '', type: 'expense', icon: '📌' });
    }
  };

  const handleSeedCategories = async () => {
    const result = await store.seedCategories();
    if (result?.success) {
      alert(result.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-black mb-8">⚙️ Управление</h1>

      {/* Блок Кошельков */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">💰 Мои Счета</h2>
        <div className="space-y-3 mb-4">
          {store.accounts.map(acc => (
            <div
              key={acc.id}
              className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              {editingAccount === acc.id ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-4 h-4 rounded-full" style={{ background: acc.color }} />
                  <input
                    type="text"
                    className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(acc.id)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingAccount(null);
                      setEditName('');
                    }}
                    className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ background: acc.color }} />
                    <div>
                      <span className="font-bold text-gray-900">{acc.name}</span>
                      <div className="text-sm text-gray-400">{acc.currency}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-gray-700 mr-4">
                      {new Intl.NumberFormat('uz-UZ').format(store.getAccountBalance(acc.id))} {acc.currency}
                    </div>
                    <button
                      onClick={() => {
                        setEditingAccount(acc.id);
                        setEditName(acc.name);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id, acc.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Название нового счета..."
            className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
            value={newAcc}
            onChange={e => setNewAcc(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleCreateAccount()}
          />
          <button
            onClick={handleCreateAccount}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold transition flex items-center gap-2"
          >
            <Plus size={20} />
            Создать
          </button>
        </div>
      </section>

      {/* Блок Категорий */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">🏷️ Категории</h2>

        {store.categories.length === 0 ? (
          <button
            onClick={handleSeedCategories}
            className="w-full py-4 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition"
          >
            📦 Загрузить стандартные категории
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {store.categories.map(cat => (
                <div
                  key={cat.id}
                  className={`bg-white p-3 rounded-xl border shadow-sm flex items-center gap-2 ${cat.type === 'income'
                      ? 'border-green-200 bg-green-50'
                      : cat.type === 'expense'
                        ? 'border-red-200 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <div className="text-xs text-gray-500">
                      {cat.type === 'income' ? 'Доход' : cat.type === 'expense' ? 'Расход' : 'Перевод'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Создание новой категории */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold mb-3">Создать новую категорию</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Иконка (emoji)"
                  className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl"
                  value={newCategory.icon}
                  onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="Название"
                  className="md:col-span-2 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <select
                  className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={newCategory.type}
                  onChange={e => setNewCategory({ ...newCategory, type: e.target.value })}
                >
                  <option value="income">Доход</option>
                  <option value="expense">Расход</option>
                </select>
              </div>
              <button
                onClick={handleCreateCategory}
                className="w-full mt-3 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Добавить категорию
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
