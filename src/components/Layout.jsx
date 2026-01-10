import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChartPie, Settings, Wallet, Handshake, Users, LogOut, Receipt, History, Calendar, Bell, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import { toast } from './ui/Toast';
import InstallPwa from './ui/InstallPwa';

export default function Layout() {
  const { user, logout, unreadNotifications } = useFinanceStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из системы');
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Дашборд" },
    { to: "/analytics", icon: ChartPie, label: "Аналитика" },
    { to: "/history", icon: History, label: "История" },
    { to: "/debts", icon: Handshake, label: "Долги" },
    { to: "/recurring", icon: Receipt, label: "Подписки" },
    { to: "/calendar", icon: Calendar, label: "Календарь" },
    { to: "/notifications", icon: Bell, label: "Уведомления" },
    { to: "/counterparties", icon: Users, label: "Люди" },
    { to: "/settings", icon: Settings, label: "Настройки" },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 font-bold tracking-wide
    ${isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1'
      : 'text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-md hover:shadow-black/5 hover:translate-x-1'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300
    ${isActive
      ? 'text-indigo-600 -translate-y-2'
      : 'text-zinc-400'
    }`;

  return (
    <div className="flex min-h-screen text-zinc-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 sidebar p-6 fixed h-full z-30 shadow-2xl border-r border-white/50">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Wallet className="text-white" size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 leading-none mb-0">Finance</h1>
            <span className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] uppercase">Empire</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <div className="relative">
                <item.icon size={20} strokeWidth={2.5} />
                {item.to === '/notifications' && unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full animate-pulse" />
                )}
              </div>
              <span className="font-bold">{item.label}</span>
              {item.to === '/notifications' && unreadNotifications > 0 && (
                <span className="ml-auto bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{unreadNotifications}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 mt-auto border-t border-zinc-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/50 mb-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-zinc-900 truncate">{user?.email}</div>
              <div className="text-xs text-zinc-500">Pro Plan</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-50 font-bold transition-all"
          >
            <LogOut size={20} strokeWidth={2.5} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pb-24 lg:pb-8 p-4 lg:p-8 max-w-[1600px] mx-auto w-full transition-all">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-around p-2 pb-safe z-50 transition-colors duration-300 safe-area-pb">
        <NavLink to="/" className={mobileLinkClass}><LayoutDashboard size={24} strokeWidth={2.5} /></NavLink>
        <NavLink to="/analytics" className={mobileLinkClass}><ChartPie size={24} strokeWidth={2.5} /></NavLink>
        <div className="relative -mt-8">
          <NavLink to="/add" onClick={(e) => { e.preventDefault(); /* Open Modal */ }} className="flex bg-primary text-white p-4 rounded-full shadow-xl shadow-primary/40 transform active:scale-90 transition-transform">
            <Wallet size={24} strokeWidth={2.5} />
          </NavLink>
        </div>
        <NavLink to="/history" className={mobileLinkClass}><History size={24} strokeWidth={2.5} /></NavLink>


        <button onClick={() => setIsMobileMenuOpen(true)} className={mobileLinkClass({})}>
          <Menu size={24} strokeWidth={2.5} />
        </button>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-white/90 backdrop-blur-xl border-l border-white/50 shadow-2xl z-[70] p-6 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-black text-zinc-900">Меню</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-zinc-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-zinc-500 hover:bg-zinc-50'
                      }`
                    }
                  >
                    <item.icon size={22} strokeWidth={2.5} />
                    <span className="font-bold text-lg">{item.label}</span>
                    {item.to === '/notifications' && unreadNotifications > 0 && (
                      <span className="ml-auto bg-error text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadNotifications}</span>
                    )}
                  </NavLink>
                ))}
              </div>

              <div className="pt-6 border-t border-zinc-200 mt-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-zinc-900 truncate">{user?.email}</div>
                    <div className="text-xs text-zinc-500">Pro Plan</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-50 font-bold transition-all"
                >
                  <LogOut size={22} strokeWidth={2.5} />
                  <span>Выйти</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <InstallPwa />
    </div>
  );
}