import { createWorker } from 'tesseract.js';

export interface AICodeDetectionResult {
  codeFound: boolean;
  confidence: number; // 0 to 100
  matchedPage: number | null; // 1-indexed
  detectedSnippet?: string;
  scannedPagesCount: number;
  allPagesText: { page: number; text: string; confidence: number }[];
  isFuzzyMatch?: boolean;
  error?: string;
}

/**
 * Common handwritten character equivalence classes for notebook OCR
 */
const EQUIVALENCE_MAP: Record<string, string[]> = {
  '0': ['O', 'Q', 'D', '0'],
  'O': ['0', 'Q', 'D', 'O'],
  '1': ['I', 'L', 'l', '|', '1', '/'],
  'I': ['1', 'L', 'l', '|', 'I'],
  '2': ['Z', '2'],
  'Z': ['2', 'Z'],
  '5': ['S', '5', '$'],
  'S': ['5', 'S', '$'],
  '6': ['G', '6', 'b'],
  'G': ['6', 'G'],
  '8': ['B', '8'],
  'B': ['8', 'B'],
  'U': ['V', 'Y', 'U'],
  'V': ['U', 'Y', 'V'],
  'Y': ['V', 'U', 'Y', 'T'],
};

/**
 * Calculates similarity between two single characters taking into account
 * handwriting OCR misidentifications.
 */
function charMatchScore(a: string, b: string): number {
  const upperA = a.toUpperCase();
  const upperB = b.toUpperCase();
  if (upperA === upperB) return 1.0;

  const equivalents = EQUIVALENCE_MAP[upperA];
  if (equivalents && equivalents.includes(upperB)) {
    return 0.85; // Strong handwriting substitution score
  }

  return 0.0;
}

/**
 * Fuzzy matches a target verification code (e.g. '9BQHPY') against recognized OCR text.
 * Strips whitespace, ignores punctuation, and slides across candidate tokens.
 */
export function fuzzyMatchVerificationCode(
  ocrText: string,
  targetCode: string
): { isMatch: boolean; confidence: number; snippet: string; isFuzzy: boolean } {
  if (!ocrText || !targetCode) {
    return { isMatch: false, confidence: 0, snippet: '', isFuzzy: false };
  }

  const cleanTarget = targetCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanTarget.length === 0) {
    return { isMatch: false, confidence: 0, snippet: '', isFuzzy: false };
  }

  // 1. Direct match check (highest confidence)
  const normalizedOcr = ocrText.toUpperCase();
  const exactIndex = normalizedOcr.indexOf(cleanTarget);
  if (exactIndex !== -1) {
    const start = Math.max(0, exactIndex - 15);
    const end = Math.min(normalizedOcr.length, exactIndex + cleanTarget.length + 15);
    return {
      isMatch: true,
      confidence: 98,
      snippet: normalizedOcr.slice(start, end).trim(),
      isFuzzy: false,
    };
  }

  // 2. Continuous alphanumeric strip check (handles spaces inserted by OCR inside the code)
  const alnumChars: { char: string; originalIndex: number }[] = [];
  for (let i = 0; i < normalizedOcr.length; i++) {
    const ch = normalizedOcr[i];
    if (/[A-Z0-9]/.test(ch)) {
      alnumChars.push({ char: ch, originalIndex: i });
    }
  }

  const targetLen = cleanTarget.length;
  let bestScore = 0;
  let bestSnippet = '';
  let bestIsFuzzy = false;

  // Slide window of targetLen over alphanumeric characters
  for (let i = 0; i <= alnumChars.length - targetLen; i++) {
    let windowScore = 0;
    let exactChars = 0;

    for (let j = 0; j < targetLen; j++) {
      const targetChar = cleanTarget[j];
      const ocrChar = alnumChars[i + j].char;
      const score = charMatchScore(targetChar, ocrChar);
      windowScore += score;
      if (targetChar === ocrChar) {
        exactChars++;
      }
    }

    const avgScore = windowScore / targetLen;
    if (avgScore > bestScore) {
      bestScore = avgScore;
      const startIdx = Math.max(0, alnumChars[i].originalIndex - 10);
      const endIdx = Math.min(normalizedOcr.length, alnumChars[i + targetLen - 1].originalIndex + 11);
      bestSnippet = normalizedOcr.slice(startIdx, endIdx).trim();
      bestIsFuzzy = exactChars < targetLen;
    }
  }

  // Also check if target without spaces appears directly in concatenated alphanumeric string
  const concatenated = alnumChars.map((c) => c.char).join('');
  if (concatenated.includes(cleanTarget)) {
    return {
      isMatch: true,
      confidence: 95,
      snippet: bestSnippet || cleanTarget,
      isFuzzy: false,
    };
  }

  // Threshold: >= 80% similarity indicates a high-confidence match with handwriting ambiguity
  if (bestScore >= 0.80) {
    const confidencePct = Math.round(bestScore * 100);
    return {
      isMatch: true,
      confidence: confidencePct,
      snippet: bestSnippet,
      isFuzzy: bestIsFuzzy,
    };
  }

  return {
    isMatch: false,
    confidence: Math.round(bestScore * 100),
    snippet: bestSnippet,
    isFuzzy: false,
  };
}

