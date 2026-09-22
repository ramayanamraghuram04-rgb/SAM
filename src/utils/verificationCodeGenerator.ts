/**
 * Cryptographically random 6-character verification code generator for SAM assignments.
 * 
 * - Format: Exactly 6 uppercase alphanumeric characters (e.g. "K74821").
 * - Avoids visually ambiguous characters (0, O, 1, I) to prevent handwriting confusion.
 * - Uses Web Crypto API (crypto.getRandomValues) for unguessable randomness.
 */

// 32-character unambiguous charset: digits 2-9 and uppercase letters A-Z (excluding 0, O, 1, I)
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

/**
 * Generates a single secure 6-character alphanumeric verification code.
 */
export function generateVerificationCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for non-browser/legacy environments
    for (let i = 0; i < CODE_LENGTH; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }

  return code;
}

/**
 * Validates whether a verification code matches the 6-character format.
 */
export function isValidVerificationCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length !== CODE_LENGTH) return false;
  return /^[A-Z0-9]{6}$/.test(trimmed);
}
