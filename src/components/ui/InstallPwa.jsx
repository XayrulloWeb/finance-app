import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';

export default function InstallPwa() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleClose = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-50 max-w-sm w-full"
            >
                <GlassCard className="flex items-center gap-4 p-4 !bg-white/90 border-indigo-100 shadow-2xl shadow-indigo-500/20">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                        <Download size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-zinc-900 text-sm">Установить приложение</h4>
                        <p className="text-xs text-zinc-500">Быстрый доступ и работа офлайн</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                        >
                            Установить
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </GlassCard>
            </motion.div>
        </AnimatePresence>
    );
}
