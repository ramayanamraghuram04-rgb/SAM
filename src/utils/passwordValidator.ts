/**
 * Password Policy and Strength Validation Utility for SAM
 *
 * Requirements:
 * - Minimum length: 6 characters (enforced by Firebase Auth)
 * - Current password required for reauthentication
 * - New password must not equal current password
 * - Confirm password must match new password
 * - Strength indicators: Weak / Medium / Strong
 */

export interface PasswordStrength {
  score: 'weak' | 'medium' | 'strong';
  label: string;
  color: string;
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(pwd);

  let score: 'weak' | 'medium' | 'strong' = 'weak';
  let label = 'Weak';
  let color = 'text-rose-600 bg-rose-500';

  if (hasMinLength) {
    const varietyCount = (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecialChar ? 1 : 0);
    if (pwd.length >= 8 && varietyCount >= 2) {
      score = 'strong';
      label = 'Strong';
      color = 'text-emerald-600 bg-emerald-500';
    } else if (varietyCount >= 2 || pwd.length >= 8) {
      score = 'medium';
      label = 'Medium';
      color = 'text-amber-600 bg-amber-500';
    } else {
      score = 'weak';
      label = 'Weak';
      color = 'text-rose-600 bg-rose-500';
    }
  }

  return {
    score,
    label,
    color,
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSpecialChar,
  };
}

export interface PasswordValidationResult {
  isValid: boolean;
  error: string | null;
}

export function validatePasswordChange(params: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): PasswordValidationResult {
  const { currentPassword, newPassword, confirmPassword } = params;

  if (!currentPassword) {
    return { isValid: false, error: 'Current password is required.' };
  }

  if (!newPassword) {
    return { isValid: false, error: 'New password is required.' };
  }

  if (newPassword.length < 6) {
    return { isValid: false, error: 'New password must be at least 6 characters long.' };
  }

  if (newPassword === currentPassword) {
    return { isValid: false, error: 'New password cannot be the same as your current password.' };
  }

  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your new password.' };
  }

  if (newPassword !== confirmPassword) {
    return { isValid: false, error: 'New password and confirm password do not match.' };
  }

  return { isValid: true, error: null };
}
