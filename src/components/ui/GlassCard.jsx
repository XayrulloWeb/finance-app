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
    const glassStyle = gradient ? {
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.3)',
    } : {
        background: 'rgba(255, 255, 255, 0.75)', // Чуть более прозрачный для эффекта
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.8)', // Более явная "керамическая" граница
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
    };

    const baseClasses = `
        relative overflow-hidden rounded-2xl p-6
        ${gradient ? 'text-white' : 'text-zinc-900'}
    `;

    const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-2xl hover:-translate-y-1' : '';

    const Component = onClick ? motion.button : motion.div;

    return (
        <Component
            className={`${baseClasses} ${hoverClasses} ${className}`}
            style={glassStyle}
            onClick={onClick}
            whileHover={hover ? { scale: 1.02 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            {...props}
        >
            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </Component>
    );
}
