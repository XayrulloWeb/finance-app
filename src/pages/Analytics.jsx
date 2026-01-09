import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#ec4899', '#6366f1'];

export default function Analytics() {
    const store = useFinanceStore();
    const [period, setPeriod] = useState('month'); // today, week, month, year

    // Данные для pie chart (расходы по категориям)
    const expenseBreakdown = store.getCategoryBreakdown('expense', period);
    const pieData = expenseBreakdown.map((item, idx) => ({
        name: item.name,
        value: item.amount,
        color: COLORS[idx % COLORS.length]
    }));

    // Данные для line chart (тренд за последние 7 дней)
    const getLast7DaysTrend = () => {
        const days = eachDayOfInterval({
            start: subDays(new Date(), 6),
            end: new Date()
        });

        return days.map(day => {
            const dayTransactions = store.transactions.filter(t => {
                const txDate = format(new Date(t.date), 'yyyy-MM-dd');
                const currentDay = format(day, 'yyyy-MM-dd');
                return txDate === currentDay;
            });

            const income = dayTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = dayTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                date: format(day, 'd MMM', { locale: ru }),
                Доход: income,
                Расход: expense
            };
        });
    };

    const trendData = getLast7DaysTrend();

    // Статистика
    const totalIncome = store.getIncomeByPeriod(period);
    const totalExpense = store.getExpenseByPeriod(period);
    const balance = totalIncome - totalExpense;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-24 custom-scrollbar">
            <h1 className="text-3xl font-black mb-6 gradient-text">📊 Аналитика</h1>

            {/* Период фильтр */}
            <div className="bg-white p-2 rounded-2xl shadow-sm mb-6 flex gap-2">
                {['today', 'week', 'month', 'year'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all ${period === p
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {p === 'today' && 'Сегодня'}
                        {p === 'week' && 'Неделя'}
                        {p === 'month' && 'Месяц'}
                        {p === 'year' && 'Год'}
                    </button>
                ))}
            </div>

            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <TrendingUp size={20} />
                        <span className="text-sm font-semibold">Доходы</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900">
                        {new Intl.NumberFormat('uz-UZ').format(totalIncome)}
                        <span className="text-sm text-gray-400 ml-1">UZS</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <TrendingDown size={20} />
                        <span className="text-sm font-semibold">Расходы</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900">
                        {new Intl.NumberFormat('uz-UZ').format(totalExpense)}
                        <span className="text-sm text-gray-400 ml-1">UZS</span>
                    </div>
                </div>

                <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100`}>
                    <div className="flex items-center gap-2 mb-2">
                        <PieChartIcon size={20} className={balance >= 0 ? 'text-blue-600' : 'text-orange-600'} />
                        <span className="text-sm font-semibold text-gray-600">Баланс</span>
                    </div>
                    <div className={`text-3xl font-black ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {balance >= 0 ? '+' : ''}
                        {new Intl.NumberFormat('uz-UZ').format(balance)}
                        <span className="text-sm text-gray-400 ml-1">UZS</span>
                    </div>
                </div>
            </div>

            {/* Тренд за 7 дней */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold mb-4">📈 Динамика (последние 7 дней)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                        <XAxis dataKey="date" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '12px'
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Доход" stroke="#10b981" strokeWidth={3} />
                        <Line type="monotone" dataKey="Расход" stroke="#ef4444" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </section>

            {/* Разбивка по категориям */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold mb-4">🍰 Расходы по категориям</h2>

                {pieData.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                            {expenseBreakdown.slice(0, 10).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                        />
                                        <span className="font-semibold text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">
                                        {new Intl.NumberFormat('uz-UZ').format(item.amount)} UZS
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <p>Нет данных за выбранный период</p>
                    </div>
                )}
            </section>

            {/* Топ категории */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">🏆 Топ-5 категорий расходов</h2>
                {expenseBreakdown.slice(0, 5).length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={expenseBreakdown.slice(0, 5)}>
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    padding: '12px'
                                }}
                            />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <p>Нет данных</p>
                    </div>
                )}
            </section>

            {/* Аналитика по контрагентам */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">🤝 Аналитика по контрагентам</h2>

                {store.counterparties.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ТОП-5 источников дохода */}
                        <div>
                            <h3 className="font-bold text-lg text-green-600 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} />
                                ТОП-5 источников дохода
                            </h3>
                            {(() => {
                                const topIncome = store.getTopIncomeCounterparties(5, period);
                                return topIncome.length > 0 ? (
                                    <div className="space-y-3">
                                        {topIncome.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl">{item.counterparty.icon}</div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{item.counterparty.name}</div>
                                                        <div className="text-xs text-gray-500">#{idx + 1}</div>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-green-600">
                                                    +{new Intl.NumberFormat('uz-UZ').format(item.amount)} UZS
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <p>Нет данных о доходах</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ТОП-5 получателей платежей */}
                        <div>
                            <h3 className="font-bold text-lg text-red-600 mb-4 flex items-center gap-2">
                                <TrendingDown size={20} />
                                ТОП-5 получателей платежей
                            </h3>
                            {(() => {
                                const topExpense = store.getTopExpenseCounterparties(5, period);
                                return topExpense.length > 0 ? (
                                    <div className="space-y-3">
                                        {topExpense.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl">{item.counterparty.icon}</div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{item.counterparty.name}</div>
                                                        <div className="text-xs text-gray-500">#{idx + 1}</div>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-red-600">
                                                    -{new Intl.NumberFormat('uz-UZ').format(item.amount)} UZS
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <p>Нет данных о расходах</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-lg mb-2">Нет контрагентов</p>
                        <p className="text-sm">Добавь людей и компании в разделе "Контрагенты"</p>
                    </div>
                )}
            </section>
        </div>
    );
}
