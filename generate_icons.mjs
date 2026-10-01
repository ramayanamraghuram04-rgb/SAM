import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(path.join(publicDir, 'icons'))) {
    fs.mkdirSync(path.join(publicDir, 'icons'), { recursive: true });
  }

  const logoFile = path.join(publicDir, 'logo.png');
  if (!fs.existsSync(logoFile)) {
    throw new Error('public/logo.png not found');
  }

  const masterCircularBuffer = fs.readFileSync(logoFile);

  // 1. Generate PWA 192x192 PNG
  await sharp(masterCircularBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 2. Generate PWA 512x512 PNG
  await sharp(masterCircularBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 3. Generate Apple Touch Icon 180x180 PNG
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{
      input: await sharp(masterCircularBuffer).resize(170, 170).toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 4. Generate Maskable Icon 512x512 PNG
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 32, b: 25, alpha: 1 }
    }
  })
    .composite([{
      input: await sharp(masterCircularBuffer).resize(410, 410).toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Created maskable-icon-512x512.png');

  // 5. Generate Favicon SVG
  const faviconBase64 = (await sharp(masterCircularBuffer).resize(128, 128).png().toBuffer()).toString('base64');
  const faviconSvgContent = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="128" height="128" href="data:image/png;base64,${faviconBase64}" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvgContent, 'utf8');
  console.log('Created favicon.svg');

  console.log('Official SAM Dharmavaram Crest PWA and Favicon assets successfully generated!');
}

main().catch(console.error);
