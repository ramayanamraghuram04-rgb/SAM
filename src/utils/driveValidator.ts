/**
 * Validates Google Drive sharing links for notebook assignment submissions.
 */

export interface DriveValidationResult {
  isValid: boolean;
  isGoogleDrive: boolean;
  errorMessage?: string;
  normalizedUrl?: string;
}

export function validateDriveUrl(rawUrl: string): DriveValidationResult {
  const url = (rawUrl || '').trim();

  if (!url) {
    return {
      isValid: false,
      isGoogleDrive: false,
      errorMessage: 'Please enter a link to your assignment on Google Drive.',
    };
  }

  // Check URL structure
  try {
    const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
    
    // Validate domain has dot
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('.')) {
      return {
        isValid: false,
        isGoogleDrive: false,
        errorMessage: 'Please enter a valid web link (e.g. https://drive.google.com/...)',
      };
    }

    // Check if it's from Google Drive or Google Docs
    const isGoogleDrive = 
      host === 'drive.google.com' ||
      host.endsWith('.drive.google.com') ||
      host === 'docs.google.com' ||
      host.endsWith('.docs.google.com');

    if (!isGoogleDrive) {
      return {
        isValid: true,
        isGoogleDrive: false,
        normalizedUrl: parsed.href,
        errorMessage: 'Notice: This link does not appear to be from drive.google.com. Please make sure anyone with the link can view your assignment photos.',
      };
    }

    return {
      isValid: true,
      isGoogleDrive: true,
      normalizedUrl: parsed.href,
    };
  } catch {
    return {
      isValid: false,
      isGoogleDrive: false,
      errorMessage: 'Please enter a valid web link (e.g. https://drive.google.com/...)',
    };
  }
}
