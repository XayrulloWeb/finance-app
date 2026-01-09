import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
    children,
    className = '',
    gradient = false,
    hover = true,
    onClick,
    ...props
}) {
    const baseClasses = `
    relative overflow-hidden rounded-2xl p-6
    ${gradient
            ? 'bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60'
            : 'bg-white/70 dark:bg-gray-800/70'
        }
    backdrop-blur-xl
    border border-white/20 dark:border-gray-700/50
    shadow-xl shadow-black/5
  `;

    const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1' : '';

    const Component = onClick ? motion.button : motion.div;

    return (
        <Component
            className={`${baseClasses} ${hoverClasses} ${className}`}
            onClick={onClick}
            whileHover={hover ? { scale: 1.02 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            {...props}
        >
            {/* Gradient overlay */}
            {gradient && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 pointer-events-none" />
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </Component>
    );
}
