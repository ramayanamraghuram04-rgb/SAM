import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin" />
        <Loader2 className="w-5 h-5 text-blue-600 absolute animate-pulse" />
      </div>
      {message && <p className="mt-4 text-xs font-medium text-slate-500 tracking-wide">{message}</p>}
    </div>
  );
};
