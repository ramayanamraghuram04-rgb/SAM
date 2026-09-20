import React from 'react';

export const TeacherSticker: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => {
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
        <circle cx="60" cy="60" r="48" fill="#EFF6FF" />

        {/* Presentation Board / Assignment Clipboard */}
        <rect x="34" y="32" width="52" height="60" rx="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="46" y="27" width="28" height="8" rx="3" fill="#0F172A" />
        <circle cx="60" cy="31" r="2" fill="#94A3B8" />

        {/* Assignment Tasks Checklist */}
        {/* Item 1 */}
        <rect x="42" y="44" width="7" height="7" rx="2" fill="#2563EB" />
        <path d="M43.5 47.5L45 49L47.5 45.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="53" y="46" width="24" height="3" rx="1.5" fill="#334155" />

        {/* Item 2 */}
        <rect x="42" y="55" width="7" height="7" rx="2" fill="#10B981" />
        <path d="M43.5 58.5L45 60L47.5 56.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="53" y="57" width="28" height="3" rx="1.5" fill="#475569" />

        {/* Item 3 */}
        <rect x="42" y="66" width="7" height="7" rx="2" fill="#E2E8F0" />
        <rect x="53" y="68" width="20" height="3" rx="1.5" fill="#94A3B8" />

        {/* Rubric Lines */}
        <rect x="42" y="78" width="36" height="2" rx="1" fill="#E2E8F0" />
        <rect x="42" y="82" width="26" height="2" rx="1" fill="#E2E8F0" />

        {/* Floating Stylus / Teacher Pen */}
        <g className="animate-bounce" style={{ animationDuration: '4s', animationIterationCount: 'infinite' }}>
          <path
            d="M84 40L94 30L99 35L89 45L81 48L84 40Z"
            fill="#2563EB"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <path d="M91 33L96 38" stroke="#FFFFFF" strokeWidth="1.5" />
          <polygon points="81,48 84,40 89,45" fill="#1D4ED8" />
          <circle cx="82" cy="47" r="1" fill="#FFFFFF" />
        </g>

        {/* Evaluation Marks Badge / Score Star */}
        <g className="opacity-95">
          <circle cx="28" cy="46" r="10" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          <text
            x="28"
            y="50"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            10
          </text>
        </g>
      </svg>
    </div>
  );
};
