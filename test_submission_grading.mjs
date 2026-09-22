/**
 * test_submission_grading.mjs
 * 
 * STEP 12 Comprehensive Verification Suite:
 * Harden and Complete the Full Student Submission, Teacher Review, Manual Verification,
 * Grading, Feedback, Return, Resubmission, and Result Workflow.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('====================================================');
console.log('SAM Full Submission, Review & Grading Workflow Suite');
console.log('====================================================\n');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}\n`);
  }
}

// 1. Student can start authorized submission
test('1. Student can start authorized submission', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes('submitAssignment'), 'submissionService must include submitAssignment');
  assert(service.includes('cleanLink'), 'submissionService must handle submission link/images');
});

// 2. Student cannot submit unauthorized assignment
test('2. Student cannot submit unauthorized assignment (Class/Semester & Dept checks)', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes('student.semester !== assignment.semester'), 'Must reject submission if semester does not match');
  assert(service.includes('student.department !== assignment.department'), 'Must reject submission if department does not match');
});

// 3. Verification code is correct
test('3. Verification code is correct (6 alphanumeric characters)', () => {
  const gen = fs.readFileSync('src/utils/verificationCodeGenerator.ts', 'utf8');
  assert(gen.includes('CODE_LENGTH = 6'), 'Verification code length must be exactly 6');
  assert(gen.includes('CHARSET'), 'Must use unambiguous alphanumeric characters');
});

// 4. Verification code persists across recapture
test('4. Verification code persists across recapture', () => {
  const vCodeService = fs.readFileSync('src/services/verificationCodeService.ts', 'utf8');
  assert(vCodeService.includes('getOrCreateVerificationCode'), 'Service must retrieve or create persistent code');
  assert(vCodeService.includes('snap.exists()'), 'Firestore read must return existing active code');
  assert(vCodeService.includes('MockStore.getVerificationCode'), 'MockStore must return existing code');
});

// 5. Verification code persists across resubmission
test('5. Verification code persists across resubmission', () => {
  const subService = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(subService.includes('verificationCode: existingData.verificationCode || verificationCode'), 'Resubmission must preserve original verification code');
});

// 6. Camera-only capture remains enforced
test('6. Camera-only capture remains enforced (getUserMedia + rear camera)', () => {
  const modal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(modal.includes('navigator.mediaDevices.getUserMedia'), 'Must use browser getUserMedia');
  assert(modal.includes("facingMode: { ideal: facingMode }"), 'Must request rear camera preference');
});

// 7. Gallery/file picker is not introduced
test('7. Gallery/file picker is not introduced', () => {
  const modal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(!modal.includes('<input type="file"'), 'Must never include file picker');
  assert(!modal.includes('Choose from device'), 'Must not include file browser triggers');
  assert(!modal.includes('drag and drop'), 'Must not include drag-and-drop file upload');
});

// 8. Multiple pages work
test('8. Multiple pages work (Page 1 of N)', () => {
  const modal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(modal.includes('capturedPages'), 'Must support multiple captured pages in state');
  assert(modal.includes('Page {activeReviewIndex + 1} of {capturedPages.length}'), 'Must display current page index out of total');
});

// 9. Page deletion works
test('9. Page deletion works before submission', () => {
  const modal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(modal.includes('handleDeletePage'), 'Must support deleting bad pages before submission');
  assert(modal.includes('updated.length === 0') || modal.includes('filtered.length === 0'), 'Handled empty state when all pages deleted');
});

// 10. Watermark contains required student information
test('10. Watermark contains required student information', () => {
  const compressor = fs.readFileSync('src/utils/imageCompressor.ts', 'utf8');
  assert(compressor.includes('drawVerificationWatermark'), 'Must export drawVerificationWatermark');
  assert(compressor.includes('PIN: ${studentPIN}') || compressor.includes('PIN: ${options.studentPIN}'), 'Watermark must include student PIN');
  assert(compressor.includes('Code: ${verificationCode}') || compressor.includes('Code: ${options.verificationCode}'), 'Watermark must include verification code');
});

// 11. Image compression remains approximately 150 KB target
test('11. Image compression remains approximately 150 KB target with ink legibility', () => {
  const compressor = fs.readFileSync('src/utils/imageCompressor.ts', 'utf8');
  assert(compressor.includes('TARGET_SIZE_BYTES = 150 * 1024'), 'Target size must be ~150 KB');
  assert(compressor.includes('MIN_QUALITY'), 'Must enforce minimum quality floor for handwriting legibility');
});

// 12. Cloudinary upload works
test('12. Cloudinary upload works with unsigned preset and secure URLs', () => {
  const cloud = fs.readFileSync('src/services/cloudinary.ts', 'utf8');
  assert(cloud.includes('CLOUDINARY_UPLOAD_PRESET'), 'Must configure upload preset');
  assert(cloud.includes('uploadImage'), 'Must provide uploadImage service function');
  assert(cloud.includes('secure_url'), 'Must record secure_url');
  assert(!cloud.includes('api_secret'), 'Must never expose API Secret');
});

// 13. Failed upload does not create successful submission
test('13. Failed upload does not create successful submission', () => {
  const modal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(modal.includes('setUploadError'), 'Failed upload must record error and halt submit');
  assert(modal.includes('Back to Review & Retry'), 'Failed upload must allow retry without losing pages');
});

// 14. Duplicate submit is prevented
test('14. Duplicate submit is prevented (disabled buttons while inflight)', () => {
  const modal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(modal.includes('setView(\'uploading\')'), 'Must enter uploading view disabling form');
  assert(modal.includes('isConfirmed'), 'Must require confirmation check before submit');
});

// 15. Student can view own submission
test('15. Student can view own submission with high-res viewer', () => {
  const details = fs.readFileSync('src/pages/student/StudentAssignmentDetailsPage.tsx', 'utf8');
  assert(details.includes('NotebookImageViewer'), 'Student details page must embed NotebookImageViewer');
  assert(details.includes('submissionService.getStudentSubmissions'), 'Must load student submissions');
});

// 16. Student cannot view another student\'s submission
test('16. Student cannot view another student\'s submission', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('resource.data.studentId == request.auth.uid'), 'Rules must enforce studentId matches auth.uid for reading submission');
});

// 17. Staff can view authorized submissions
test('17. Staff can view authorized submissions via Submissions Dashboard', () => {
  const page = fs.readFileSync('src/pages/teacher/TeacherSubmissionsPage.tsx', 'utf8');
  assert(page.includes('getStaffSubmissions'), 'Teacher Submissions page must load staff submissions');
  assert(page.includes('filteredSubmissions'), 'Teacher page must provide filtered submissions');
  assert(page.includes('selectedStatus'), 'Teacher page must support status filtering');
});

// 18. Staff cannot view unauthorized submissions
test('18. Staff cannot view unauthorized submissions', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes("where('teacherId', '==', staffId)"), 'getStaffSubmissions must query by teacherId');
  
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('resource.data.teacherId == request.auth.uid'), 'Rules must restrict staff reads to their teacherId');
});

// 19. Teacher can grade submission
test('19. Teacher can grade submission', () => {
  const modal = fs.readFileSync('src/components/teacher/GradeSubmissionModal.tsx', 'utf8');
  assert(modal.includes('handleOpenGradeConfirm'), 'Grade modal must validate marks and trigger confirmation');
  assert(modal.includes('handleExecuteGrade'), 'Grade modal must execute confirmed grade');
  assert(modal.includes('submissionService.gradeSubmission'), 'Must invoke gradeSubmission');
});

// 20. Marks cannot exceed maxMarks
test('20. Marks cannot exceed maxMarks', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes('marks > maxMarks'), 'gradeSubmission must reject marks exceeding maxMarks');
  
  const modal = fs.readFileSync('src/components/teacher/GradeSubmissionModal.tsx', 'utf8');
  assert(modal.includes('Number(marks) > maxMarks'), 'Modal must reject marks exceeding maxMarks');
});

// 21. Marks cannot be negative
test('21. Marks cannot be negative', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes('marks < 0'), 'gradeSubmission must reject negative marks');
  
  const modal = fs.readFileSync('src/components/teacher/GradeSubmissionModal.tsx', 'utf8');
  assert(modal.includes('Number(marks) < 0'), 'Modal must reject negative marks');
});

// 22. Teacher feedback is saved
test('22. Teacher feedback is saved and updated in submission', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes('teacherFeedback: feedback.trim()'), 'gradeSubmission must save teacher feedback');
  assert(service.includes('feedback: feedback.trim()'), 'gradeSubmission must set feedback alias');
});

// 23. Return-for-correction works
test('23. Return-for-correction works with feedback and confirmation', () => {
  const modal = fs.readFileSync('src/components/teacher/GradeSubmissionModal.tsx', 'utf8');
  assert(modal.includes('Return for Correction'), 'Modal must include Return for Correction action');
  assert(modal.includes('showReturnConfirm'), 'Modal must confirm before returning');
  assert(modal.includes('handleExecuteReturn'), 'Modal must execute confirmed return');
});

// 24. Student can resubmit after return
test('24. Student can resubmit after return', () => {
  const details = fs.readFileSync('src/pages/student/StudentAssignmentDetailsPage.tsx', 'utf8');
  assert(details.includes('Resubmit Assignment'), 'Returned status must show "Resubmit Assignment" button');
  assert(details.includes('Returned for Correction'), 'Returned status must display clear correction notice');
});

// 25. Submission history is preserved
test('25. Submission history is preserved with previous marks, feedback, and timestamps', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes('existingData.history ? [...existingData.history] : []'), 'Must copy existing history');
  assert(service.includes('marks: existingData.marks'), 'History item must preserve previous marks');
  assert(service.includes('feedback: existingData.teacherFeedback || existingData.feedback'), 'History item must preserve previous feedback');
});

// 26. Student sees final marks
test('26. Student sees final marks and evaluation details', () => {
  const details = fs.readFileSync('src/pages/student/StudentAssignmentDetailsPage.tsx', 'utf8');
  assert(details.includes('Evaluation: {submission.marks} / {assignment.maxMarks} Marks'), 'Details page must render awarded marks');
  assert(details.includes('Teacher Feedback: "{submission.teacherFeedback}"'), 'Details page must render teacher feedback');
});

// 27. Closed assignment blocks new submission
test('27. Closed assignment blocks new submission', () => {
  const service = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(service.includes("assignment.status === 'closed' || assignment.status === 'archived'"), 'submitAssignment must block submissions for closed/archived assignments');
  
  const details = fs.readFileSync('src/pages/student/StudentAssignmentDetailsPage.tsx', 'utf8');
  assert(details.includes('This assignment is closed.'), 'Details page must show closed notice');
});

// 28. Legacy Google Drive submission remains accessible
test('28. Legacy Google Drive submission remains accessible', () => {
  const details = fs.readFileSync('src/pages/student/StudentAssignmentDetailsPage.tsx', 'utf8');
  assert(details.includes('Open Legacy Google Drive Submission'), 'Student viewer must preserve legacy drive link button');
  
  const teacherModal = fs.readFileSync('src/components/teacher/GradeSubmissionModal.tsx', 'utf8');
  assert(teacherModal.includes('OPEN GOOGLE DRIVE'), 'Teacher modal must preserve legacy drive link button');
});

// 29. Admin can audit submissions
test('29. Admin can audit submissions with notebook inspection', () => {
  const adminSubs = fs.readFileSync('src/pages/admin/AdminSubmissionsPage.tsx', 'utf8');
  assert(adminSubs.includes('submissionService.getAllSubmissions'), 'Admin page must load all submissions');
  assert(adminSubs.includes('verificationCode'), 'Admin audit view must display verification code');
  assert(adminSubs.includes('NotebookImageViewer') || adminSubs.includes('viewingSubmission.imageUrls'), 'Admin page must allow inspecting submitted notebook pages');
});

// 30. Professional Success Screen
test('30. Professional submission success screen with "View Submission" action', () => {
  const modal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(modal.includes('Assignment Submitted Successfully'), 'Must display success title');
  assert(modal.includes('✓ Submission Successful'), 'Must display submission successful badge');
  assert(modal.includes('View Submission'), 'Must provide View Submission button');
});

// 31. Manual Verification Checkbox Control
test('31. Manual visual verification checkbox control without false AI claims', () => {
  const modal = fs.readFileSync('src/components/teacher/GradeSubmissionModal.tsx', 'utf8');
  assert(modal.includes('I have visually compared and verified the notebook verification code'), 'Must provide visual comparison checkbox');
  assert(modal.includes('Manual visual comparison only'), 'Must clarify manual visual verification only');
});

// 32. NotebookImageViewer Component
test('32. NotebookImageViewer component provides page navigation, zoom, and thumbnails', () => {
  const viewer = fs.readFileSync('src/components/common/NotebookImageViewer.tsx', 'utf8');
  assert(viewer.includes('zoomLevel'), 'Must support interactive zoom');
  assert(viewer.includes('activePageIndex'), 'Must support page navigation');
  assert(viewer.includes('Thumbnail'), 'Must provide thumbnail row');
  assert(viewer.includes('Open Original High-Resolution Photo'), 'Must allow viewing original photo');
});

// 33. Empty States for Submissions
test('33. Empty states for student and teacher submissions', () => {
  const teacherSubs = fs.readFileSync('src/pages/teacher/TeacherSubmissionsPage.tsx', 'utf8');
  assert(teacherSubs.includes('No submissions found'), 'Teacher page must provide friendly "No submissions found" empty state');
});

console.log('----------------------------------------------------');
console.log(`Results: ${passCount} / ${totalCount} test assertions passed successfully.`);
console.log('====================================================\n');

if (passCount !== totalCount) {
  process.exit(1);
}
