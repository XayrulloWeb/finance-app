import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { ru, enUS, uz } from 'date-fns/locale';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

export default function Notifications() {
    const { t, i18n } = useTranslation();
    const { notifications, markNotificationRead, clearAllNotifications } = useFinanceStore();

    const locales = { ru, en: enUS, uz };
    const currentLocale = locales[i18n.language] || ru;

    // Group notifications
    const grouped = notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).reduce((acc, n) => {
        const date = new Date(n.created_at);
        let key = 'earlier';
        if (isToday(date)) key = 'today';
        else if (isYesterday(date)) key = 'yesterday';

        if (!acc[key]) acc[key] = [];
        acc[key].push(n);
        return acc;
    }, {});

    const getIcon = (type) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="text-warning" />;
            case 'success': return <CheckCircle className="text-success" />;
            case 'error': return <Trash2 className="text-error" />;
            default: return <Info className="text-primary" />;
        }
    };

    // Helper to get translated group title
    const getGroupTitle = (key) => {
        switch (key) {
            case 'today': return t('notifications.today');
            case 'yesterday': return t('notifications.yesterday');
            default: return t('notifications.earlier');
        }
    };

    // Sort order for display: today, yesterday, earlier
    const sortKeys = (keys) => {
        const order = ['today', 'yesterday', 'earlier'];
        return keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Bell strokeWidth={2.5} /></span>
                        {t('notifications.title')}
                    </h1>
                    <p className="text-zinc-500 mt-1">{t('notifications.subtitle')}</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <Button onClick={clearAllNotifications} size="sm" variant="ghost" icon={Check}>
                        {t('notifications.read_all')}
                    </Button>
                )}
            </div>

            {Object.keys(grouped).length === 0 && (
                <div className="text-center py-20 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-3xl bg-white/50">
                    <Bell size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('notifications.empty')}</p>
                </div>
            )}

            {sortKeys(Object.keys(grouped)).map(groupKey => (
                <div key={groupKey}>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3 ml-1">{getGroupTitle(groupKey)}</h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {grouped[groupKey].map((n) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <div
                                        className={`relative p-4 rounded-2xl border transition-all ${n.is_read ? 'bg-white border-zinc-100' : 'bg-white border-zinc-200 shadow-md shadow-indigo-500/5'}`}
                                        onClick={() => markNotificationRead(n.id)}
                                    >
                                        {!n.is_read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                        )}
                                        <div className="flex gap-4 items-start">
                                            <div className={`mt-1 p-2 rounded-xl bg-zinc-50 border border-zinc-100`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-bold ${n.is_read ? 'text-zinc-500' : 'text-zinc-900'}`}>
                                                    {n.title}
                                                </div>
                                                <div className="text-sm text-zinc-500 mt-1 leading-relaxed">
                                                    {n.message}
                                                </div>
                                                <div className="text-xs text-zinc-400 mt-2">
                                                    {format(new Date(n.created_at), 'HH:mm', { locale: currentLocale })} • {groupKey === 'today' ? format(new Date(n.created_at), 'd MMMM', { locale: currentLocale }) : format(new Date(n.created_at), 'd MMM yyyy', { locale: currentLocale })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            ))}
        </div>
    );
}
