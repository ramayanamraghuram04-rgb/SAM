import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[34px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[42px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[50px] font-semibold',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md hover:shadow-blue-500/20 active:bg-blue-800',
    secondary:
      'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/60',
    outline:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-xs',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-rose-500/20 active:bg-rose-800',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-emerald-500/20 active:bg-emerald-800',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Please wait...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
