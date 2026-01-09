import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Settings, Wallet, TrendingUp, Users, LogOut } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';

export default function Layout() {
  const { user, logout } = useFinanceStore();

  const linkClass = ({ isActive }) =>
    `flex flex-col sm:flex-row items-center sm:gap-3 p-2 sm:px-4 sm:py-3 rounded-xl transition ${isActive ? 'text-blue-600 sm:bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`;

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-50">

      {/* МЕНЮ (СБОКУ ДЛЯ PC, СКРЫТО НА МОБИЛКАХ) */}
      <aside className="hidden sm:flex flex-col w-64 bg-white border-r border-gray-200 p-6 fixed h-full z-20">
        <div className="flex items-center gap-2 font-black text-2xl text-slate-900 mb-10">
          <div className="bg-blue-600 text-white p-2 rounded-lg"><Wallet size={24} /></div>
          Finance
        </div>

        <nav className="space-y-2">
          <NavLink to="/" className={linkClass}><LayoutDashboard size={20} /><span className="font-bold">Дашборд</span></NavLink>
          <NavLink to="/analytics" className={linkClass}><TrendingUp size={20} /><span className="font-bold">Аналитика</span></NavLink>
          <NavLink to="/counterparties" className={linkClass}><Users size={20} /><span className="font-bold">Контрагенты</span></NavLink>
          <NavLink to="/history" className={linkClass}><History size={20} /><span className="font-bold">История</span></NavLink>
          <NavLink to="/settings" className={linkClass}><Settings size={20} /><span className="font-bold">Счета</span></NavLink>
        </nav>

        {/* Кнопка выхода */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2 px-4 truncate">{user?.email}</div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 p-2 px-4 py-3 rounded-xl transition text-red-600 hover:bg-red-50 font-bold"
          >
            <LogOut size={20} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="flex-1 sm:ml-64 pb-24 sm:pb-0">
        <Outlet /> {/* СЮДА БУДУТ ПОДСТАВЛЯТЬСЯ СТРАНИЦЫ */}
      </main>

      {/* НИЖНЕЕ МЕНЮ (ТОЛЬКО ДЛЯ МОБИЛОК) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50 pb-safe">
        <NavLink to="/" className={linkClass}><LayoutDashboard size={24} /><span className="text-[10px] font-bold">Главная</span></NavLink>
        <NavLink to="/analytics" className={linkClass}><TrendingUp size={24} /><span className="text-[10px] font-bold">Графики</span></NavLink>
        <NavLink to="/counterparties" className={linkClass}><Users size={24} /><span className="text-[10px] font-bold">Люди</span></NavLink>
        <NavLink to="/history" className={linkClass}><History size={24} /><span className="text-[10px] font-bold">История</span></NavLink>
        <NavLink to="/settings" className={linkClass}><Settings size={24} /><span className="text-[10px] font-bold">Счета</span></NavLink>
      </nav>
    </div>
  );
}