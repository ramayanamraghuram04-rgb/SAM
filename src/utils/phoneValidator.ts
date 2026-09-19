/**
 * Validates and normalizes Indian 10-digit mobile numbers for teachers.
 */

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Remove leading 91 or 0 if it's a 12 or 11 digit input
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  
  return digits;
}

export function isValidIndianMobile(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  // Indian mobile numbers must be 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Maps teacher mobile number to a secure internal email for Firebase Auth.
 * Teachers never see or interact with this email.
 */
export function teacherPhoneToEmail(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `teacher_${cleaned}@sam.internal`;
}
