import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChartPie, Settings, Wallet, Handshake, Users, LogOut, Receipt, History } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { toast } from './ui/Toast';

export default function Layout() {
  const { user, logout } = useFinanceStore();
  const location = useLocation();

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
    { to: "/counterparties", icon: Users, label: "Люди" },
    { to: "/settings", icon: Settings, label: "Настройки" },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 font-bold tracking-wide
    ${isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-2'
      : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300
    ${isActive
      ? 'text-blue-600 -translate-y-2'
      : 'text-gray-400'
    }`;

  return (
    <div className="flex bg-[#0b1121] min-h-screen text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 sidebar-glass p-6 fixed h-full z-30 shadow-2xl">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <Wallet className="text-white" size={26} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white leading-none">Finance</h1>
            <span className="text-[10px] font-bold text-blue-400 tracking-[0.2em] uppercase">Empire</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <item.icon size={20} strokeWidth={2.5} />
              <span className="font-bold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 mt-auto border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pro Plan</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-all"
          >
            <LogOut size={20} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pb-24 lg:pb-8 p-4 lg:p-8 max-w-[1600px] mx-auto w-full transition-all">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-700 flex justify-around p-2 pb-safe z-50 transition-colors duration-300 safe-area-pb">
        <NavLink to="/" className={mobileLinkClass}><LayoutDashboard size={24} /></NavLink>
        <NavLink to="/analytics" className={mobileLinkClass}><ChartPie size={24} /></NavLink>
        <div className="relative -mt-8">
          <NavLink to="/add" onClick={(e) => { e.preventDefault(); /* Open Modal */ }} className="flex bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-500/40 transform active:scale-90 transition-transform">
            <Wallet size={24} />
          </NavLink>
        </div>
        <NavLink to="/history" className={mobileLinkClass}><History size={24} /></NavLink>
        <NavLink to="/settings" className={mobileLinkClass}><Settings size={24} /></NavLink>
      </nav>
    </div>
  );
}