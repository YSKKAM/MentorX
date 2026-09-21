'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface MagneticButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
}

export default function MagneticButton({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled,
  ...props
}: MagneticButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 text-white shadow-lg shadow-indigo-500/25 border border-white/20',
    secondary:
      'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900/10 dark:border-white/10 shadow-md',
    ghost:
      'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
  };

  return (
    <motion.button
      whileHover={{
        scale: disabled ? 1 : 1.04,
        y: disabled ? 0 : -2,
        transition: { type: 'spring', stiffness: 450, damping: 18 },
      }}
      whileTap={{
        scale: disabled ? 1 : 0.96,
        transition: { type: 'spring', stiffness: 500, damping: 22 },
      }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
