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
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5',
        secondary: 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-sm hover:border-zinc-300',
        danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-sm',
        success: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm',
        ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900',
        outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
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
