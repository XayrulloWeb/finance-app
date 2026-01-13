import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ChartPie, History, Handshake, Target, Receipt, Calendar, Bell, Users, Settings, Wallet, LogOut, Menu, X, Plus } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import { toast } from './ui/Toast';
import InstallPwa from './ui/InstallPwa';
import Modal from './ui/Modal';
import Button from './ui/Button';
import AccountModal from './modals/AccountModal';
import TransactionModal from './modals/TransactionModal';
import TransferModal from './modals/TransferModal';
import { ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';

export default function Layout() {
  const user = useFinanceStore(s => s.user);
  const logout = useFinanceStore(s => s.logout);
  const unreadNotifications = useFinanceStore(s => s.unreadNotifications);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false); // <-- NEW

  // Global Modals State
  const activeModal = useFinanceStore(s => s.activeModal);
  const modalProps = useFinanceStore(s => s.modalProps);
  const closeModal = useFinanceStore(s => s.closeModal);
  const openModal = useFinanceStore(s => s.openModal);

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из системы');
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Главная" },
    { to: "/analytics", icon: ChartPie, label: "Аналитика" },
    { to: "/history", icon: History, label: "История" },
    { to: "/debts", icon: Handshake, label: "Долги" },
    { to: "/goals", icon: Target, label: "Цели" },
    { to: "/recurring", icon: Receipt, label: "Подписки" },
    { to: "/calendar", icon: Calendar, label: "Календарь" },
    { to: "/notifications", icon: Bell, label: "Уведомления" },
    { to: "/counterparties", icon: Users, label: "Люди" },
    { to: "/settings", icon: Settings, label: "Настройки" },
  ];

  const mobileLinkClass = ({ isActive }) =>
    `relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
    ${isActive
      ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-500/40 scale-110'
      : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
    } `;

  return (
    <div className="flex h-screen overflow-hidden text-zinc-900 font-sans" style={{
      background: '#f8fafc',
      backgroundImage: `
        radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 25%)
      `
    }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 h-full z-30" style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.4)'
      }}>
        <div className="flex items-center gap-3 px-8 py-8">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/30">
            <Wallet className="text-white" size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 leading-none tracking-tight">Finance</h1>
            <span className="text-[10px] font-bold text-indigo-600 tracking-[0.2em] uppercase">Empire</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-4 mx-2 rounded-2xl transition-all duration-300 font-bold group
               ${isActive
                ? 'bg-white shadow-xl shadow-indigo-500/10 text-indigo-600 translate-x-2'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50 hover:pl-8'
              } `
            }>
              <item.icon size={22} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold tracking-wide">{item.label}</span>
              {item.to === '/notifications' && unreadNotifications > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-rose-500/30">{unreadNotifications}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 font-bold transition-all"
          >
            <LogOut size={20} strokeWidth={2.5} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto scroll-smooth custom-scrollbar relative">
        <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-8 pb-32">
          <Outlet />
        </div>
      </main>

      {/* --- MASTERPIECE MOBILE NAVIGATION (Floating Dock) --- */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 flex justify-center pb-safe">
        <nav className="flex items-center gap-1 p-2 rounded-[2rem] bg-white/90 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-indigo-900/10 ring-1 ring-black/5">

          <NavLink to="/" className={mobileLinkClass}><LayoutDashboard size={22} strokeWidth={2.5} /></NavLink>
          <NavLink to="/analytics" className={mobileLinkClass}><ChartPie size={22} strokeWidth={2.5} /></NavLink>

          {/* CENTRAL ACTION BUTTON */}
          <div className="mx-2 -mt-8 relative">
            <AnimatePresence>
              {isActionMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 10 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-3 mb-2 items-center"
                >
                  <button onClick={() => { openModal('transaction', { initialType: 'income' }); setIsActionMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30 whitespace-nowrap active:scale-95 transition-transform">
                    <TrendingUp size={20} /> <span className="font-bold">Доход</span>
                  </button>
                  <button onClick={() => { openModal('transaction', { initialType: 'expense' }); setIsActionMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/30 whitespace-nowrap active:scale-95 transition-transform">
                    <TrendingDown size={20} /> <span className="font-bold">Расход</span>
                  </button>
                  <button onClick={() => { openModal('transfer'); setIsActionMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-800/30 whitespace-nowrap active:scale-95 transition-transform">
                    <ArrowRightLeft size={20} /> <span className="font-bold">Перевод</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={`flex items-center justify-center w-16 h-16 rounded-[1.5rem] text-white shadow-2xl shadow-indigo-500/50 transform active:scale-95 transition-all duration-300 border-[3px] border-white/80 ${isActionMenuOpen ? 'rotate-45 bg-zinc-900' : 'rotate-0'}`}
              style={{
                background: isActionMenuOpen ? '#18181b' : 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
              }}
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          <NavLink to="/history" className={mobileLinkClass}><History size={22} strokeWidth={2.5} /></NavLink>
          <button onClick={() => setIsMobileMenuOpen(true)} className={mobileLinkClass({})}>
            <Menu size={22} strokeWidth={2.5} />
          </button>
        </nav>
      </div>

      {/* --- MASTERPIECE DATA OVERLAY (Mobile Menu) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[60] lg:hidden bg-[#f8fafc]/95 backdrop-blur-3xl flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 mt-safe">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                  <span className="font-black text-lg">{user?.email?.[0].toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900 leading-none">Меню</h2>
                  <p className="text-xs text-zinc-500 font-bold mt-1">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-12 h-12 rounded-full bg-white shadow-lg shadow-zinc-200/50 flex items-center justify-center text-zinc-900 border border-zinc-100 active:scale-90 transition-transform"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            {/* Grid Links */}
            <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all duration-300 border h-32
                       ${isActive
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/30'
                        : 'bg-white text-zinc-500 border-zinc-100 shadow-sm hover:shadow-md'
                      }`
                    }
                  >
                    <item.icon size={32} strokeWidth={2} className="mb-1" />
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                  </NavLink>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-6 mb-8 flex items-center justify-center gap-3 p-5 rounded-3xl bg-rose-50 text-rose-600 font-black border border-rose-100 shadow-lg shadow-rose-500/10 active:scale-95 transition-all"
              >
                <LogOut size={24} strokeWidth={2.5} />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <InstallPwa />

      {/* GLOBAL MODALS */}
      <AccountModal
        isOpen={activeModal === 'account'}
        onClose={closeModal}
      />
      <TransactionModal
        isOpen={activeModal === 'transaction'}
        onClose={closeModal}
        {...modalProps}
      />
      <TransferModal
        isOpen={activeModal === 'transfer'}
        onClose={closeModal}
      />
    </div>
  );
}