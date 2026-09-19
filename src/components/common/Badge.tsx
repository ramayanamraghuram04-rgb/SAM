import React from 'react';
import { Semester, SubmissionStatus, InvitationStatus } from '../../types';

export type BadgeVariant = 
  | 'blue' 
  | 'emerald' 
  | 'amber' 
  | 'rose' 
  | 'slate' 
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} tracking-wide ${className}`}
    >
      {children}
    </span>
  );
};

export const SemesterBadge: React.FC<{ semester: Semester; className?: string }> = ({
  semester,
  className = '',
}) => {
  return (
    <Badge variant="blue" size="sm" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
      {semester} Sem
    </Badge>
  );
};

export const SubmissionStatusBadge: React.FC<{ status: SubmissionStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'checked':
      return (
        <Badge variant="emerald" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Checked
        </Badge>
      );
    case 'submitted':
      return (
        <Badge variant="blue" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          Submitted
        </Badge>
      );
    case 'under_review':
      return (
        <Badge variant="purple" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
          Under Review
        </Badge>
      );
    case 'returned':
      return (
        <Badge variant="rose" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Returned
        </Badge>
      );
    case 'not_submitted':
    default:
      return (
        <Badge variant="amber" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Pending
        </Badge>
      );
  }
};
