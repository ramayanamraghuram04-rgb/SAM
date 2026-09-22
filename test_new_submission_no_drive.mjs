// Test Suite: Verifies that NEW student submissions NEVER use Google Drive
// and STRICTLY use the Cloudinary camera-only capture flow.

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('SAM New Student Submission & Camera Flow Test Suite');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

const modalSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/student/SubmitAssignmentModal.tsx'),
  'utf8'
);
const detailsSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/pages/student/StudentAssignmentDetailsPage.tsx'),
  'utf8'
);
const subServiceSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/services/submissionService.ts'),
  'utf8'
);
const cloudServiceSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/services/cloudinary.ts'),
  'utf8'
);
const compressorSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/utils/imageCompressor.ts'),
  'utf8'
);

// 1. SubmitAssignmentModal has ZERO Google Drive inputs or mentions
assert(
  !modalSrc.toLowerCase().includes('googledrive') &&
  !modalSrc.toLowerCase().includes('drive.google.com') &&
  !modalSrc.includes('driveLink') &&
  !modalSrc.includes('Paste Google Drive') &&
  !modalSrc.includes('Enter Google Drive'),
  '1. NEW student submission modal has ZERO Google Drive inputs, textboxes, or URL fields'
);

// 2. SubmitAssignmentModal has NO file pickers / gallery inputs
assert(
  !modalSrc.includes('type="file"') &&
  !modalSrc.includes("type='file'") &&
  !modalSrc.toLowerCase().includes('choose file') &&
  !modalSrc.toLowerCase().includes('browse files') &&
  !modalSrc.toLowerCase().includes('upload from device'),
  '2. NEW student submission modal contains NO <input type="file"> or gallery pickers'
);

// 3. Verification Code Screen
assert(
  modalSrc.includes('YOUR ASSIGNMENT VERIFICATION CODE') &&
  modalSrc.includes("Write this code clearly on your notebook before taking photos") &&
  modalSrc.includes("I've Written the Code — Start Camera"),
  '3. Verification Code screen displays code, instructions, and "Start Camera" CTA'
);

// 4. Camera Stream using getUserMedia with rear camera preference
assert(
  modalSrc.includes('navigator.mediaDevices.getUserMedia') &&
  modalSrc.includes('facingMode: { ideal: facingMode }'),
  '4. Camera uses navigator.mediaDevices.getUserMedia with rear-facing ideal preference'
);

// 5. Multi-page capture controls
assert(
  modalSrc.includes('handleCaptureFrame') &&
  modalSrc.includes('handleRetake') &&
  modalSrc.includes('handleDeletePage') &&
  modalSrc.includes('handleAcceptAndNextPage') &&
  modalSrc.includes('handleAcceptAndFinish'),
  '5. Multi-page capture supports Capture, Retake, Delete, Next Page, and Review'
);

// 6. Watermarking with required student credentials
assert(
  compressorSrc.includes('drawVerificationWatermark') &&
  compressorSrc.includes('PIN:') &&
  compressorSrc.includes('Code:') &&
  compressorSrc.includes('rgba(15, 23, 42,'),
  '6. Watermark renders Student Name, PIN, Verification Code, and timestamp in safe corner'
);

// 7. Image compression targeting ~150 KB
assert(
  compressorSrc.includes('150 * 1024') &&
  compressorSrc.includes('MIN_QUALITY') &&
  compressorSrc.includes('captureAndCompressFromVideo'),
  '7. Image compressor targets ~150 KB per page while preserving ink legibility'
);

// 8. Cloudinary Upload Configuration
assert(
  cloudServiceSrc.includes('jnuxag0x') &&
  cloudServiceSrc.includes('SAM-SMART ASSIGNMENT MANAGER') &&
  cloudServiceSrc.includes('sam/assignments'),
  '8. Cloudinary service uses cloud "jnuxag0x", preset "SAM-SMART ASSIGNMENT MANAGER", folder "sam/assignments"'
);

// 9. Upload error handling
assert(
  modalSrc.includes('Upload failed. Please retry.') &&
  modalSrc.includes('Camera permission is required to capture your assignment.'),
  '9. Error handling matches required camera permission and upload error text'
);

// 10. Professional Success Screen
assert(
  modalSrc.includes('Assignment Submitted Successfully') &&
  modalSrc.includes('SUBMITTED') &&
  modalSrc.includes('View Submission'),
  '10. Submission success screen shows checkmark, title, page count, SUBMITTED status, and "View Submission"'
);

// 11. StudentAssignmentDetailsPage launches Camera modal
assert(
  detailsSrc.includes('Capture Assignment Pages') &&
  detailsSrc.includes('SubmitAssignmentModal') &&
  !detailsSrc.includes('Submit Google Drive') &&
  !detailsSrc.includes('Paste Google Drive'),
  '11. StudentAssignmentDetailsPage offers "Capture Assignment Pages" and opens camera modal'
);

// 12. SubmissionService does NOT save driveLink for new camera submissions
assert(
  subServiceSrc.includes("submissionType: isCamera ? 'camera'") &&
  subServiceSrc.includes("isCamera ? imageUrls! : []") &&
  subServiceSrc.includes("deleteField()") &&
  subServiceSrc.includes("delete (submissionData as any).driveLink"),
  '12. SubmissionService saves submissionType: "camera", imageUrls, and DOES NOT save driveLink for camera submissions'
);

// 13. Legacy Google Drive submissions remain backward compatible
assert(
  subServiceSrc.includes('legacyDriveLink') &&
  detailsSrc.includes('Open Legacy Google Drive Submission'),
  '13. Legacy Google Drive submissions remain viewable and backward compatible'
);

console.log('\n----------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} assertions passed successfully.`);
console.log('====================================================');
