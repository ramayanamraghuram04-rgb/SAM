/**
 * Image compression utility for SAM assignment page captures.
 * 
 * - Targets approximately 150 KB per notebook page.
 * - Preserves pen strokes, handwriting clarity, and page margins.
 * - Dynamic resolution scaling (up to 1600px max dimension) for crisp legibility.
 * - Progressive JPEG quality adjustment (bounded between 0.55 and 0.82) to avoid artifacts.
 */

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

export interface WatermarkOptions {
  studentName?: string;
  studentPIN?: string;
  verificationCode?: string;
  timestamp?: string;
}

const MAX_DIMENSION = 1600;
const TARGET_SIZE_BYTES = 150 * 1024; // ~150 KB
const MIN_QUALITY = 0.55; // Never compress below 0.55 to preserve handwriting sharpness
const INITIAL_QUALITY = 0.78;

/**
 * Renders a compact, high-contrast watermark badge in a safe corner of the canvas.
 * Does not obscure handwriting in notebook margins.
 */
export function drawVerificationWatermark(
  canvas: HTMLCanvasElement,
  options?: WatermarkOptions
): void {
  if (!options) return;
  const { studentName, studentPIN, verificationCode, timestamp } = options;
  if (!studentName && !studentPIN && !verificationCode) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const lines: string[] = [];
  if (studentName) lines.push(studentName);
  if (studentPIN) lines.push(`PIN: ${studentPIN}`);
  if (verificationCode) lines.push(`Code: ${verificationCode}`);

  const formattedTime = timestamp || new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  lines.push(formattedTime);

  // Dynamic responsive font size based on canvas width (approx 11-14px)
  const fontSize = Math.max(11, Math.min(14, Math.round(canvas.width * 0.01)));
  const lineHeight = fontSize * 1.35;
  const paddingX = Math.round(fontSize * 0.85);
  const paddingY = Math.round(fontSize * 0.65);

  ctx.save();
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

  let maxTextWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxTextWidth) maxTextWidth = w;
  }

  const badgeWidth = maxTextWidth + paddingX * 2;
  const badgeHeight = lines.length * lineHeight + paddingY * 2;

  // Safe bottom-right corner positioning with subtle margin
  const margin = Math.round(fontSize * 1.2);
  const x = Math.max(0, canvas.width - badgeWidth - margin);
  const y = Math.max(0, canvas.height - badgeHeight - margin);

  // Background pill with translucent dark background for maximum readability
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;

  const radius = 6;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + badgeWidth - radius, y);
  ctx.quadraticCurveTo(x + badgeWidth, y, x + badgeWidth, y + radius);
  ctx.lineTo(x + badgeWidth, y + badgeHeight - radius);
  ctx.quadraticCurveTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - radius, y + badgeHeight);
  ctx.lineTo(x + radius, y + badgeHeight);
  ctx.quadraticCurveTo(x, y + badgeHeight, x, y + badgeHeight - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Render text lines
  let textY = y + paddingY + fontSize * 0.88;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('Code:')) {
      ctx.fillStyle = '#38bdf8'; // Sky blue for verification code
      ctx.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    } else if (i === 0) {
      ctx.fillStyle = '#ffffff'; // Crisp white for student name
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    } else {
      ctx.fillStyle = '#cbd5e1'; // Slate 300 for PIN and timestamp
      ctx.font = `500 ${Math.round(fontSize * 0.92)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    }
    ctx.fillText(line, x + paddingX, textY);
    textY += lineHeight;
  }

  ctx.restore();
}

/**
 * Captures the current frame from an HTML5 Video element and draws it to an optimized off-screen canvas.
 * Optionally applies a corner verification watermark badge.
 */
export function captureFrameFromVideo(
  video: HTMLVideoElement,
  watermark?: WatermarkOptions
): HTMLCanvasElement {
  const naturalWidth = video.videoWidth || 1280;
  const naturalHeight = video.videoHeight || 720;

  // Calculate scaled dimensions maintaining aspect ratio
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
      targetWidth = MAX_DIMENSION;
    } else {
      targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
      targetHeight = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error('Could not get 2D rendering context for canvas.');
  }

  // Draw image with smooth high-quality filtering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  // Apply watermark if options are provided
  if (watermark) {
    drawVerificationWatermark(canvas, watermark);
  }

  return canvas;
}

/**
 * Compresses an HTMLCanvasElement into a JPEG Blob targeting ~150 KB while preserving handwriting legibility.
 */
export async function compressCanvasToBlob(canvas: HTMLCanvasElement): Promise<CompressedImageResult> {
  const mimeType = 'image/jpeg';

  const getBlobWithQuality = (quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert canvas to blob'));
        },
        mimeType,
        quality
      );
    });
  };

  // Attempt initial pass at high readability quality
  let quality = INITIAL_QUALITY;
  let blob = await getBlobWithQuality(quality);

  // If size is significantly over 190 KB, gradually reduce quality (down to MIN_QUALITY)
  if (blob.size > TARGET_SIZE_BYTES * 1.3 && quality > MIN_QUALITY) {
    quality = 0.68;
    blob = await getBlobWithQuality(quality);

    if (blob.size > TARGET_SIZE_BYTES * 1.3 && quality > MIN_QUALITY) {
      quality = 0.58;
      blob = await getBlobWithQuality(quality);
    }
  }

  const dataUrl = canvas.toDataURL(mimeType, quality);
  const sizeKb = Math.round(blob.size / 1024);

  return {
    blob,
    dataUrl,
    sizeKb,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * One-step capture from video element, watermark rendering, and compression to target ~150 KB Blob.
 */
export async function captureAndCompressFromVideo(
  video: HTMLVideoElement,
  watermark?: WatermarkOptions
): Promise<CompressedImageResult> {
  const canvas = captureFrameFromVideo(video, watermark);
  return compressCanvasToBlob(canvas);
}
