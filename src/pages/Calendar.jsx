import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ru, enUS, uz } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import TransactionItem from '../components/TransactionItem';
import { useTranslation } from 'react-i18next';

export default function Calendar() {
    const { t, i18n } = useTranslation();
    const store = useFinanceStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const locales = { ru, en: enUS, uz };
    const currentLocale = locales[i18n.language] || ru;

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getTransactionsForDay = (date) => {
        return store.transactions.filter(t => isSameDay(parseISO(t.date), date));
    };

    const getDayStatus = (date) => {
        const txs = getTransactionsForDay(date);
        if (txs.length === 0) return null;
        const hasExpense = txs.some(t => t.type === 'expense');
        const hasIncome = txs.some(t => t.type === 'income');
        if (hasExpense && hasIncome) return 'mixed';
        if (hasIncome) return 'income';
        return 'expense';
    };

    const dayStatusColor = (status) => {
        if (status === 'income') return 'bg-success';
        if (status === 'expense') return 'bg-error';
        if (status === 'mixed') return 'bg-warning';
        return '';
    };

    // Days of week header - dynamically generated
    const weekDays = eachDayOfInterval({
        start: startOfMonth(currentDate), // just need 7 days, doesn't matter much which week as long as it starts on Monday? 
        // Actually to get Mon-Sun correctly we should rely on a fixed week or just hardcode if we want "Mon, Tue..." strictly.
        // But date-fns `ru` locale starts week on Monday.
        // Let's just map 0-6 relative to a known Monday.
        end: new Date(2024, 0, 7) // arbitrary logic
    }).slice(0, 7).map((d, i) => {
        // Better: create a helper for week days.
        // ISO week starts on Monday (1) to Sunday (7).
        // Let's use a known Monday: Jan 1 2024 is Monday
        const monday = new Date(2024, 0, 1); // Jan 1 2024
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        return format(day, 'cccccc', { locale: currentLocale });
    });


    return (
        <div className="animate-fade-in pb-24">
            <div className="flex justify-between items-center mb-6 px-1">
                <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
                    <CalendarIcon className="text-indigo-600" size={32} strokeWidth={2.5} />
                    {t('calendar.title')}
                </h1>
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-zinc-200 shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <span className="font-bold text-zinc-900 min-w-[120px] text-center capitalize">
                        {format(currentDate, 'LLLL yyyy', { locale: currentLocale })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
                        <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                {/* Week Header */}
                <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
                    {weekDays.map((day, i) => (
                        <div key={i} className="py-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 auto-rows-[100px] sm:auto-rows-[120px]">
                    {/* Padding for start of month - we need to calculate day of week offset properly */}
                    {/* getDay returns 0 for Sunday. If we want Monday start:
                        Mon(1)->0, Tue(2)->1... Sun(0)->6
                     */}
                    {Array.from({ length: (startOfMonth(currentDate).getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} className="border-r border-b border-zinc-100 bg-zinc-50/50" />
                    ))}

                    {days.map(day => {
                        const status = getDayStatus(day);
                        const txs = getTransactionsForDay(day);
                        const total = txs.reduce((acc, t) => acc + (t.type === 'expense' ? -t.amount : t.amount), 0);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`relative border-r border-b border-zinc-100 p-2 cursor-pointer transition-all hover:bg-zinc-50 group ${isSameDay(day, new Date()) ? 'bg-indigo-50' : ''}`}
                            >
                                <div className={`text-sm font-bold mb-1 ${isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-900'}`}>
                                    {format(day, 'd')}
                                </div>

                                {/* Dots/Indicators */}
                                {status && (
                                    <div className="flex flex-col gap-1 items-end">
                                        <div className={`w-2 h-2 rounded-full ${dayStatusColor(status)} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                                        <div className={`text-[10px] font-bold tabular-nums opacity-80 ${total > 0 ? 'text-success' : 'text-error'}`}>
                                            {total !== 0 && (total > 0 ? '+' : '') + new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { notation: 'compact' }).format(total)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Selected Date Modal */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
                        onClick={() => setSelectedDate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/80">
                                <h3 className="text-xl font-bold text-zinc-900 capitalize">
                                    {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: currentLocale })}
                                </h3>
                                <button onClick={() => setSelectedDate(null)} className="text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {getTransactionsForDay(selectedDate).length > 0 ? (
                                    getTransactionsForDay(selectedDate).map(t => {
                                        const cat = store.categories.find(c => c.id === t.category_id);
                                        const acc = store.accounts.find(a => a.id === t.account_id);
                                        return <TransactionItem key={t.id} transaction={t} category={cat} account={acc} />;
                                    })
                                ) : (
                                    <div className="text-center py-10 text-zinc-400">
                                        <div className="text-4xl mb-2">💤</div>
                                        <div>{t('calendar.no_transactions')}</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
