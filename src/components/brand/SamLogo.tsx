import React from 'react';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SamLogoProps {
  size?: LogoSize;
  className?: string;
  showBadge?: boolean;
}

const sizeMap: Record<LogoSize, { px: number; containerClass: string }> = {
  xs: { px: 20, containerClass: 'w-5 h-5' },
  sm: { px: 28, containerClass: 'w-7 h-7' },
  md: { px: 36, containerClass: 'w-9 h-9' },
  lg: { px: 48, containerClass: 'w-12 h-12' },
  xl: { px: 72, containerClass: 'w-18 h-18' },
};

/**
 * Official Best Modern SAM Educational Logo
 * - Harmonious modern academic crest fusing:
 *   1. Modern mortarboard diamond crown (Education)
 *   2. Open educational textbook wings (Assignments & Learning)
 *   3. Verified assignment checkmark evaluation badge (Smart Management)
 * - Ultra-crisp vector silhouette, high contrast in royal blue (#2563EB) and pure white (#FFFFFF)
 */
export const SamLogo: React.FC<SamLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const { px } = sizeMap[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="SAM - Smart Assignment Manager"
    >
      {/* Background Rounded Tile in Vibrant Royal Blue */}
      <rect width="100" height="100" rx="22" fill="#2563EB" />

      {/* Modern Mortarboard Diamond Crown */}
      <path
        d="M50 19L79 32L50 45L21 32L50 19Z"
        fill="#FFFFFF"
      />

      {/* Graduation Cap Tassel Accent */}
      <path
        d="M77 34V49C77 51 75 52 74 52"
        stroke="#93C5FD"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Open Educational Book Wings (Assignment Pages) */}
      <path
        d="M25 50C32.5 46.5 42.5 47.5 50 51.5C57.5 47.5 67.5 46.5 75 50V75C67.5 71 57.5 71.5 50 76C42.5 71.5 32.5 71 25 75V50Z"
        fill="#FFFFFF"
        opacity="0.96"
      />

      {/* Book Spine Center Divider */}
      <path
        d="M50 51.5V76"
        stroke="#2563EB"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Smart Assignment Verified Badge in Bottom Right */}
      <circle cx="74" cy="74" r="14" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="3" />
      <path
        d="M68 74L72 78L80 70"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SamLogoEducational = SamLogo;
export const SamLogoMinimalist = SamLogo;

/**
 * Raw SVG string for generating favicon and PWA icons
 */
export function getLogoSvgString(): string {
  return `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#2563EB" />
  <path d="M50 19L79 32L50 45L21 32L50 19Z" fill="#FFFFFF" />
  <path d="M77 34V49C77 51 75 52 74 52" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round" />
  <path d="M25 50C32.5 46.5 42.5 47.5 50 51.5C57.5 47.5 67.5 46.5 75 50V75C67.5 71 57.5 71.5 50 76C42.5 71.5 32.5 71 25 75V50Z" fill="#FFFFFF" opacity="0.96" />
  <path d="M50 51.5V76" stroke="#2563EB" stroke-width="3.2" stroke-linecap="round" />
  <circle cx="74" cy="74" r="14" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="3" />
  <path d="M68 74L72 78L80 70" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}

export function getMaskableLogoSvgString(): string {
  return `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" fill="#2563EB" />
  <g transform="translate(10, 10)">
    <path d="M50 19L79 32L50 45L21 32L50 19Z" fill="#FFFFFF" />
    <path d="M77 34V49C77 51 75 52 74 52" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round" />
    <path d="M25 50C32.5 46.5 42.5 47.5 50 51.5C57.5 47.5 67.5 46.5 75 50V75C67.5 71 57.5 71.5 50 76C42.5 71.5 32.5 71 25 75V50Z" fill="#FFFFFF" opacity="0.96" />
    <path d="M50 51.5V76" stroke="#2563EB" stroke-width="3.2" stroke-linecap="round" />
    <circle cx="74" cy="74" r="14" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="3" />
    <path d="M68 74L72 78L80 70" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`;
}
