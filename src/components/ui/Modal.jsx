import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md', // sm, md, lg, xl
    showCloseButton = true
}) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                                {title && (
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {title}
                                    </h3>
                                )}
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <X size={24} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
