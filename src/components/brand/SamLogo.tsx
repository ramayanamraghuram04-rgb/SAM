import React from 'react';

export type LogoOption = 'option1' | 'option2';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SamLogoProps {
  option?: LogoOption;
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
 * OPTION 1: Professional Minimalist SAM Logo
 * - Geometric monogram fusing the letter "S" with assignment document layers and a verified checkmark
 * - Represents: Assignments, Organization, Smart Management
 * - High contrast, razor-sharp at all sizes, clean blue & white identity
 */
export const SamLogoMinimalist: React.FC<{ size?: LogoSize; className?: string }> = ({
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
      aria-label="SAM Minimalist Logo"
    >
      {/* Background Rounded Shield / Tile */}
      <rect width="100" height="100" rx="22" fill="#2563EB" />

      {/* Layer 1: Clean White Minimalist Geometric "S" & Folded Document Structure */}
      {/* Top loop of S / Document Header */}
      <path
        d="M68 28H38C32.4772 28 28 32.4772 28 38C28 43.5228 32.4772 48 38 48H62C67.5228 48 72 52.4772 72 58C72 63.5228 67.5228 68 62 68H30"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Smart Management Checkmark Accent */}
      <path
        d="M48 58L54 64L68 46"
        stroke="#93C5FD"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Minimalist Top Assignment Corner Tab */}
      <circle cx="70" cy="28" r="4.5" fill="#DBEAFE" />
    </svg>
  );
};

/**
 * OPTION 2: Modern Educational SAM Logo
 * - Academic crest combining open textbook knowledge wings with graduation cap geometry and verified assignment check
 * - Represents: Education, Organization, Verified Submissions
 * - Bold silhouette, distinctive academic identity in royal blue & white
 */
export const SamLogoEducational: React.FC<{ size?: LogoSize; className?: string }> = ({
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
      aria-label="SAM Educational Logo"
    >
      {/* Background Rounded Tile */}
      <rect width="100" height="100" rx="22" fill="#1D4ED8" />

      {/* Modern Mortarboard Diamond Crown */}
      <path
        d="M50 20L78 32L50 44L22 32L50 20Z"
        fill="#FFFFFF"
      />

      {/* Graduation Cap Tassel Accent */}
      <path
        d="M76 34V48C76 50 74 51 73 51"
        stroke="#93C5FD"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Open Educational Book Wings (Assignment Pages) */}
      <path
        d="M26 49C33 46 43 47 50 51C57 47 67 46 74 49V74C67 70.5 57 71 50 75C43 71 33 70.5 26 74V49Z"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* Book Spine Center Divider */}
      <path
        d="M50 51V75"
        stroke="#1D4ED8"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Smart Assignment Verified Badge in Bottom Right */}
      <circle cx="74" cy="74" r="14" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
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

/**
 * Master SAM Logo Component
 */
export const SamLogo: React.FC<SamLogoProps> = ({
  option = 'option1',
  size = 'md',
  className = '',
}) => {
  if (option === 'option2') {
    return <SamLogoEducational size={size} className={className} />;
  }
  return <SamLogoMinimalist size={size} className={className} />;
};

/**
 * Raw SVG strings for generating favicon and PWA icons
 */
export function getLogoSvgString(option: LogoOption): string {
  if (option === 'option2') {
    return `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#1D4ED8" />
  <path d="M50 20L78 32L50 44L22 32L50 20Z" fill="#FFFFFF" />
  <path d="M76 34V48C76 50 74 51 73 51" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round" />
  <path d="M26 49C33 46 43 47 50 51C57 47 67 46 74 49V74C67 70.5 57 71 50 75C43 71 33 70.5 26 74V49Z" fill="#FFFFFF" opacity="0.95" />
  <path d="M50 51V75" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round" />
  <circle cx="74" cy="74" r="14" fill="#2563EB" stroke="#FFFFFF" stroke-width="3" />
  <path d="M68 74L72 78L80 70" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
  }

  return `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#2563EB" />
  <path d="M68 28H38C32.4772 28 28 32.4772 28 38C28 43.5228 32.4772 48 38 48H62C67.5228 48 72 52.4772 72 58C72 63.5228 67.5228 68 62 68H30" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M48 58L54 64L68 46" stroke="#93C5FD" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="70" cy="28" r="4.5" fill="#DBEAFE" />
</svg>`;
}
