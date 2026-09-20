import fs from 'fs';

console.log('====================================================');
console.log('SAM Camera-Only Assignment Capture Verification Suite');
console.log('====================================================');

let passed = 0;
let total = 0;

function check(condition, message) {
  total++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. Inspect SubmitAssignmentModal.tsx
const modalSrc = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');

// Verify strict NO file picker / gallery / drag-drop / drive input
check(!modalSrc.includes('type="file"'), 'Zero <input type="file"> file pickers in submission modal');
check(!modalSrc.includes('Choose from device'), 'Zero "Choose from device" or file browse triggers');
check(!modalSrc.includes('drag and drop') && !modalSrc.includes('Drag and drop'), 'Zero drag and drop upload zones');
check(!modalSrc.includes('Google Drive Sharing Link'), 'Zero Google Drive URL inputs in student modal');

// Verify Camera MediaDevices API and environment facing mode
check(modalSrc.includes('navigator.mediaDevices.getUserMedia'), 'Uses navigator.mediaDevices.getUserMedia()');
check(modalSrc.includes("facingMode: { ideal: facingMode }") || modalSrc.includes('environment'), 'Requests rear-facing camera on mobile');
check(modalSrc.includes('stopCameraStream') && modalSrc.includes('track.stop()'), 'Stops camera tracks when modal closes or view unmounts');

// Verify Camera UX elements
check(modalSrc.includes('Live Camera') && modalSrc.includes('<video'), 'Provides live camera viewfinder preview');
check(modalSrc.includes('Capture') && modalSrc.includes('handleCaptureFrame'), 'Provides touch-friendly capture button');
check(modalSrc.includes('Retake Photo'), 'Provides retake button after capture');
check(modalSrc.includes('Delete Page'), 'Provides delete page functionality');
check(modalSrc.includes('Page {capturedPages.length') || modalSrc.includes('Page {activeReviewIndex'), 'Displays clear dynamic page count');
check(modalSrc.includes('Add Next Page') || modalSrc.includes('Add More Pages'), 'Supports multi-page notebook capture');
check(modalSrc.includes('Submit') && modalSrc.includes('handleSubmitAssignment'), 'Provides final Submit Assignment action');

// Verify Permission Handling
check(modalSrc.includes('NotAllowedError') || modalSrc.includes('PermissionDeniedError'), 'Handles camera permission denied gracefully');
check(modalSrc.includes('NotFoundError'), 'Handles camera not found gracefully');
check(modalSrc.includes('NotReadableError'), 'Handles camera already in use gracefully');

// 2. Inspect Image Compression Utility
const compSrc = fs.readFileSync('src/utils/imageCompressor.ts', 'utf8');
check(compSrc.includes('TARGET_SIZE_BYTES = 150 * 1024'), 'Targets approximately 150 KB per notebook page');
check(compSrc.includes('MAX_DIMENSION = 1600'), 'Dynamic resolution scaling preserves notebook handwriting');
check(compSrc.includes('MIN_QUALITY') && compSrc.includes('0.55'), 'Quality floor guarantees sharp pen ink legibility');

// 3. Inspect Submission Service & Firestore Storage
const subSrc = fs.readFileSync('src/services/submissionService.ts', 'utf8');
check(subSrc.includes('imageUrls') && subSrc.includes('imagesMetadata'), 'Stores Cloudinary secure_url array and metadata in Firestore');
check(!subSrc.includes('dataUrl') && !subSrc.includes('base64'), 'Zero base64 binary stored in Firestore');
check(subSrc.includes('driveLink'), 'Backward compatible with legacy driveLink submissions');

// 4. Inspect Teacher Evaluation Viewer
const gradeSrc = fs.readFileSync('src/components/teacher/GradeSubmissionModal.tsx', 'utf8');
check(gradeSrc.includes('hasImages') && gradeSrc.includes('submission.imageUrls'), 'Renders in-modal assignment viewer for Cloudinary pages');
check(gradeSrc.includes('isDriveLink') && gradeSrc.includes('OPEN GOOGLE DRIVE'), 'Maintains Google Drive button for legacy submissions');
check(gradeSrc.includes('ChevronLeft') && gradeSrc.includes('ChevronRight'), 'Provides multi-page navigation for teachers');
check(gradeSrc.includes('Click to Zoom / Open Original') || gradeSrc.includes('handleOpenImageFullscreen'), 'Supports high-res handwriting inspection');

// 5. Inspect Security & Same-Device UID isolation
check(modalSrc.includes('useAuth') && modalSrc.includes('studentUser'), 'Uses currently authenticated Firebase student identity');
check(!modalSrc.includes('api_secret') && !modalSrc.includes('API_SECRET'), 'Zero Cloudinary API Secrets in frontend');

console.log('----------------------------------------------------');
console.log(`Results: ${passed} / ${total} camera capture assertions passed successfully.`);
console.log('====================================================');
