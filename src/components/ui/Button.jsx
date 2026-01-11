import React from 'react';
// eslint-disable-next-line no-unused-vars
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
        primary: 'bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/30 hover:shadow-primary/40',
        secondary: 'bg-secondary hover:bg-slate-600 text-white border border-slate-600',
        danger: 'bg-error hover:bg-red-400 text-slate-900 shadow-lg shadow-error/20',
        success: 'bg-success hover:bg-lime-400 text-slate-900 shadow-lg shadow-success/20',
        ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white',
        outline: 'border-2 border-primary text-primary hover:bg-primary/10',
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
            {!loading && Icon && iconPosition === 'left' && <Icon size={18} strokeWidth={2.5} />}
            {children}
            {!loading && Icon && iconPosition === 'right' && <Icon size={18} strokeWidth={2.5} />}
        </motion.button>
    );
}
