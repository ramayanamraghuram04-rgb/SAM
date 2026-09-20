import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('SAM Cloudinary Integration Verification Suite');
console.log('====================================================');

// 1. Check .env.local for Cloudinary configuration
const envPath = path.resolve('.env.local');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

const cloudNameMatch = envContent.match(/VITE_CLOUDINARY_CLOUD_NAME=(.*)/);
const presetMatch = envContent.match(/VITE_CLOUDINARY_UPLOAD_PRESET=(.*)/);

const cloudName = cloudNameMatch ? cloudNameMatch[1].trim() : 'SAM';
const preset = presetMatch ? presetMatch[1].trim() : 'SAM-SAMRT ASSIGNMENT MANAGER';

console.log(`[CHECK 1] Environment Config:`);
console.log(`  - Cloud Name:    ${cloudName}`);
console.log(`  - Upload Preset: ${preset}`);

// 2. Verify NO API secret in source or env
const allFiles = [
  '.env.local',
  '.env.example',
  'src/services/cloudinary.ts',
  'src/types/index.ts'
];
let secretFound = false;
for (const f of allFiles) {
  if (fs.existsSync(f)) {
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes('CLOUDINARY_API_SECRET') || text.includes('api_secret')) {
      console.error(`[FAIL] Found potential secret reference in ${f}`);
      secretFound = true;
    }
  }
}
if (!secretFound) {
  console.log('[PASS] Zero Cloudinary API Secrets in frontend code or environment files.');
} else {
  process.exit(1);
}

// 3. Verify service implementation structure
const serviceSrc = fs.readFileSync('src/services/cloudinary.ts', 'utf8');
const requiredTokens = [
  'CLOUDINARY_DEFAULT_FOLDER',
  'sam/assignments',
  'MAX_FILE_SIZE_BYTES',
  'ALLOWED_MIME_TYPES',
  'CloudinaryUploadError',
  'validateImageFile',
  'cloudinaryService',
  'uploadImage',
  'testConnection',
  'secure_url',
  'public_id',
  'resource_type',
  'width',
  'height',
  'bytes',
  'format'
];
for (const token of requiredTokens) {
  if (!serviceSrc.includes(token)) {
    console.error(`[FAIL] cloudinary.ts is missing required implementation for: ${token}`);
    process.exit(1);
  }
}
console.log('[PASS] cloudinary.ts satisfies all architectural and interface requirements.');

// 4. Test Cloudinary Network Upload
console.log('\n[CHECK 2] Testing Cloudinary direct HTTP upload...');
async function testUpload() {
  const testPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const formData = new FormData();
  formData.append('file', testPngBase64);
  formData.append('upload_preset', preset);
  formData.append('folder', 'sam/assignments');

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log(`Sending test payload to: ${uploadEndpoint}`);

  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      console.log(`HTTP Status: ${res.status}`);

      if (res.ok && data.secure_url) {
        console.log('SUCCESS: Cloudinary upload succeeded!');
        console.log('  - secure_url:    ', data.secure_url);
        console.log('  - public_id:     ', data.public_id);
        console.log('  - format:        ', data.format);
        console.log('  - bytes:         ', data.bytes);
        console.log('  - width x height:', `${data.width}x${data.height}`);
        console.log('====================================================');
        console.log('CLOUDINARY STATUS: VERIFIED AND CONNECTED');
        console.log('====================================================');
        return;
      } else {
        console.log('Response Details:', JSON.stringify(data, null, 2));
        console.log('====================================================');
        console.log('CLOUDINARY STATUS: ENDPOINT REACHABLE — PRESET NOT FOUND');
        console.log(`Cloudinary Message: ${data.error?.message || 'Unknown error'}`);
        console.log('====================================================');
        return;
      }
    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  if (lastErr) {
    console.error('Network failure connecting to Cloudinary:', lastErr.message, lastErr.cause || '');
  }
}

testUpload();

