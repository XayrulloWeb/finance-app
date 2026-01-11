import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ChartPie, History, Handshake, Target, Receipt, Calendar, Bell, Users, Settings, Wallet, LogOut, Menu, X } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import { toast } from './ui/Toast';
import InstallPwa from './ui/InstallPwa';

export default function Layout() {
  const { user, logout, unreadNotifications } = useFinanceStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-4 px-6 py-4 mx-4 rounded-2xl transition-all duration-300 font-bold mb-2
    ${isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-2'
      : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60 hover:shadow-md hover:translate-x-2'
    } `;

  const mobileLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300
    ${isActive
      ? 'text-indigo-600 -translate-y-2'
      : 'text-zinc-400'
    } `;

  return (
    <div className="flex h-screen overflow-hidden text-zinc-900" style={{
      background: '#f9fafb',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(199, 210, 254, 0.4) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(224, 231, 255, 0.4) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(253, 230, 138, 0.15) 0px, transparent 50%)
      `
    }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 h-full z-30 shadow-2xl" style={{
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid rgba(209, 213, 219, 0.5)'
      }}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/50">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Wallet className="text-white" size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 leading-none mb-0">Finance</h1>
            <span className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] uppercase">Empire</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
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

        <div className="p-4 border-t border-zinc-200 bg-white/30">
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
      <main className="flex-1 h-full overflow-y-auto scroll-smooth custom-scrollbar relative">
        <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-8 pb-32 lg:pb-12">
          <Outlet />
        </div>
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                <span className="text-xl font-black text-zinc-900">Меню</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-lg ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-zinc-500 hover:bg-zinc-50'
                      }`
                    }
                  >
                    <item.icon size={24} strokeWidth={2.5} />
                    <span>{item.label}</span>
                    {item.to === '/notifications' && unreadNotifications > 0 && (
                      <span className="ml-auto bg-error text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadNotifications}</span>
                    )}
                  </NavLink>
                ))}
              </div>

              <div className="p-4 border-t border-zinc-100">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 mb-4">
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
                  className="w-full flex items-center gap-4 p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-bold text-lg"
                >
                  <LogOut size={24} strokeWidth={2.5} />
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