import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Official Best Modern Educational SAM Logo SVG
const officialSvg = `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#2563EB" />
  <path d="M50 19L79 32L50 45L21 32L50 19Z" fill="#FFFFFF" />
  <path d="M77 34V49C77 51 75 52 74 52" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round" />
  <path d="M25 50C32.5 46.5 42.5 47.5 50 51.5C57.5 47.5 67.5 46.5 75 50V75C67.5 71 57.5 71.5 50 76C42.5 71.5 32.5 71 25 75V50Z" fill="#FFFFFF" opacity="0.96" />
  <path d="M50 51.5V76" stroke="#2563EB" stroke-width="3.2" stroke-linecap="round" />
  <circle cx="74" cy="74" r="14" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="3" />
  <path d="M68 74L72 78L80 70" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

// Official Maskable SVG (with standard safe-zone margin for Android adaptive icons)
const officialMaskableSvg = `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
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

async function main() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(path.join(publicDir, 'icons'))) {
    fs.mkdirSync(path.join(publicDir, 'icons'), { recursive: true });
  }

  // 1. Write official Favicon SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), officialSvg, 'utf8');

  // 2. Generate crisp PNG assets
  await sharp(Buffer.from(officialSvg)).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  await sharp(Buffer.from(officialSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  await sharp(Buffer.from(officialMaskableSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Created maskable-icon-512x512.png');

  await sharp(Buffer.from(officialSvg)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  console.log('Official Best Modern SAM PWA and Favicon assets successfully generated!');
}

main().catch(console.error);