/**
 * Preprocesses an image source to high-contrast grayscale on canvas
 * to isolate ink handwriting from paper fibers and ruled lines.
 */
export async function preprocessImageForOcr(
  imageSource: string | Blob
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not in browser DOM environment, return original source
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      if (typeof imageSource === 'string') return resolve(imageSource);
      return reject(new Error('Canvas DOM unavailable'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Limit max dimension to 1600px for speed while maintaining sharp text
        const maxDim = 1600;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Extract pixel data for contrast enhancement & binarization
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Grayscale + Contrast Stretch
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance weights
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Increase contrast: darken ink, brighten paper
          if (gray < 130) {
            gray = Math.max(0, gray * 0.7); // Darken ink
          } else {
            gray = Math.min(255, 128 + (gray - 128) * 1.4); // Brighten paper
          }

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        // In case of CORS or canvas security error, fallback to original source
        if (typeof imageSource === 'string') {
          resolve(imageSource);
        } else {
          resolve(URL.createObjectURL(imageSource));
        }
      }
    };

    img.onerror = () => {
      if (typeof imageSource === 'string') {
        resolve(imageSource);
      } else {
        resolve(URL.createObjectURL(imageSource));
      }
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Singleton worker management for fast reuse without worker initialization lag
 */
let sharedWorkerPromise: Promise<any> | null = null;

async function getOcrWorker(): Promise<any> {
  if (!sharedWorkerPromise) {
    sharedWorkerPromise = (async () => {
      try {
        const worker = await createWorker('eng', 1, {
          logger: () => {
            // Quiet mode in production
          },
        });
        return worker;
      } catch (err) {
        sharedWorkerPromise = null;
        throw err;
      }
    })();
  }
  return sharedWorkerPromise;
}

/**
 * Main AI Verification Service
 */
export const aiVerificationService = {
  /**
   * Scans an array of page images (URLs or Blobs) to check whether
   * the specified verification code is visibly written in the notebook.
   */
  async verifyNotebookPages(params: {
    images: (string | Blob)[];
    targetCode: string;
    onProgress?: (progress: { currentPage: number; totalPages: number; statusText: string }) => void;
  }): Promise<AICodeDetectionResult> {
    const { images, targetCode, onProgress } = params;

    if (!images || images.length === 0) {
      return {
        codeFound: false,
        confidence: 0,
        matchedPage: null,
        scannedPagesCount: 0,
        allPagesText: [],
        error: 'No images provided for AI verification.',
      };
    }

    if (!targetCode || targetCode.trim().length === 0) {
      return {
        codeFound: false,
        confidence: 0,
        matchedPage: null,
        scannedPagesCount: 0,
        allPagesText: [],
        error: 'Target verification code is missing.',
      };
    }

    const cleanTarget = targetCode.trim().toUpperCase();
    const allPagesText: { page: number; text: string; confidence: number }[] = [];

    try {
      const worker = await getOcrWorker();

      for (let i = 0; i < images.length; i++) {
        const pageNum = i + 1;
        const imageSource = images[i];

        onProgress?.({
          currentPage: pageNum,
          totalPages: images.length,
          statusText: `AI scanning page ${pageNum} of ${images.length}...`,
        });

        // Preprocess image for maximum handwriting contrast
        let processedSource: string = typeof imageSource === 'string' ? imageSource : '';
        try {
          processedSource = await preprocessImageForOcr(imageSource);
        } catch {
          processedSource = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
        }

        // Run recognition on this page
        const { data } = await worker.recognize(processedSource);
        const pageText = data?.text || '';
        const ocrConfidence = Math.round(data?.confidence || 0);

        allPagesText.push({
          page: pageNum,
          text: pageText,
          confidence: ocrConfidence,
        });

        // Run fuzzy verification matcher
        const matchResult = fuzzyMatchVerificationCode(pageText, cleanTarget);

        if (matchResult.isMatch) {
          onProgress?.({
            currentPage: pageNum,
            totalPages: images.length,
            statusText: `Code detected on page ${pageNum}!`,
          });

          return {
            codeFound: true,
            confidence: matchResult.confidence,
            matchedPage: pageNum,
            detectedSnippet: matchResult.snippet,
            scannedPagesCount: pageNum,
            allPagesText,
            isFuzzyMatch: matchResult.isFuzzy,
          };
        }
      }

      // If loop completed without positive match
      return {
        codeFound: false,
        confidence: allPagesText.length > 0 ? Math.max(...allPagesText.map((p) => p.confidence), 0) : 0,
        matchedPage: null,
        scannedPagesCount: images.length,
        allPagesText,
      };
    } catch (err: any) {
      console.warn('AI Notebook Verification encountered an issue:', err);
      return {
        codeFound: false,
        confidence: 0,
        matchedPage: null,
        scannedPagesCount: allPagesText.length,
        allPagesText,
        error: err?.message || 'AI verification service unavailable. Please visually verify.',
      };
    }
  },
};
