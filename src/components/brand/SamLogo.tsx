import React from 'react';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SamLogoProps {
  size?: LogoSize;
  className?: string;
  showBadge?: boolean;
}

const sizeMap: Record<LogoSize, { px: number; containerClass: string }> = {
  xs: { px: 24, containerClass: 'w-6 h-6' },
  sm: { px: 32, containerClass: 'w-8 h-8' },
  md: { px: 40, containerClass: 'w-10 h-10' },
  lg: { px: 56, containerClass: 'w-14 h-14' },
  xl: { px: 84, containerClass: 'w-21 h-21' },
};

/**
 * Official SAM — Smart Assignment Manager College Crest Logo
 * - Government Polytechnic Dharmavaram Emblem & SAM CME Badge
 * - Crisp, high-contrast, professional circular identity for Mobile & Web
 */
export const SamLogo: React.FC<SamLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const { px, containerClass } = sizeMap[size];

  return (
    <img
      src="/logo.png"
      alt="SAM — Smart Assignment Manager"
      width={px}
      height={px}
      className={`rounded-full object-cover shrink-0 select-none shadow-xs border border-emerald-900/10 transition-transform duration-200 hover:scale-105 ${containerClass} ${className}`}
      loading="eager"
    />
  );
};

export const SamLogoEducational = SamLogo;
export const SamLogoMinimalist = SamLogo;

/**
 * Raw SVG string for generating favicon and PWA icons
 */
export function getLogoSvgString(): string {
  return `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <image width="128" height="128" href="/logo.png" />
</svg>`;
}

export function getMaskableLogoSvgString(): string {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#052019" />
  <g transform="translate(51, 51)">
    <image width="410" height="410" href="/logo.png" />
  </g>
</svg>`;
}

