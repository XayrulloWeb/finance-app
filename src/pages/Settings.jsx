import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2, Plus, Save, Moon, Sun, Download, Upload, CreditCard, Tag, LogOut, User, Globe, Wallet, Shield } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/ui/Toast';


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



  const tabs = [
    { id: 'general', label: 'Общие', icon: User },
    { id: 'accounts', label: 'Счета', icon: Wallet },
    { id: 'categories', label: 'Категории', icon: Tag },
    { id: 'data', label: 'Данные', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-24 custom-scrollbar">
      <h1 className="text-3xl font-black text-zinc-900 px-1">Настройки</h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-200'
              }`}
          >
            <tab.icon size={18} strokeWidth={2.5} />
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {store.user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-zinc-900">{store.user?.email}</h3>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Pro Plan</p>
                </div>
                <Button variant="outline" size="sm" onClick={store.logout} icon={LogOut}>Выйти</Button>
              </GlassCard>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Appearance - REMOVED DARK MODE TOGGLE AS PER PLATINUM THEME */}
                {/* Currency */}
                <GlassCard className="flex justify-between items-center cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setIsEditRateModalOpen(true)}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Globe size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900">Курс валют</div>
                      <div className="text-xs text-zinc-500">1 USD = {store.settings.currency_rates['USD']} UZS</div>
                    </div>
                  </div>
                  <div className="bg-zinc-100 p-2 rounded-lg">
                    <Save size={16} className="text-zinc-400" strokeWidth={2.5} />
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
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border border-zinc-100" style={{ backgroundColor: acc.color + '20', color: acc.color }}>
                        {acc.icon || '💳'}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{acc.name}</div>
                        <div className="text-xs text-zinc-400 font-bold">{acc.currency} • {new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(acc.id))}</div>
                      </div>
                    </div>
                    <button onClick={() => store.deleteAccount(acc.id)} className="p-2 hover:bg-rose-50 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors">
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </GlassCard>
                ))}
              </div>

              <GlassCard className="h-fit sticky top-6">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-zinc-900"><Plus size={18} strokeWidth={2.5} /> Создать счет</h3>
                <div className="space-y-4">
                  <input
                    className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 focus:border-indigo-500 shadow-sm transition-colors"
                    placeholder="Название счета"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                  />
                  <select
                    className="w-full p-4 bg-white border border-zinc-200 rounded-xl font-bold outline-none text-zinc-900 shadow-sm"
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
              <GlassCard className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100">
                <h3 className="font-bold mb-4 text-zinc-900 text-lg">➕ Создать новую категорию</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Icon Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide">Иконка</label>
                    <input
                      className="w-full p-3 text-center text-2xl rounded-xl bg-white border-2 border-zinc-200 font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500 transition-colors"
                      value={newCatIcon}
                      onChange={e => setNewCatIcon(e.target.value)}
                      placeholder="😊"
                      maxLength={2}
                    />
                    <p className="text-[10px] text-zinc-400 text-center">Любой эмодзи</p>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide">Название</label>
                    <input
                      className="w-full p-3 rounded-xl bg-white border-2 border-zinc-200 font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500 transition-colors"
                      placeholder="Например: Кофе, Сестре, Такси..."
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                  </div>

                  {/* Type Select */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide">Тип</label>
                    <select
                      className="w-full p-3 rounded-xl bg-white border-2 border-zinc-200 font-bold outline-none text-zinc-900 shadow-sm focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                      value={newCatType}
                      onChange={e => setNewCatType(e.target.value)}
                    >
                      <option value="expense">💸 Расход</option>
                      <option value="income">💰 Доход</option>
                    </select>
                  </div>
                </div>

                {/* Add Button */}
                <div className="mt-4 pt-4 border-t border-indigo-200/50">
                  <Button
                    onClick={handleCreateCategory}
                    icon={Plus}
                    className="w-full py-3 text-base font-bold"
                  >
                    Добавить категорию
                  </Button>
                </div>
              </GlassCard>

              <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-indigo-900">Сброс категорий</h4>
                  <p className="text-sm text-indigo-700">Управление списком категорий</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => confirm('Удалить ВСЕ категории? Это действие необратимо.') && store.deleteAllCategories()}
                    className="bg-rose-100 text-rose-600 hover:bg-rose-200 hover:text-rose-700"
                    icon={Trash2}
                  >
                    Удалить все
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!confirm('Это добавит стандартные категории. Продолжить?')) return;
                      const defaultCategories = [
                        { name: 'Зарплата', type: 'income', icon: '💰', color: '#10b981' },
                        { name: 'Фриланс', type: 'income', icon: '💻', color: '#3b82f6' },
                        { name: 'Подарки', type: 'income', icon: '🎁', color: '#ec4899' },
                        { name: 'Инвестиции', type: 'income', icon: '📈', color: '#8b5cf6' },
                        { name: 'Кэшбэк', type: 'income', icon: '💸', color: '#f59e0b' },
                        { name: 'Продукты', type: 'expense', icon: '🛒', color: '#ef4444' },
                        { name: 'Транспорт', type: 'expense', icon: '🚕', color: '#f59e0b' },
                        { name: 'Аренда/Ипотека', type: 'expense', icon: '🏠', color: '#0ea5e9' },
                        { name: 'Коммуналка', type: 'expense', icon: '💡', color: '#6366f1' },
                        { name: 'Связь и Интернет', type: 'expense', icon: '📱', color: '#3b82f6' },
                        { name: 'Кафе и Рестораны', type: 'expense', icon: '☕', color: '#8b5cf6' },
                        { name: 'Досуг и Кино', type: 'expense', icon: '🎬', color: '#ec4899' },
                        { name: 'Шоппинг', type: 'expense', icon: '🛍️', color: '#a855f7' },
                        { name: 'Уход и Косметика', type: 'expense', icon: '💅', color: '#db2777' },
                        { name: 'Здоровье', type: 'expense', icon: '💊', color: '#14b8a6' },
                        { name: 'Спорт', type: 'expense', icon: '💪', color: '#f97316' },
                        { name: 'Образование', type: 'expense', icon: '📚', color: '#6366f1' },
                        { name: 'Путешествия', type: 'expense', icon: '✈️', color: '#06b6d4' },
                        { name: 'Машина', type: 'expense', icon: '🚗', color: '#e11d48' },
                        { name: 'Дети', type: 'expense', icon: '👶', color: '#fbbf24' },
                        { name: 'Питомцы', type: 'expense', icon: '🐾', color: '#78350f' },
                        { name: 'Благотворительность', type: 'expense', icon: '🙏', color: '#10b981' },
                        { name: 'Техника', type: 'expense', icon: '💻', color: '#64748b' },
                        { name: 'Перевод', type: 'transfer', icon: '🔄', color: '#64748b' }
                      ];

                      for (const cat of defaultCategories) {
                        await store.createCategory(cat.name, cat.type, cat.icon);
                      }
                      toast.success('Категории восстановлены!');
                    }}
                    className="bg-indigo-600/10 text-indigo-700 hover:bg-indigo-600 hover:text-white"
                  >
                    Восстановить
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 pb-6">
                {/* Income Categories */}
                <div>
                  <h3 className="font-bold text-emerald-600 mb-3 flex items-center gap-2 sticky top-0 bg-white/80 backdrop-blur-sm p-2 rounded-lg z-10">Доходы</h3>
                  <div className="space-y-2">
                    {store.categories.filter(c => c.type === 'income').map(c => (
                      <div key={c.id} className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{c.icon}</span>
                          <span className="font-bold text-sm text-zinc-900">{c.name}</span>
                        </div>
                        <button
                          onClick={() => confirm('Удалить категорию?') && store.deleteCategory(c.id)}
                          className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Expense Categories */}
                <div>
                  <h3 className="font-bold text-rose-500 mb-3 flex items-center gap-2 sticky top-0 bg-white/80 backdrop-blur-sm p-2 rounded-lg z-10">Расходы</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {store.categories.filter(c => c.type === 'expense').map(c => (
                      <div key={c.id} className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{c.icon}</span>
                          <span className="font-bold text-sm text-zinc-900 truncate">{c.name}</span>
                        </div>
                        <button
                          onClick={() => confirm('Удалить категорию?') && store.deleteCategory(c.id)}
                          className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* === DATA & SECURITY TAB === */}
          {activeTab === 'data' && (
            <div className="grid md:grid-cols-2 gap-6">
              <GlassCard>
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Download size={24} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-zinc-900">Экспорт данных</h3>
                <p className="text-sm text-zinc-500 mb-6">
                  Скачайте все свои транзакции и счета в формате Excel (.xlsx). Удобно для создания бэкапов.
                </p>
                <Button onClick={() => store.exportDataToExcel()} variant="secondary" className="w-full">Скачать Excel</Button>
              </GlassCard>

              <GlassCard opacity="opacity-50">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Upload size={24} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-zinc-900">Импорт</h3>
                <p className="text-sm text-zinc-500 mb-6">
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
          <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600 text-sm font-medium mb-4 border border-indigo-100">
            Базовая валюта: <span className="font-bold">UZS</span>. Укажите, сколько сумов стоит 1 единица иностранной валюты.
          </div>

          <div className="space-y-3">
            {[
              { code: 'USD', name: 'Доллар США ($)' },
              { code: 'EUR', name: 'Евро (€)' },
              { code: 'RUB', name: 'Рубль (₽)' }
            ].map((currency) => (
              <div key={currency.code} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                <div className="w-12 font-bold text-zinc-400">{currency.code}</div>
                <input
                  type="number"
                  placeholder="0"
                  className="flex-1 p-2 bg-white border border-zinc-200 rounded-lg font-bold outline-none text-zinc-900 focus:border-indigo-500 text-right tabular-nums"
                  value={currencyForm[currency.code] || ''}
                  onChange={e => setCurrencyForm({ ...currencyForm, [currency.code]: Number(e.target.value) })}
                />
                <div className="text-sm font-bold text-zinc-400 w-8">UZS</div>
              </div>
            ))}
          </div>

          <Button onClick={handleSaveRates} className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Сохранить курсы</Button>
        </div>
      </Modal>

    </div>
  );
}