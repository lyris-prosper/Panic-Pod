import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'safe' | 'outline' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'font-display font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed border-2';

  const variants = {
    primary: 'bg-pod-surface border-pod-border text-pod-text hover:border-safe hover:text-safe',
    danger: 'bg-danger border-danger-dark text-white hover:bg-danger-dark',
    safe: 'bg-safe border-safe-dark text-white hover:bg-safe-dark',
    outline: 'bg-transparent border-pod-border text-pod-text hover:border-safe hover:text-safe hover:bg-safe/10',
    warning: 'bg-warning border-warning text-black hover:bg-warning/80',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    xl: 'px-12 py-6 text-xl',
  };

  const glowClass = glow
    ? variant === 'danger'
      ? 'danger-glow animate-pulse-danger'
      : variant === 'warning'
      ? 'shadow-[0_0_20px_rgba(245,158,11,0.5)]'
      : 'safe-glow'
    : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${glowClass} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </button>
  );
};
