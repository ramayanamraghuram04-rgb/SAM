import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6 sm:p-7',
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 sam-card-shadow transition-all duration-200 ${
        hoverable ? 'sam-card-hover' : ''
      } ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
