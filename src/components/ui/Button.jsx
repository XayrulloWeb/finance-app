import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    ...props
}) {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40',
        secondary: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-600',
        danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30',
        success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
    };

    const baseClasses = 'font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <motion.button
            whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {!loading && Icon && iconPosition === 'left' && <Icon size={18} />}
            {children}
            {!loading && Icon && iconPosition === 'right' && <Icon size={18} />}
        </motion.button>
    );
}
