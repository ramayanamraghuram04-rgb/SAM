import React, { useState, useEffect } from 'react';
import { SamLogo } from '../brand/SamLogo';

const SESSION_WELCOME_KEY = 'sam_web_welcome_shown';

export const WebsiteWelcomeSplash: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode (PWA has its own toast)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    try {
      const alreadyShown = sessionStorage.getItem(SESSION_WELCOME_KEY);
      if (!alreadyShown) {
        setVisible(true);

        // Start fade out after 1.2s
        const fadeTimer = setTimeout(() => {
          setFading(true);
        }, 1200);

        // Fully unmount after fade completes (1.6s)
        const closeTimer = setTimeout(() => {
          setVisible(false);
          sessionStorage.setItem(SESSION_WELCOME_KEY, 'true');
        }, 1600);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(closeTimer);
        };
      }
    } catch (_) {}
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SESSION_WELCOME_KEY, 'true');
      } catch (_) {}
    }, 250);
  };

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-400 cursor-pointer ${
        fading ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center space-y-4 px-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="p-3 bg-blue-50/60 rounded-3xl ring-8 ring-blue-50/40">
          <SamLogo size="xl" className="shadow-lg shadow-blue-500/20" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to SAM
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide uppercase">
            Smart Assignment Manager
          </p>
        </div>

        {/* Subtle progress indicator */}
        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-blue-600 rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
};
