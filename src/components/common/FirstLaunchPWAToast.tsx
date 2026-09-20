import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const WELCOME_SHOWN_KEY = 'sam_welcome_shown';

export const FirstLaunchPWAToast: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    // 1. Detect if running as installed PWA / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) {
      return;
    }

    // 2. Check if already shown in localStorage
    try {
      const alreadyShown = localStorage.getItem(WELCOME_SHOWN_KEY);
      if (alreadyShown === 'true') {
        return;
      }

      // Mark as shown immediately so even if refreshed it won't repeat
      localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
      setShowToast(true);

      // Auto dismiss after 4.5 seconds
      const timer = setTimeout(() => {
        setIsDismissing(true);
        setTimeout(() => setShowToast(false), 300);
      }, 4500);

      return () => clearTimeout(timer);
    } catch (_) {}
  }, []);

  if (!showToast) return null;

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => setShowToast(false), 300);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto ${
        isDismissing ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <div className="flex items-center gap-3 bg-slate-900/95 text-white px-5 py-3 rounded-full shadow-2xl border border-slate-700/60 backdrop-blur-md">
        <span className="text-sm font-semibold tracking-wide whitespace-nowrap">
          Welcome to SAM 🤝📖
        </span>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close welcome message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
