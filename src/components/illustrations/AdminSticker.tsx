import React from 'react';

export const AdminSticker: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
      >
        {/* Soft Background Badge / Sticker Contour */}
        <circle cx="60" cy="60" r="54" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="48" fill="#F1F5F9" />

        {/* Dashboard Console / Computer Screen */}
        <rect x="32" y="36" width="56" height="42" rx="6" fill="#0F172A" />
        <rect x="35" y="39" width="50" height="32" rx="4" fill="#1E293B" />
        
        {/* Window Controls */}
        <circle cx="41" cy="45" r="2" fill="#EF4444" />
        <circle cx="47" cy="45" r="2" fill="#F59E0B" />
        <circle cx="53" cy="45" r="2" fill="#10B981" />

        {/* Console Stats Bars */}
        <rect x="41" y="52" width="22" height="3" rx="1.5" fill="#38BDF8" />
        <rect x="41" y="58" width="34" height="2.5" rx="1.2" fill="#64748B" />
        <rect x="41" y="63" width="28" height="2.5" rx="1.2" fill="#64748B" />

        {/* Mini Chart Graphic on Screen */}
        <path d="M68 64L72 58L76 61L81 54" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="81" cy="54" r="2" fill="#60A5FA" />

        {/* Monitor Base Stand */}
        <path d="M54 78H66L68 84H52L54 78Z" fill="#334155" />
        <rect x="48" y="84" width="24" height="3.5" rx="1.7" fill="#475569" />

        {/* Floating Admin Shield Badge */}
        <g className="animate-bounce" style={{ animationDuration: '3.5s', animationIterationCount: 'infinite' }}>
          <path
            d="M86 36L96 40V50C96 56.5 91.5 62 86 64C80.5 62 76 56.5 76 50V40L86 36Z"
            fill="#2563EB"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          {/* Checkmark inside Shield */}
          <path
            d="M82 49.5L85 52.5L90.5 46.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Gear / Institutional Settings Accent */}
        <g className="opacity-90">
          <circle cx="28" cy="74" r="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <path
            d="M28 69V79M23 74H33M24.5 70.5L31.5 77.5M24.5 77.5L31.5 70.5"
            stroke="#64748B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="28" cy="74" r="3.5" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
};
