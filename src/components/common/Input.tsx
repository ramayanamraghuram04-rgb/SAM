import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  defaultVisible?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { 
      label, 
      error, 
      helperText, 
      leftIcon, 
      rightIcon, 
      type, 
      defaultVisible = true, 
      className = '', 
      id, 
      ...props 
    }, 
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPasswordField = type === 'password';
    
    // Default to visible (don't hide) with option to toggle hide/show
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(defaultVisible);

    const effectiveType = isPasswordField 
      ? (isPasswordVisible ? 'text' : 'password') 
      : type;

    const effectiveRightIcon = rightIcon || (isPasswordField ? (
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setIsPasswordVisible(prev => !prev)}
        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
        title={isPasswordVisible ? "Hide password" : "Show password"}
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
      >
        {isPasswordVisible ? (
          <EyeOff className="w-4 h-4 text-slate-600" />
        ) : (
          <Eye className="w-4 h-4 text-slate-400" />
        )}
      </button>
    ) : null);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none
              ${leftIcon ? 'pl-10' : ''}
              ${effectiveRightIcon ? 'pr-10' : ''}
              ${
                error
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400'
              }
              ${props.disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}
              ${className}
            `}
            {...props}
          />
          {effectiveRightIcon && (
            <div className="absolute right-3 flex items-center">
              {effectiveRightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
