import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import GlassCard from '../ui/GlassCard';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useTranslation } from 'react-i18next';

export default function TrendsChart() {
    const { t, i18n } = useTranslation();
    const [trendsPeriod, setTrendsPeriod] = useState(7);
    const { getSpendingTrends } = useFinanceStore();
    const data = getSpendingTrends(trendsPeriod === 7 ? 'week' : 'month');

    // Helper for currency/number formatting
    const formatNumber = (val) => new Intl.NumberFormat(i18n.language === 'ru' ? 'ru-RU' : 'en-US').format(val);

    return (
        <section>
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-lg font-bold text-zinc-900">📈 {t('dashboard.trends.title')}</h2>
                <div className="flex gap-2 bg-white rounded-xl p-1 border border-zinc-200 shadow-sm">
                    {[7, 30].map(period => (
                        <button
                            key={period}
                            onClick={() => setTrendsPeriod(period)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trendsPeriod === period
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                        >
                            {period} {t('analytics.days_suffix')}
                        </button>
                    ))}
                </div>
            </div>
            <GlassCard className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis
                            dataKey="name"
                            stroke="#71717a"
                            style={{ fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <YAxis
                            stroke="#71717a"
                            style={{ fontSize: '11px', fontWeight: 'bold' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e4e4e7',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                            formatter={(value) => formatNumber(value)}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} iconType="line" />
                        <Line
                            type="monotone"
                            dataKey="income"
                            name={t('dashboard.stats.income')}
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expense"
                            name={t('dashboard.stats.expense')}
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ fill: '#ef4444', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </GlassCard>
        </section>
    );
}