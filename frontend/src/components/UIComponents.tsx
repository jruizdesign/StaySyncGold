import React from 'react';
import { LucideIcon, X } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost', size?: 'sm' | 'md' | 'lg', icon?: LucideIcon }> = ({ children, variant = 'primary', size = 'md', className = '', icon: Icon, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    primary: "bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/30 hover:shadow-xl hover:shadow-gold-500/40 border border-transparent hover:-translate-y-0.5",
    secondary: "bg-slate-800 text-white shadow-lg shadow-slate-800/20 hover:bg-slate-900 border border-transparent hover:-translate-y-0.5",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 border border-transparent hover:-translate-y-0.5",
    outline: "bg-white border-2 border-slate-200 text-slate-700 hover:border-gold-500 hover:text-gold-600 shadow-sm hover:shadow-md",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900"
  };

  return (
    <button className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon className={`mr-2 ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string, action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100/60 p-6 transition-all duration-200 hover:shadow-md hover:border-slate-200/60 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-6">
        {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'amber' }> = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
    red: "bg-rose-500/10 text-rose-700 border border-rose-500/20",
    yellow: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
    amber: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
    gray: "bg-slate-500/10 text-slate-700 border border-slate-500/20"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
};

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
        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-shadow ${Icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <select
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-shadow bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scaleIn">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
