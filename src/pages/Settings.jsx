import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2, Plus, Save, Moon, Sun, Download, Upload, CreditCard, Tag, LogOut, User, Globe, Wallet, Shield } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/ui/Toast';
import * as XLSX from 'xlsx';

export default function Settings() {
  const store = useFinanceStore();
  const [activeTab, setActiveTab] = useState('general'); // general, accounts, categories, data
  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [currencyForm, setCurrencyForm] = useState(store.settings.currency_rates);

  // Account Form
  const [newAccName, setNewAccName] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState('UZS');

  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [newCatIcon, setNewCatIcon] = useState('📌');

  // --- HANDLERS ---
  const handleThemeToggle = () => {
    store.updateSettings({ ...store.settings, dark_mode: !store.settings.dark_mode });
  };

  const handleSaveRates = async () => {
    const success = await store.updateSettings({ currency_rates: currencyForm });
    if (success) {
      toast.success('Курсы валют обновлены');
      setIsEditRateModalOpen(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccName) return;
    await store.createAccount(newAccName, newAccCurrency);
    setNewAccName('');
  };

  const handleCreateCategory = async () => {
    if (!newCatName) return;
    await store.createCategory(newCatName, newCatType, newCatIcon);
    setNewCatName('');
  };

  const handleExportData = () => {
    const wb = XLSX.utils.book_new();

    const txWs = XLSX.utils.json_to_sheet(store.transactions);
    XLSX.utils.book_append_sheet(wb, txWs, "Transactions");

    const accWs = XLSX.utils.json_to_sheet(store.accounts);
    XLSX.utils.book_append_sheet(wb, accWs, "Accounts");

    XLSX.writeFile(wb, `Finance_Empire_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Данные экспортированы Excel');
  };

  const tabs = [
    { id: 'general', label: 'Общие', icon: User },
    { id: 'accounts', label: 'Счета', icon: Wallet },
    { id: 'categories', label: 'Категории', icon: Tag },
    { id: 'data', label: 'Данные', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white px-1">Настройки</h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* === GENERAL TAB === */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Profile Card */}
              <GlassCard className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {store.user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{store.user?.email}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">Pro Plan</p>
                </div>
                <Button variant="outline" size="sm" onClick={store.logout} icon={LogOut}>Выйти</Button>
              </GlassCard>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Appearance */}
                <GlassCard className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                      {store.settings.dark_mode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">Тема оформления</div>
                      <div className="text-xs text-gray-500">{store.settings.dark_mode ? 'Тёмная' : 'Светлая'}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${store.settings.dark_mode ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${store.settings.dark_mode ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </GlassCard>

                {/* Currency */}
                <GlassCard className="flex justify-between items-center cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setIsEditRateModalOpen(true)}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                      <Globe size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">Курс валют</div>
                      <div className="text-xs text-gray-500">1 USD = {store.settings.currency_rates['USD']} UZS</div>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    <Save size={16} className="text-gray-500" />
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* === ACCOUNTS TAB === */}
          {activeTab === 'accounts' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {store.accounts.map(acc => (
                  <GlassCard key={acc.id} className="flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: acc.color + '20', color: acc.color }}>
                        {acc.icon || '💳'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{acc.name}</div>
                        <div className="text-xs text-gray-400 font-bold">{acc.currency} • {new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(acc.id))}</div>
                      </div>
                    </div>
                    <button onClick={() => store.deleteAccount(acc.id)} className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </GlassCard>
                ))}
              </div>

              <GlassCard className="h-fit sticky top-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} /> Создать счет</h3>
                <div className="space-y-4">
                  <input
                    className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none border focus:border-blue-500 dark:border-gray-600 hover:border-gray-300 transition-colors"
                    placeholder="Название счета"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                  />
                  <select
                    className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-bold outline-none border dark:border-gray-600"
                    value={newAccCurrency}
                    onChange={e => setNewAccCurrency(e.target.value)}
                  >
                    <option value="UZS">UZS (Узбекский сум)</option>
                    <option value="USD">USD (Доллар США)</option>
                    <option value="EUR">EUR (Евро)</option>
                    <option value="RUB">RUB (Рубль)</option>
                  </select>
                  <Button onClick={handleCreateAccount} className="w-full py-4">Создать счет</Button>
                </div>
              </GlassCard>
            </div>
          )}

          {/* === CATEGORIES TAB === */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Income Categories */}
                <div>
                  <h3 className="font-bold text-emerald-500 mb-3 flex items-center gap-2">Доходы</h3>
                  <div className="space-y-2">
                    {store.categories.filter(c => c.type === 'income').map(c => (
                      <div key={c.id} className="bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <span className="text-xl">{c.icon}</span>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Expense Categories */}
                <div>
                  <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2">Расходы</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {store.categories.filter(c => c.type === 'expense').map(c => (
                      <div key={c.id} className="bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <span className="text-xl">{c.icon}</span>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200 truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <GlassCard className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-none">
                <h3 className="font-bold mb-4">Новая категория</h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <select className="p-3 rounded-xl bg-white dark:bg-gray-700 border dark:border-gray-600 font-bold outline-none" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)}>
                    <option value="📌">📌</option>
                    <option value="🛒">🛒</option>
                    <option value="🍽️">🍽️</option>
                    <option value="🏠">🏠</option>
                    <option value="🚗">🚗</option>
                    <option value="💊">💊</option>
                    <option value="📚">📚</option>
                    <option value="🎮">🎮</option>
                    <option value="✈️">✈️</option>
                  </select>
                  <input
                    className="flex-1 p-3 rounded-xl bg-white dark:bg-gray-700 border dark:border-gray-600 font-bold outline-none"
                    placeholder="Название"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                  />
                  <select className="p-3 rounded-xl bg-white dark:bg-gray-700 border dark:border-gray-600 font-bold outline-none" value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                    <option value="expense">Расход</option>
                    <option value="income">Доход</option>
                  </select>
                  <Button onClick={handleCreateCategory} icon={Plus}>Добавить</Button>
                </div>
              </GlassCard>
            </div>
          )}

          {/* === DATA & SECURITY TAB === */}
          {activeTab === 'data' && (
            <div className="grid md:grid-cols-2 gap-6">
              <GlassCard>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Download size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">Экспорт данных</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Скачайте все свои транзакции и счета в формате Excel (.xlsx). Удобно для создания бэкапов.
                </p>
                <Button onClick={handleExportData} variant="secondary" className="w-full">Скачать Excel</Button>
              </GlassCard>

              <GlassCard opacity="opacity-50">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Upload size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">Импорт</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Функция восстановления данных из резервной копии находится в разработке.
                </p>
                <Button disabled variant="outline" className="w-full">Скоро</Button>
              </GlassCard>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* RATE MODAL */}
      <Modal isOpen={isEditRateModalOpen} onClose={() => setIsEditRateModalOpen(false)} title="Курс валют">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-300 text-sm font-medium mb-4">
            Базовая валюта: <span className="font-bold">UZS</span>. Укажите, сколько сумов стоит 1 единица иностранной валюты.
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 font-bold text-gray-500">USD</div>
              <input
                type="number"
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl font-bold outline-none"
                value={currencyForm['USD']}
                onChange={e => setCurrencyForm({ ...currencyForm, 'USD': Number(e.target.value) })}
              />
              <div className="text-sm font-bold text-gray-400">UZS</div>
            </div>
            {/* Add more currencies if needed */}
          </div>

          <Button onClick={handleSaveRates} className="w-full py-4 mt-4">Сохранить курсы</Button>
        </div>
      </Modal>

    </div>
  );
}