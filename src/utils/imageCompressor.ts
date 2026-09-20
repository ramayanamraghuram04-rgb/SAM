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

const MAX_DIMENSION = 1600;
const TARGET_SIZE_BYTES = 150 * 1024; // ~150 KB
const MIN_QUALITY = 0.55; // Never compress below 0.55 to preserve handwriting sharpness
const INITIAL_QUALITY = 0.78;

/**
 * Captures the current frame from an HTML5 Video element and draws it to an optimized off-screen canvas.
 */
export function captureFrameFromVideo(video: HTMLVideoElement): HTMLCanvasElement {
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
 * One-step capture from video element and compression to target ~150 KB Blob.
 */
export async function captureAndCompressFromVideo(video: HTMLVideoElement): Promise<CompressedImageResult> {
  const canvas = captureFrameFromVideo(video);
  return compressCanvasToBlob(canvas);
}
