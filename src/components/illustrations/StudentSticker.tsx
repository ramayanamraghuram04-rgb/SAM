import React from 'react';

export const StudentSticker: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => {
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
        <circle cx="60" cy="60" r="48" fill="#EEF2FF" />

        {/* Open Study Notebook / Assignment Book */}
        <path
          d="M32 50C32 46 35 44 40 44H58V84H38C34 84 32 82 32 78V50Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
        <path
          d="M88 50C88 46 85 44 80 44H62V84H82C86 84 88 82 88 78V50Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
        {/* Book Spine Center */}
        <line x1="60" y1="44" x2="60" y2="84" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Notebook Content Lines - Left Page */}
        <line x1="38" y1="52" x2="52" y2="52" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        <line x1="38" y1="58" x2="54" y2="58" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="64" x2="52" y2="64" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="70" x2="48" y2="70" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />

        {/* Notebook Content Lines - Right Page */}
        <line x1="68" y1="52" x2="82" y2="52" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        <line x1="66" y1="58" x2="82" y2="58" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="66" y1="64" x2="80" y2="64" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="66" y1="70" x2="74" y2="70" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />

        {/* Student Mortarboard Cap */}
        <g className="animate-bounce" style={{ animationDuration: '3.8s', animationIterationCount: 'infinite' }}>
          {/* Cap Cap-Top Diamond */}
          <polygon
            points="60,25 86,34 60,43 34,34"
            fill="#1E1B4B"
            stroke="#4338CA"
            strokeWidth="1.5"
          />
          {/* Cap Skull Under-Cap */}
          <path d="M46 39V48C46 53 52 56 60 56C68 56 74 53 74 48V39" fill="#312E81" />
          {/* Tassel Button & String */}
          <circle cx="60" cy="34" r="2" fill="#F59E0B" />
          <path d="M60 34C68 37 74 41 74 47" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="72" y="47" width="4" height="6" rx="1.5" fill="#D97706" />
        </g>

        {/* Submission Upload Cloud Badge */}
        <g className="opacity-95">
          <circle cx="90" cy="74" r="11" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
          {/* Upload Arrow */}
          <path
            d="M90 78V70M90 70L86.5 73.5M90 70L93.5 73.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Mini Gold Star */}
        <polygon
          points="26,38 28.5,43 34,43.5 30,47 31,52.5 26,49.5 21,52.5 22,47 18,43.5 23.5,43"
          fill="#F59E0B"
        />
      </svg>
    </div>
  );
};
