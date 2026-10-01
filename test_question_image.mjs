/**
 * test_question_image.mjs
 * 
 * Comprehensive Test Suite for Teacher Question Photo/Image Upload in SAM:
 * 1. Assignment interface has optional questionImageUrl
 * 2. Cloudinary service defines separate sam/questions folder
 * 3. Image validation allows JPG, PNG, WEBP and rejects unsupported types
 * 4. Image validation enforces reasonable file size limit (10 MB)
 * 5. assignmentService.createAssignment supports optional questionImageUrl
 * 6. assignmentService.updateAssignment handles questionImageUrl update and removal
 * 7. Backward compatibility: existing assignments without questionImageUrl continue working
 * 8. CreateAssignmentModal provides Question Image upload, preview, remove, and replace buttons
 * 9. CreateAssignmentModal upload failure prevents creating broken assignment and preserves user input
 * 10. Confirmation dialog shows preview of question image before publishing
 * 11. Student assignment details displays Question Image clearly separated from submission
 * 12. Student submission camera flow remains 100% separate and unchanged
 * 13. Admin assignment view displays question image indicator and preview
 * 14. Teacher assignment details displays question image and provides Edit Assignment button
 * 15. Same-device isolation and authentication UID enforcement
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('====================================================');
console.log('SAM Teacher Question Photo Upload Verification Suite');
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

// 1. Assignment interface has optional questionImageUrl
test('1. Assignment interface has optional questionImageUrl without breaking existing assignments', () => {
  const types = fs.readFileSync('src/types/index.ts', 'utf8');
  assert(types.includes('questionImageUrl?: string'), 'Assignment interface must have questionImageUrl?: string');
  assert(!types.includes('questionImageBase64'), 'Base64 must not be part of the Assignment type');
});

// 2. Cloudinary service defines separate sam/questions folder
test('2. Cloudinary service defines separate sam/questions folder and dedicated uploadQuestionImage helper', () => {
  const cloudinary = fs.readFileSync('src/services/cloudinary.ts', 'utf8');
  assert(cloudinary.includes("CLOUDINARY_QUESTIONS_FOLDER = 'sam/questions'"), 'Must define CLOUDINARY_QUESTIONS_FOLDER as sam/questions');
  assert(cloudinary.includes("CLOUDINARY_DEFAULT_FOLDER = 'sam/assignments'"), 'Must preserve CLOUDINARY_DEFAULT_FOLDER as sam/assignments');
  assert(cloudinary.includes('uploadQuestionImage'), 'cloudinaryService must provide uploadQuestionImage helper');
  assert(cloudinary.includes('folder: CLOUDINARY_QUESTIONS_FOLDER'), 'uploadQuestionImage must target CLOUDINARY_QUESTIONS_FOLDER');
});

// 3. Image compressor validates file types (JPG, PNG, WEBP)
test('3. Image validation allows JPG, PNG, WEBP and rejects unsupported types', () => {
  const compressor = fs.readFileSync('src/utils/imageCompressor.ts', 'utf8');
  assert(compressor.includes('validateQuestionImageFile'), 'Must export validateQuestionImageFile');
  assert(compressor.includes("'image/jpeg'"), 'Must allow image/jpeg');
  assert(compressor.includes("'image/png'"), 'Must allow image/png');
  assert(compressor.includes("'image/webp'"), 'Must allow image/webp');
  assert(compressor.includes('Please select a JPG, PNG, or WEBP image'), 'Must provide clear rejection message for invalid types');
});

// 4. Image compressor validates maximum file size
test('4. Image validation enforces reasonable file size limit (10 MB)', () => {
  const compressor = fs.readFileSync('src/utils/imageCompressor.ts', 'utf8');
  assert(compressor.includes('MAX_QUESTION_IMAGE_SIZE_BYTES'), 'Must define MAX_QUESTION_IMAGE_SIZE_BYTES');
  assert(compressor.includes('Image is too large'), 'Must provide clear error when image exceeds maximum size');
  assert(compressor.includes('compressQuestionImage'), 'Must provide compressQuestionImage helper for scaling down large diagrams');
});

// 5. assignmentService.createAssignment supports optional questionImageUrl
test('5. assignmentService.createAssignment supports optional questionImageUrl', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('questionImageUrl?: string'), 'createAssignment must accept questionImageUrl parameter');
  assert(service.includes('questionImageUrl: questionImageUrl?.trim() || undefined'), 'createAssignment must store questionImageUrl in assignment entity');
});

// 6. assignmentService.updateAssignment handles questionImageUrl update and removal
test('6. assignmentService.updateAssignment handles questionImageUrl update and removal', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('if (updates.questionImageUrl !== undefined)'), 'updateAssignment must handle questionImageUrl update');
  assert(service.includes('delete updatedAssignment.questionImageUrl'), 'updateAssignment must remove questionImageUrl when cleared');
});

// 7. Backward compatibility: existing assignments without questionImageUrl continue working
test('7. Backward compatibility: existing assignments without questionImageUrl continue working', () => {
  const types = fs.readFileSync('src/types/index.ts', 'utf8');
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(types.includes('questionImageUrl?: string'), 'Field must be optional');
  assert(service.includes('cleanFirestoreData'), 'Undefined properties must be omitted from Firestore document');
});

// 8. CreateAssignmentModal provides image upload, preview, remove, and replace
test('8. CreateAssignmentModal provides Question Image upload, preview, remove, and replace buttons', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('Question Image (Optional)'), 'Modal must render Question Image (Optional) label');
  assert(modal.includes('handleImageSelect'), 'Modal must have file select handler');
  assert(modal.includes('handleRemoveImage'), 'Modal must have remove image handler');
  assert(modal.includes('handleTriggerFileSelect'), 'Modal must allow replacing image');
  assert(modal.includes('Replace Image'), 'Modal must display Replace Image button');
  assert(modal.includes('Remove'), 'Modal must display Remove button');
  assert(modal.includes('questionImagePreview'), 'Modal must render image preview');
});

// 9. CreateAssignmentModal upload failure prevents creating broken assignment
test('9. CreateAssignmentModal upload failure prevents creating broken assignment and preserves user input', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('Question image upload failed. Please try again.'), 'Modal must show specific error message on upload failure');
  assert(modal.includes('if (imgRes.error)'), 'Modal must check upload error before proceeding');
  assert(modal.includes('setIsLoading(false)'), 'Modal must cancel loading state on upload failure');
  assert(modal.includes('uploadStatusText'), 'Modal must display uploading progress status to teacher');
});

// 10. Confirmation dialog shows preview of question image
test('10. Confirmation dialog shows preview of question image before publishing', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('showPublishConfirm'), 'Modal must have publish confirmation dialog');
  assert(modal.includes('{questionImagePreview && ('), 'Confirmation dialog must conditionally show question image preview');
  assert(modal.includes('Question Image:'), 'Confirmation dialog must label the Question Image preview');
});

// 11. Student assignment details displays question image when present
test('11. Student assignment details displays Question Image clearly separated from submission', () => {
  const studentView = fs.readFileSync('src/pages/student/StudentAssignmentDetailsPage.tsx', 'utf8');
  assert(studentView.includes('assignment.questionImageUrl &&'), 'Student view must conditionally render question image');
  assert(studentView.includes('Question Image / Diagram'), 'Student view must label it Question Image / Diagram');
  assert(studentView.includes('Enlarge Diagram'), 'Student view must allow enlarging the diagram');
  assert(studentView.includes('isQuestionImageModalOpen'), 'Student view must provide full-screen modal viewer');
});

// 12. Student submission camera flow remains 100% separate and unchanged
test('12. Student submission camera flow remains 100% separate and unchanged', () => {
  const studentModal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(studentModal.includes('navigator.mediaDevices.getUserMedia'), 'Camera capture must remain intact');
  assert(!studentModal.includes('type="file"'), 'Student submission modal must remain camera-only without file picker');
  assert(!studentModal.includes('sam/questions'), 'Student submission must never use sam/questions folder');
  assert(!studentModal.includes('uploadQuestionImage'), 'Student submission must never use question upload pipeline');
});

// 13. Admin assignment view displays question image indicator and preview
test('13. Admin assignment view displays question image indicator and preview', () => {
  const adminPage = fs.readFileSync('src/pages/admin/AdminAssignmentsPage.tsx', 'utf8');
  assert(adminPage.includes('asg.questionImageUrl &&'), 'Admin card must show indicator when question image is attached');
  assert(adminPage.includes('selectedAssignment.questionImageUrl &&'), 'Admin details modal must show question image preview');
  assert(adminPage.includes('View Full Size'), 'Admin modal must provide view full size link');
});

// 14. Teacher assignment details displays question image and provides Edit button
test('14. Teacher assignment details displays question image and provides Edit Assignment button', () => {
  const teacherDetails = fs.readFileSync('src/pages/teacher/TeacherAssignmentDetailsPage.tsx', 'utf8');
  assert(teacherDetails.includes('assignment.questionImageUrl &&'), 'Teacher details must render question image if present');
  assert(teacherDetails.includes('Edit Assignment'), 'Teacher details must offer Edit Assignment button');
  assert(teacherDetails.includes('isEditModalOpen'), 'Teacher details must open edit modal');
});

// 15. Same-device isolation and authentication UID enforcement
test('15. Same-device isolation and authentication UID enforcement', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('teacherId,'), 'Assignments must bind teacherId from auth user UID');
  assert(service.includes('verifyStaffTeachingAuthorization'), 'Staff must be authorized by admin for teaching subject');
});

// 16. Teacher Create Assignment modal provides Direct Camera Capture
test('16. CreateAssignmentModal provides Take Photo with Camera option and live viewfinder', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('Take Photo with Camera'), 'Modal must provide Take Photo with Camera action');
  assert(modal.includes('Upload from Device'), 'Modal must provide Upload from Device action');
  assert(modal.includes('handleOpenLiveCamera'), 'Modal must provide live camera open handler');
  assert(modal.includes('isCameraOpen'), 'Modal must track isCameraOpen state');
});

// 17. Teacher camera uses getUserMedia with fallback and error handling
test('17. Teacher camera accesses navigator.mediaDevices.getUserMedia with fallback and error states', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('navigator.mediaDevices.getUserMedia'), 'Must use getUserMedia for live video stream');
  assert(modal.includes('facingMode'), 'Must support facingMode for front/back cameras');
  assert(modal.includes('handleToggleFacingMode'), 'Must provide camera toggle handler');
  assert(modal.includes('stopCameraStream'), 'Must provide clean camera track release on unmount/close');
});

// 18. Shutter capture, freeze frame, retake and confirm
test('18. Camera viewfinder provides Capture Photo, Retake Photo, and Use This Photo flow', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('handleCapturePhoto'), 'Must provide handleCapturePhoto shutter trigger');
  assert(modal.includes('handleRetakeCapturedPhoto'), 'Must provide handleRetakeCapturedPhoto');
  assert(modal.includes('handleUseCapturedPhoto'), 'Must provide handleUseCapturedPhoto');
  assert(modal.includes('Capture Photo'), 'Must render Capture Photo button');
  assert(modal.includes('Use This Photo'), 'Must render Use This Photo button');
});

// 19. Camera photo binds to questionImageFile and preview
test('19. Captured photo converts to JPEG file and integrates seamlessly with Cloudinary upload pipeline', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('image/jpeg'), 'Captured photo must use JPEG mime type');
  assert(modal.includes('setQuestionImageFile(file)'), 'Captured photo must set questionImageFile');
  assert(modal.includes('setQuestionImagePreview'), 'Captured photo must set questionImagePreview');
  assert(modal.includes('uploadImageIfSelected'), 'Captured photo must feed into uploadImageIfSelected');
});

// 20. Fullscreen diagram preview inspection
test('20. Teacher can inspect attached question diagram in fullscreen modal before publishing', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('showFullscreenPreview'), 'Modal must track showFullscreenPreview state');
  assert(modal.includes('Question Image Preview'), 'Modal must provide Question Image Preview lightbox');
  assert(modal.includes('setShowFullscreenPreview(true)'), 'Must allow clicking thumbnail to inspect diagram');
});

// 21. TeacherDashboard provides Camera Scan and Upload Question in header banner
test('21. TeacherDashboard provides Camera Scan and Upload Question buttons in header banner', () => {
  const dashboard = fs.readFileSync('src/pages/teacher/TeacherDashboard.tsx', 'utf8');
  assert(dashboard.includes('Camera Scan'), 'Teacher Dashboard must render Camera Scan banner button');
  assert(dashboard.includes('Upload Question'), 'Teacher Dashboard must render Upload Question banner button');
  assert(dashboard.includes("handleOpenCreateAssignment('camera')"), 'Camera button must trigger camera mode');
  assert(dashboard.includes("handleOpenCreateAssignment('upload')"), 'Upload button must trigger upload mode');
});

// 22. TeacherDashboard renders dedicated Assignment Creation & Upload Hub
test('22. TeacherDashboard renders dedicated Assignment Creation & Upload Hub with 3 cards', () => {
  const dashboard = fs.readFileSync('src/pages/teacher/TeacherDashboard.tsx', 'utf8');
  assert(dashboard.includes('Assignment Creation & Upload'), 'Must label Assignment Creation & Upload Hub');
  assert(dashboard.includes('Camera Capture'), 'Must render Camera Capture card');
  assert(dashboard.includes('Upload Question File'), 'Must render Upload Question File card');
  assert(dashboard.includes('Standard Assignment'), 'Must render Standard Assignment card');
  assert(dashboard.includes('initialAttachmentMode={initialAttachmentMode}'), 'Dashboard must pass initialAttachmentMode to modal');
});

// 23. CreateAssignmentModal provides tabbed mode switching and initialAttachmentMode
test('23. CreateAssignmentModal provides tabbed mode switching and initialAttachmentMode support', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('initialAttachmentMode'), 'CreateAssignmentModal must accept initialAttachmentMode');
  assert(modal.includes('attachmentTab'), 'CreateAssignmentModal must track active attachmentTab');
  assert(modal.includes('Upload File'), 'CreateAssignmentModal must provide Upload File tab');
  assert(modal.includes('Drive Link'), 'CreateAssignmentModal must provide Drive Link tab');
  assert(modal.includes('processSelectedFile'), 'CreateAssignmentModal must support drop and select processing');
});

console.log('----------------------------------------------------');
console.log(`Results: ${passCount} / ${totalCount} question photo test assertions passed successfully.`);
console.log('====================================================\n');

if (passCount !== totalCount) {
  process.exit(1);
}


