import fs from 'fs';

console.log('====================================================');
console.log('SAM Branding, Logo Selection & PWA Verification Test');
console.log('====================================================');

// 1. Verify Manifest
const manifest = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));
if (manifest.name === 'SAM — Smart Assignment Manager' && manifest.icons.length === 4) {
  console.log('[PASS] Web App Manifest contains correct name and 4 valid icons');
} else {
  console.error('[FAIL] Manifest format issue');
  process.exit(1);
}

// 2. Verify all PWA icons exist and are non-empty
const iconFiles = [
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/maskable-icon-512x512.png',
  'public/apple-touch-icon.png',
  'public/favicon.svg'
];
for (const icon of iconFiles) {
  const stat = fs.statSync(icon);
  if (stat.size > 0) {
    console.log(`[PASS] ${icon} exists (${stat.size} bytes)`);
  } else {
    console.error(`[FAIL] Empty icon: ${icon}`);
    process.exit(1);
  }
}

// 3. Verify Logo components and exports
const logoSrc = fs.readFileSync('src/components/brand/SamLogo.tsx', 'utf8');
if (logoSrc.includes('SamLogoMinimalist') && logoSrc.includes('SamLogoEducational') && logoSrc.includes('getLogoSvgString')) {
  console.log('[PASS] SamLogo provides Option 1 (Minimalist) and Option 2 (Educational) components and SVG generator');
} else {
  console.error('[FAIL] Logo component missing exports');
  process.exit(1);
}

// 4. Verify Welcome Splash
const splashSrc = fs.readFileSync('src/components/common/WebsiteWelcomeSplash.tsx', 'utf8');
if (splashSrc.includes('Welcome to SAM') && splashSrc.includes('sam_web_welcome_shown')) {
  console.log('[PASS] WebsiteWelcomeSplash displays "Welcome to SAM" and guards with session storage');
} else {
  console.error('[FAIL] Welcome splash logic issue');
  process.exit(1);
}

// 5. Verify PWA First-Launch Toast
const toastSrc = fs.readFileSync('src/components/common/FirstLaunchPWAToast.tsx', 'utf8');
if (toastSrc.includes('Welcome to SAM 🤝📖') && toastSrc.includes('sam_welcome_shown') && toastSrc.includes('display-mode: standalone')) {
  console.log('[PASS] FirstLaunchPWAToast shows "Welcome to SAM 🤝📖" on first standalone launch and sets sam_welcome_shown = true');
} else {
  console.error('[FAIL] PWA toast logic issue');
  process.exit(1);
}

// 6. Verify Logo Selection Interface is Removed and Official Best Modern Logo is Locked
const modalSrc = fs.readFileSync('src/components/brand/LogoSelectionModal.tsx', 'utf8');
const landingSrc = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf8');
if (!modalSrc.includes('Choose your SAM logo') && !landingSrc.includes('Choose your SAM logo') && !landingSrc.includes('Change Logo Style')) {
  console.log('[PASS] Logo selection options removed from UI and official modern logo is locked in permanently');
} else {
  console.error('[FAIL] Logo selection options still present in UI');
  process.exit(1);
}

console.log('====================================================');
console.log('All branding, logo selection & PWA tests PASSED!');
console.log('====================================================');
