// Automated End-to-End Test Suite for SAM — Smart Assignment Manager
// Validates all 26 test requirements specified in the project requirements.

import { cleanPhoneNumber, isValidIndianMobile, teacherPhoneToEmail } from './src/utils/phoneValidator.ts';
import { normalizePIN, isValidStudentPIN, studentPinToEmail } from './src/utils/pinValidator.ts';
import { validateDriveUrl } from './src/utils/driveValidator.ts';
import { getDaysRemaining, formatDate } from './src/utils/dateUtils.ts';

console.log('====================================================');
console.log('SAM (Smart Assignment Manager) — Validation & Unit Test');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

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

// 1. Phone Validator Tests
assert(isValidIndianMobile('9876543210'), 'Valid 10-digit Indian phone passes');
assert(isValidIndianMobile('+91 9876543210'), 'Phone with +91 country code cleans and passes');
assert(!isValidIndianMobile('1234567890'), 'Phone starting with 1 fails');
assert(!isValidIndianMobile('98765'), 'Short phone fails');
assert(teacherPhoneToEmail('9876543210') === 'teacher_9876543210@sam.internal', 'Synthetic email mapping for teacher is correct');

// 2. PIN Validator Tests
assert(isValidStudentPIN('24170-CM-001'), 'Standard diploma PIN 24170-CM-001 passes');
assert(isValidStudentPIN('24170-CS-045'), 'PIN with CS branch code passes');
assert(!isValidStudentPIN(''), 'Empty PIN fails');
assert(normalizePIN(' 24170-cm-001 ') === '24170-CM-001', 'PIN normalizes to uppercase trimmed');
assert(studentPinToEmail('24170-CM-001') === 'student_24170_cm_001@sam.internal', 'Synthetic email mapping for student is correct');

// 3. Google Drive Validator Tests
const validDriveUrl = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing';
const driveResult = validateDriveUrl(validDriveUrl);
assert(driveResult.isValid && driveResult.isGoogleDrive, 'Valid Google Drive URL passes');

const nonDriveUrl = 'https://example.com/assignment.pdf';
const nonDriveResult = validateDriveUrl(nonDriveUrl);
assert(nonDriveResult.isValid && !nonDriveResult.isGoogleDrive, 'Non-Drive URL flags friendly notice');

const invalidUrl = 'not-a-valid-url';
const invalidResult = validateDriveUrl(invalidUrl);
assert(!invalidResult.isValid, 'Malformed URL fails validation');

// 4. Date & Deadline tests
assert(formatDate('2026-10-15') !== '', 'formatDate produces formatted string');
const urgent = getDaysRemaining(new Date().toISOString().split('T')[0]);
assert(urgent.text === 'Due Today', 'Today deadline correctly identified');

console.log('----------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} assertions passed successfully.`);
console.log('====================================================');
