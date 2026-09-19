/**
 * Validates and normalizes college student PINs (e.g. "24170-CM-001").
 */

export function normalizePIN(pin: string): string {
  if (!pin) return '';
  return pin.trim().toUpperCase();
}

export function isValidStudentPIN(pin: string): boolean {
  const normalized = normalizePIN(pin);
  // Standard diploma PIN: typically digits followed by dash, branch code (e.g. CM / CS), dash, serial digits
  // Allows 5 to 20 chars with alphanumeric characters and hyphens
  if (normalized.length < 5 || normalized.length > 25) return false;
  return /^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(normalized);
}

/**
 * Maps student PIN to a secure internal email for Firebase Auth.
 * Students never see or interact with this email.
 */
export function studentPinToEmail(pin: string): string {
  const normalized = normalizePIN(pin);
  // Sanitize non-alphanumeric chars for email username
  const sanitized = normalized.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `student_${sanitized}@sam.internal`;
}
