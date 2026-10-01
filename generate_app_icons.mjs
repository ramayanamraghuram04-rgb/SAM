import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateAppIcons() {
  const sourceImage = 'C:/Users/ASUS/.gemini/antigravity-ide/brain/ade89a22-ef11-4bc5-a5fc-6140cb4bf4b1/.user_uploaded/media_1790860047880.jpg';
  const publicDir = path.resolve('public');

  if (!fs.existsSync(sourceImage)) {
    throw new Error(`Source image not found at ${sourceImage}`);
  }

  console.log('Loading source image...');
  
  // 1. Create a circular mask for smooth antialiased circular cut
  const circleMaskSvg = `<svg width="1024" height="1024"><circle cx="512" cy="512" r="476" fill="#ffffff" /></svg>`;
  
  // 2. Generate master circular transparent PNG (1024x1024)
  const masterCircularBuffer = await sharp(sourceImage)
    .resize(1024, 1024)
    .composite([{ input: Buffer.from(circleMaskSvg), blend: 'dest-in' }])
    .png({ quality: 100 })
    .toBuffer();

  // Save master transparent circular logo to public/logo.png
  fs.writeFileSync(path.join(publicDir, 'logo.png'), masterCircularBuffer);
  console.log('Saved public/logo.png');

  // Also save a solid white background version in case needed: public/logo-solid.png
  const solidBuffer = await sharp(sourceImage)
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'logo-solid.png'), solidBuffer);
  console.log('Saved public/logo-solid.png');

  // 3. Generate PWA 192x192 PNG
  await sharp(masterCircularBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved public/pwa-192x192.png');

  // 4. Generate PWA 512x512 PNG
  await sharp(masterCircularBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved public/pwa-512x512.png');

  // 5. Generate Apple Touch Icon 180x180 PNG (with white/neutral background for iOS homescreen)
  const appleTouchBuffer = await sharp({
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
  console.log('Saved public/apple-touch-icon.png');

  // 6. Generate Maskable Icon 512x512 PNG (for Android adaptive launcher, safe zone radius ~400px centered)
  const maskableBuffer = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 32, b: 25, alpha: 1 } // Deep dark green matching the SAM badge theme
    }
  })
    .composite([{
      input: await sharp(masterCircularBuffer).resize(410, 410).toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Saved public/maskable-icon-512x512.png');

  // 7. Generate favicon.svg (Vector wrapper embedding the circular logo as base64 for crisp browser tab rendering)
  const faviconBase64 = (await sharp(masterCircularBuffer).resize(128, 128).png().toBuffer()).toString('base64');
  const faviconSvgContent = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="128" height="128" href="data:image/png;base64,${faviconBase64}" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvgContent, 'utf8');
  console.log('Saved public/favicon.svg');

  // Also save in src/assets if needed
  const srcAssetsDir = path.resolve('src/assets');
  if (!fs.existsSync(srcAssetsDir)) {
    fs.mkdirSync(srcAssetsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(srcAssetsDir, 'logo.png'), masterCircularBuffer);
  console.log('Saved src/assets/logo.png');

  console.log('All icons generated successfully!');
}

generateAppIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
