import { CloudinaryUploadResult } from '../types';

// Environment variable resolution with safe fallbacks
const env: Record<string, any> = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env) 
    ? (import.meta as any).env 
    : ((globalThis as any)?.process?.env || {});

export const CLOUDINARY_CLOUD_NAME = 
  (env.VITE_CLOUDINARY_CLOUD_NAME || 'jnuxag0x').trim();

export const CLOUDINARY_UPLOAD_PRESET = 
  (env.VITE_CLOUDINARY_UPLOAD_PRESET || 'SAM-SMART ASSIGNMENT MANAGER').trim();

export const CLOUDINARY_DEFAULT_FOLDER = 'sam/assignments';

// Maximum upload file size: 15MB
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

// Allowed MIME types for assignment documents and photos
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  onProgress?: (percent: number) => void;
  timeoutMs?: number;
  fileName?: string;
}

export class CloudinaryUploadError extends Error {
  public readonly code: 'NETWORK_ERROR' | 'CLOUDINARY_REJECTED' | 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'TIMEOUT' | 'CONFIG_ERROR';
  public readonly httpStatus?: number;
  public readonly rawDetails?: any;

  constructor(
    message: string, 
    code: 'NETWORK_ERROR' | 'CLOUDINARY_REJECTED' | 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'TIMEOUT' | 'CONFIG_ERROR',
    httpStatus?: number,
    rawDetails?: any
  ) {
    super(message);
    this.name = 'CloudinaryUploadError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.rawDetails = rawDetails;
  }
}

/**
 * Validates file size and image MIME type prior to network transmission
 */
export function validateImageFile(file: Blob | File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No image file provided.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      isValid: false, 
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 15 MB.` 
    };
  }

  // If MIME type is present, verify against allowed list
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    // Some mobile devices use application/octet-stream for camera photos, so only reject if recognized non-image
    if (!file.type.startsWith('image/')) {
      return { 
        isValid: false, 
        error: `Invalid file format (${file.type}). Please upload a JPEG, PNG, or WebP photo.` 
      };
    }
  }

  return { isValid: true };
}

/**
 * Reusable Cloudinary Upload Service
 * 
 * - Unsigned client-side upload directly to Cloudinary
 * - Zero exposure of API Secret in frontend / PWA
 * - Stores images neatly under 'sam/assignments'
 * - Reports upload progress percentages for smooth PWA feedback
 */
export const cloudinaryService = {
  /**
   * Check if Cloudinary cloud name and preset are configured
   */
  isConfigured(): boolean {
    return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
  },

  /**
   * Get safe public configuration details (No secrets)
   */
  getConfig() {
    return {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      folder: CLOUDINARY_DEFAULT_FOLDER,
      isConfigured: this.isConfigured(),
    };
  },

  /**
   * Upload an image Blob or File to Cloudinary with progress & timeout support
   */
  async uploadImage(
    file: Blob | File,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    const cloudName = CLOUDINARY_CLOUD_NAME;
    const preset = CLOUDINARY_UPLOAD_PRESET;
    const folder = options.folder || CLOUDINARY_DEFAULT_FOLDER;
    const timeoutMs = options.timeoutMs || 45000; // 45s default timeout

    if (!cloudName || !preset) {
      throw new CloudinaryUploadError(
        'Cloudinary is not configured. Missing cloud name or upload preset.',
        'CONFIG_ERROR'
      );
    }

    // 1. Client-side pre-validation
    const val = validateImageFile(file);
    if (!val.isValid) {
      const code = (file && file.size > MAX_FILE_SIZE_BYTES) ? 'FILE_TOO_LARGE' : 'INVALID_FILE';
      throw new CloudinaryUploadError(val.error || 'Invalid file', code);
    }

    // 2. Prepare FormData
    const formData = new FormData();
    const fileName = options.fileName || (file instanceof File ? file.name : `assignment_${Date.now()}.jpg`);
    formData.append('file', file, fileName);
    formData.append('upload_preset', preset);
    formData.append('folder', folder);

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    // 3. Upload via XMLHttpRequest to support upload progress on Mobile & PWA
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.timeout = timeoutMs;

      // Track progress
      if (options.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            options.onProgress?.(percent);
          }
        };
      }

      // Handle successful HTTP response or Cloudinary rejection
      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText || '{}');

          if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
            // Success: map to strongly typed CloudinaryUploadResult
            const result: CloudinaryUploadResult = {
              secure_url: response.secure_url,
              public_id: response.public_id,
              resource_type: response.resource_type || 'image',
              width: Number(response.width) || 0,
              height: Number(response.height) || 0,
              bytes: Number(response.bytes) || 0,
              format: response.format || 'jpg',
              created_at: response.created_at,
              original_filename: response.original_filename,
            };
            resolve(result);
          } else {
            // Cloudinary API returned an error
            const serverMessage = response.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`;
            reject(
              new CloudinaryUploadError(
                serverMessage,
                'CLOUDINARY_REJECTED',
                xhr.status,
                response
              )
            );
          }
        } catch (parseErr) {
          reject(
            new CloudinaryUploadError(
              `Failed to parse Cloudinary response: ${xhr.responseText.slice(0, 100)}`,
              'CLOUDINARY_REJECTED',
              xhr.status
            )
          );
        }
      };

      // Handle network errors
      xhr.onerror = () => {
        reject(
          new CloudinaryUploadError(
            'Network failure during Cloudinary upload. Please check your internet connection.',
            'NETWORK_ERROR'
          )
        );
      };

      // Handle timeout
      xhr.ontimeout = () => {
        reject(
          new CloudinaryUploadError(
            `Upload timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`,
            'TIMEOUT'
          )
        );
      };

      xhr.send(formData);
    });
  },

  /**
   * Verifies the Cloudinary connection with a lightweight 1x1 test image
   */
  async testConnection(): Promise<{ success: boolean; secure_url?: string; error?: string }> {
    try {
      // 1x1 transparent PNG pixel base64
      const testPixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = await fetch(testPixelBase64);
      const blob = await res.blob();

      const uploadResult = await this.uploadImage(blob, {
        folder: 'sam/assignments/health_check',
        fileName: 'sam_cloudinary_ping.png'
      });

      return {
        success: true,
        secure_url: uploadResult.secure_url
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err)
      };
    }
  }
};
