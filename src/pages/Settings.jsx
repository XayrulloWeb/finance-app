import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2, Plus, LogOut, User, Wallet, Tag, Shield, Download, Upload, Globe, ChevronRight, Zap, RefreshCw } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/ui/Toast';

// Imported Modals
import AccountModal from '../components/modals/AccountModal';
import ImportModal from '../components/modals/ImportModal';

export default function Settings() {
  const store = useFinanceStore();

  // Tabs State
  const [activeTab, setActiveTab] = useState('general'); // general, accounts, categories, data

  // Modals State
  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Forms State
  const [currencyForm, setCurrencyForm] = useState(store.settings.currency_rates);

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

  const handleCreateCategory = async () => {
    if (!newCatName) return toast.error('Введите название категории');
    await store.createCategory(newCatName, newCatType, newCatIcon);
    setNewCatName('');
    toast.success('Категория создана');
  };

  const handleRestoreCategories = async () => {
    if (!confirm('Это действие добавит стандартные категории. Продолжить?')) return;

    const defaultCategories = [
      { name: 'Зарплата', type: 'income', icon: '💰', color: '#10b981' },
      { name: 'Фриланс', type: 'income', icon: '💻', color: '#3b82f6' },
      { name: 'Продукты', type: 'expense', icon: '🛒', color: '#ef4444' },
      { name: 'Транспорт', type: 'expense', icon: '🚕', color: '#f59e0b' },
      { name: 'Кафе', type: 'expense', icon: '☕', color: '#8b5cf6' },
      { name: 'Дом', type: 'expense', icon: '🏠', color: '#0ea5e9' },
      { name: 'Связь', type: 'expense', icon: '📱', color: '#3b82f6' },
      { name: 'Перевод', type: 'transfer', icon: '🔄', color: '#64748b' }
    ];

    for (const cat of defaultCategories) {
      await store.createCategory(cat.name, cat.type, cat.icon, cat.color);
    }
    toast.success('Базовые категории восстановлены');
  };

  const tabs = [
    { id: 'general', label: 'Общие', icon: User },
    { id: 'accounts', label: 'Счета', icon: Wallet },
    { id: 'categories', label: 'Категории', icon: Tag },
    { id: 'data', label: 'Данные', icon: Shield },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-32 custom-scrollbar max-w-5xl mx-auto">

      {/* --- HEADER PROFILE SECTION --- */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 shadow-2xl shadow-indigo-900/20 text-white p-8 lg:p-12 mb-8">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-40 mix-blend-overlay" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="relative group">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full p-1 bg-white/20 backdrop-blur-md shadow-inner">
              <div className="w-full h-full rounded-full bg-white text-indigo-600 flex items-center justify-center text-3xl lg:text-5xl font-black shadow-lg">
                {store.user?.email?.[0].toUpperCase()}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-400 w-6 h-6 lg:w-8 lg:h-8 rounded-full border-4 border-indigo-600 flex items-center justify-center shadow-lg">
              <Zap size={14} className="text-white fill-white" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Premium Member
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight">{store.user?.email?.split('@')[0]}</h1>
            <p className="text-indigo-100 font-medium text-lg">{store.user?.email}</p>
          </div>
          <button
            onClick={store.logout}
            className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md font-bold transition-all active:scale-95 flex items-center gap-2"
          >
            <LogOut size={20} />
            <span>Выйти</span>
          </button>
        </div>
      </section>

      {/* --- ANIMATED TABS --- */}
      <div className="relative p-1 bg-white rounded-2xl border border-zinc-100 shadow-sm flex overflow-x-auto custom-scrollbar mb-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-colors whitespace-nowrap outline-none ${isActive ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >

          {/* === 1. GENERAL TAB === */}
          {activeTab === 'general' && (
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div className="group cursor-pointer" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <GlassCard className="h-full border-t-4 border-t-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Globe size={28} strokeWidth={2} />
                    </div>
                    <button onClick={() => setIsEditRateModalOpen(true)} className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      Изменить
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 mb-1">Валюты</h3>
                  <p className="text-zinc-500 font-medium mb-4">Автоматическая конвертация</p>

                  <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-400">USD</span>
                      <span className="text-zinc-900">{new Intl.NumberFormat('ru-RU').format(store.settings.currency_rates['USD'])} UZS</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-3/4" />
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-400">EUR</span>
                      <span className="text-zinc-900">{new Intl.NumberFormat('ru-RU').format(store.settings.currency_rates['EUR'])} UZS</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <GlassCard className="h-full border-t-4 border-t-emerald-500 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                        <Shield size={28} strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 mb-1">Безопасность</h3>
                    <p className="text-zinc-500 font-medium mb-4">Управление доступом</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer border border-transparent hover:border-zinc-100 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-zinc-700">Email подтвержден</span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400 font-bold px-3">
                    Версия приложения 2.4.0 (Build 890)
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}

          {/* === 2. ACCOUNTS TAB === */}
          {activeTab === 'accounts' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-xl text-zinc-900">Мои счета</h3>
                  <span className="text-xs font-bold bg-zinc-100 text-zinc-500 py-1 px-3 rounded-full">{store.accounts.length} ACTIVE</span>
                </div>
                {store.accounts.map((acc, index) => (
                  <motion.div
                    key={acc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <GlassCard className="relative flex justify-between items-center group-hover:translate-x-2 transition-transform duration-300 border-zinc-100 group-hover:border-indigo-200">
                      <div className="flex items-center gap-5">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-gray-200/50"
                          style={{ backgroundColor: acc.color, color: '#fff' }}
                        >
                          {acc.icon || '💳'}
                        </div>
                        <div>
                          <div className="font-black text-lg text-zinc-900 mb-1">{acc.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md uppercase tracking-wider">{acc.currency}</span>
                            <span className="text-sm font-bold text-zinc-600">{new Intl.NumberFormat('ru-RU').format(store.getAccountBalance(acc.id))}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => confirm('Удалить счет? Это необратимо.') && store.deleteAccount(acc.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} strokeWidth={2} />
                      </button>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Add Account Card */}
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <GlassCard className="h-full min-h-[300px] flex flex-col items-center justify-center text-center gap-6 border-2 border-dashed border-zinc-200 shadow-none hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group cursor-pointer group" onClick={() => setIsAccountModalOpen(true)}>
                  <div className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                    <Wallet size={40} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-2xl text-zinc-900 group-hover:text-indigo-600 transition-colors">Новый счет</h3>
                    <p className="text-zinc-500 font-medium max-w-[200px] mx-auto">Добавьте карту, наличные или банковский вклад</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 group-hover:rotate-90 transition-transform duration-500">
                    <Plus size={24} strokeWidth={3} />
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}

          {/* === 3. CATEGORIES TAB === */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="bg-gradient-to-r from-violet-500 to-indigo-600 border-none text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6">
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1 block">Иконка</label>
                        <input className="w-full h-14 text-center text-2xl rounded-2xl bg-white/10 border border-white/20 font-bold outline-none text-white placeholder-white/50 focus:bg-white/20 transition-all" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder="✨" maxLength={2} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1 block">Название</label>
                        <input className="w-full h-14 px-4 rounded-2xl bg-white/10 border border-white/20 font-bold outline-none text-white placeholder-white/50 focus:bg-white/20 transition-all" placeholder="Название..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1 block">Тип</label>
                        <select className="w-full h-14 px-4 rounded-2xl bg-white/10 border border-white/20 font-bold outline-none text-white focus:bg-white/20 transition-all appearance-none cursor-pointer" value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                          <option className="text-zinc-900" value="expense">Расход</option>
                          <option className="text-zinc-900" value="income">Доход</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleCreateCategory} className="w-full lg:w-auto h-14 px-8 rounded-2xl bg-white text-indigo-600 font-black shadow-xl shadow-indigo-900/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                      Добавить
                    </button>
                  </div>
                </GlassCard>
              </motion.div>

              <div className="flex justify-between items-center px-2">
                <h3 className="font-black text-xl text-zinc-900 flex items-center gap-2">Все категории <span className="bg-zinc-100 text-zinc-500 text-xs px-2 py-1 rounded-md">{store.categories.length}</span></h3>
                <div className="flex gap-4">
                  <button onClick={handleRestoreCategories} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"><RefreshCw size={14} /> Восстановить</button>
                  <button onClick={() => confirm('Удалить ВСЕ категории?') && store.deleteAllCategories()} className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"><Trash2 size={14} /> Очистить</button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* INCOME COLUMN */}
                <div className="space-y-3">
                  <div className="sticky top-0 bg-[#f8fafc]/95 backdrop-blur-sm z-10 py-2 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-zinc-500 uppercase tracking-wider text-xs">Доходы</h4>
                  </div>
                  {store.categories.filter(c => c.type === 'income').map(c => (
                    <div key={c.id} className="group bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">{c.icon}</div>
                        <span className="font-bold text-zinc-700">{c.name}</span>
                      </div>
                      <button onClick={() => store.deleteCategory(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* EXPENSE COLUMN */}
                <div className="space-y-3">
                  <div className="sticky top-0 bg-[#f8fafc]/95 backdrop-blur-sm z-10 py-2 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <h4 className="font-bold text-zinc-500 uppercase tracking-wider text-xs">Расходы</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {store.categories.filter(c => c.type === 'expense').map(c => (
                      <div key={c.id} className="group bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 flex items-center justify-center text-xl">{c.icon}</div>
                          <span className="font-bold text-zinc-700 text-sm truncate">{c.name}</span>
                        </div>
                        <button onClick={() => store.deleteCategory(c.id)} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === 4. DATA TAB === */}
          {activeTab === 'data' && (
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group">
                <div className="h-full bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <Download size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black mb-2">Экспорт</h3>
                        <p className="text-indigo-200 font-medium">Сохраните полную историю операций и состояние счетов в Excel формате.</p>
                      </div>
                    </div>
                    <button onClick={() => store.exportDataToExcel()} className="mt-8 py-4 px-6 bg-white text-indigo-900 rounded-xl font-black text-lg flex items-center justify-between group-hover:scale-105 transition-transform">
                      <span>Скачать .xlsx</span>
                      <ChevronRight />
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="group">
                <div className="h-full bg-white rounded-[2rem] p-8 relative overflow-hidden shadow-xl border border-zinc-100">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900">
                        <Upload size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-zinc-900 mb-2">Импорт</h3>
                        <p className="text-zinc-500 font-medium">Восстановите данные из резервной копии или перенесите их с другого устройства.</p>
                      </div>
                    </div>
                    <button onClick={() => setIsImportModalOpen(true)} className="mt-8 py-4 px-6 bg-zinc-900 text-white rounded-xl font-black text-lg flex items-center justify-between group-hover:scale-105 transition-transform">
                      <span>Загрузить файл</span>
                      <ChevronRight />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* --- MODALS --- */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <Modal isOpen={isEditRateModalOpen} onClose={() => setIsEditRateModalOpen(false)} title="Курс валют">
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600 text-sm font-medium mb-4 border border-indigo-100">
            Базовая валюта: <span className="font-bold">UZS</span>. Укажите стоимость 1 единицы ин. валюты в сумах.
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