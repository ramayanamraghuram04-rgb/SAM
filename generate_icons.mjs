import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Option 1: Professional Minimalist SVG
const svgOption1 = `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#2563EB" />
  <path d="M68 28H38C32.4772 28 28 32.4772 28 38C28 43.5228 32.4772 48 38 48H62C67.5228 48 72 52.4772 72 58C72 63.5228 67.5228 68 62 68H30" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M48 58L54 64L68 46" stroke="#93C5FD" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="70" cy="28" r="4.5" fill="#DBEAFE" />
</svg>`;

// Option 1 Maskable SVG (with extra safe zone padding)
const svgOption1Maskable = `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" fill="#2563EB" />
  <g transform="translate(10, 10)">
    <path d="M68 28H38C32.4772 28 28 32.4772 28 38C28 43.5228 32.4772 48 38 48H62C67.5228 48 72 52.4772 72 58C72 63.5228 67.5228 68 62 68H30" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M48 58L54 64L68 46" stroke="#93C5FD" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="70" cy="28" r="4.5" fill="#DBEAFE" />
  </g>
</svg>`;

// Option 2: Modern Educational SVG
const svgOption2 = `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#1D4ED8" />
  <path d="M50 20L78 32L50 44L22 32L50 20Z" fill="#FFFFFF" />
  <path d="M76 34V48C76 50 74 51 73 51" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round" />
  <path d="M26 49C33 46 43 47 50 51C57 47 67 46 74 49V74C67 70.5 57 71 50 75C43 71 33 70.5 26 74V49Z" fill="#FFFFFF" opacity="0.95" />
  <path d="M50 51V75" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round" />
  <circle cx="74" cy="74" r="14" fill="#2563EB" stroke="#FFFFFF" stroke-width="3" />
  <path d="M68 74L72 78L80 70" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

async function main() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(path.join(publicDir, 'icons'))) {
    fs.mkdirSync(path.join(publicDir, 'icons'), { recursive: true });
  }

  // Write SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgOption1, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icons', 'logo-option1.svg'), svgOption1, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icons', 'logo-option2.svg'), svgOption2, 'utf8');

  // Generate PNGs
  await sharp(Buffer.from(svgOption1)).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  await sharp(Buffer.from(svgOption1)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  await sharp(Buffer.from(svgOption1Maskable)).resize(512, 512).png().toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Created maskable-icon-512x512.png');

  await sharp(Buffer.from(svgOption1)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Also Option 2 PNGs in public/icons/
  await sharp(Buffer.from(svgOption2)).resize(192, 192).png().toFile(path.join(publicDir, 'icons', 'option2-192x192.png'));
  await sharp(Buffer.from(svgOption2)).resize(512, 512).png().toFile(path.join(publicDir, 'icons', 'option2-512x512.png'));
  console.log('All PWA and Favicon assets successfully generated!');
}

main().catch(console.error);
