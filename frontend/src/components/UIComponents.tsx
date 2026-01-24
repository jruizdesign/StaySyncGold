import React from 'react';
import { LucideIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  as?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', icon: Icon, as: Component = 'button', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    primary: "bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/30 border border-transparent",
    secondary: "bg-slate-800 text-white shadow-lg shadow-slate-800/20 hover:bg-slate-900 border border-transparent",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 border border-transparent",
    outline: "bg-white border-2 border-slate-200 text-slate-700 hover:border-gold-500 hover:text-gold-600 shadow-sm hover:shadow-md",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900"
  };

  // Convert to motion component if it's a standard button
  const MotionComponent = motion(Component as any);

  return (
    <MotionComponent
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={cn(baseStyle, sizes[size], variants[variant], className)}
      {...(props as any)}
    >
      {Icon && <Icon className={cn("mr-2", size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />}
      {children}
    </MotionComponent>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={cn("bg-white rounded-2xl shadow-sm border border-slate-100/60 p-6 hover:shadow-md hover:border-slate-200/60", className)}
  >
    {(title || action) && (
      <div className="flex justify-between items-center mb-6">
        {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </motion.div>
);

// Badge Component
export const Badge: React.FC<{ children: React.ReactNode, color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'amber' | 'purple' }> = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
    red: "bg-rose-500/10 text-rose-700 border border-rose-500/20",
    yellow: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
    amber: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-700 border border-purple-500/20",
    gray: "bg-slate-500/10 text-slate-700 border border-slate-500/20"
  };
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", colors[color])}
    >
      {children}
    </motion.span>
  );
};

// Input Component
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: LucideIcon }> = ({ label, className = '', icon: Icon, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        className={cn(
          "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-shadow",
          Icon ? 'pl-10' : '',
          className
        )}
        {...props}
      />
    </div>
  </div>
);

// Select Component
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <select
      className={cn(
        "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-shadow bg-white",
        className
      )}
      {...props}
    >
      {children}
    </select>
  </div>
);

// Modal Component
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden z-10 relative"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
              <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
