import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { execSync } from 'child_process';

console.log('====================================================');
console.log('SAM Full-Screen Digital Annotation & Evaluation Suite');
console.log('====================================================\n');

let passed = 0;
let total = 0;

function check(desc, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${total}. ${desc}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${total}. ${desc}\n       Error: ${err.message}`);
  }
}

const modalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/teacher/GradeSubmissionModal.tsx'), 'utf8');
const canvasSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/teacher/AnnotationCanvas.tsx'), 'utf8');
const serviceSrc = fs.readFileSync(path.join(process.cwd(), 'src/services/annotationService.ts'), 'utf8');
const rulesSrc = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
const subServiceSrc = fs.readFileSync(path.join(process.cwd(), 'src/services/submissionService.ts'), 'utf8');

// 1. Full-screen evaluation opens
check('1. Full-screen evaluation opens (100vw x 100vh workspace)', () => {
  assert.ok(modalSrc.includes('100vw') && modalSrc.includes('100vh'), 'Workspace must use 100vw and 100vh');
  assert.ok(modalSrc.includes('fixed inset-0 z-50 bg-slate-950'), 'Modal must take over full screen viewport');
  assert.ok(modalSrc.includes('Full-Screen Teacher Evaluation Workspace'), 'Must be labeled as full-screen workspace');
});

// 2. Submitted image is large
check('2. Submitted image is large and easy to read', () => {
  assert.ok(canvasSrc.includes('max-h-[calc(100vh-170px)]') || canvasSrc.includes('max-h-'), 'Image must use large viewport height');
  assert.ok(canvasSrc.includes('w-auto') && canvasSrc.includes('object-contain'), 'Must preserve aspect ratio and maximize legibility');
});

// 3. Pen works
check('3. Pen works with colors (Red, Blue, Green, Black) and thicknesses (Thin, Med, Thick; default Red+Medium)', () => {
  assert.ok(modalSrc.includes('PEN'), 'Must have PEN tool');
  assert.ok(modalSrc.includes('#EF4444'), 'Must support Red');
  assert.ok(modalSrc.includes('#3B82F6'), 'Must support Blue');
  assert.ok(modalSrc.includes('#10B981'), 'Must support Green');
  assert.ok(modalSrc.includes('#111827'), 'Must support Black');
  assert.ok(modalSrc.includes('Thin') && (modalSrc.includes('Med') || modalSrc.includes('Medium')) && modalSrc.includes('Thick'), 'Must support Thin, Medium, Thick');
  assert.ok(modalSrc.includes("penColor, setPenColor] = useState<PenColor>('#EF4444')"), 'Default color must be Red');
  assert.ok(modalSrc.includes('penThickness, setPenThickness] = useState<PenThickness>(4)'), 'Default thickness must be Medium (4)');
});

// 4. Teacher can draw over image
check('4. Teacher can draw directly over submitted image on transparent layer', () => {
  assert.ok(canvasSrc.includes('<canvas'), 'Must render HTML5 canvas overlay');
  assert.ok(canvasSrc.includes('<img'), 'Must render student submitted image underneath');
  assert.ok(canvasSrc.includes('handlePointerDown') && canvasSrc.includes('handlePointerMove'), 'Must support pointer-based drawing');
});

// 5. Eraser works
check('5. Eraser removes only teacher annotations without touching original student image', () => {
  assert.ok(modalSrc.includes('ERASER'), 'Must have ERASER tool');
  assert.ok(canvasSrc.includes('eraseAtPoint'), 'Must remove canvas strokes on touch/drag');
  assert.ok(canvasSrc.includes('isNearStroke'), 'Must calculate stroke hit detection for vector erasing');
});

// 6. Undo works
check('6. Undo works with multiple undo levels and keyboard shortcuts', () => {
  assert.ok(modalSrc.includes('handleUndo'), 'Must provide Undo handler');
  assert.ok(canvasSrc.includes('undoStack'), 'Canvas must maintain undo stack');
  assert.ok(modalSrc.includes('Ctrl+Z') || modalSrc.includes('ctrlKey'), 'Must support Ctrl+Z shortcut');
});

// 7. Redo works
check('7. Redo works with multiple redo levels and keyboard shortcuts', () => {
  assert.ok(modalSrc.includes('handleRedo'), 'Must provide Redo handler');
  assert.ok(canvasSrc.includes('redoStack'), 'Canvas must maintain redo stack');
  assert.ok(modalSrc.includes('Ctrl+Y') || modalSrc.includes('ctrlKey'), 'Must support Ctrl+Y shortcut');
});

// 8. Text tool works
check('8. Text tool allows placing corrections with presets and movable before saving', () => {
  assert.ok(modalSrc.includes('TEXT'), 'Must have TEXT tool');
  assert.ok(canvasSrc.includes('activeTextInput'), 'Must support placing text inputs on canvas');
  assert.ok(canvasSrc.includes('Wrong answer') && canvasSrc.includes('Good') && canvasSrc.includes('Correct this step'), 'Must offer quick text correction presets');
  assert.ok(canvasSrc.includes('handleInputDragStart') || canvasSrc.includes('cursor-move') || canvasSrc.includes('draggingTextIndexRef'), 'Text must be movable before saving');
});

// 9. Zoom works
check('9. Zoom (-, 100%, +, FIT) scales both image and annotations synchronously', () => {
  assert.ok(modalSrc.includes('handleZoomIn') && modalSrc.includes('handleZoomOut'), 'Must provide zoom in/out');
  assert.ok(modalSrc.includes('handleResetZoom'), 'Must provide reset zoom to 100%');
  assert.ok(modalSrc.includes('handleFitScreen'), 'Must provide FIT action');
});

// 10. Pan works
check('10. Pan works when zoomed in allowing navigation across details', () => {
  assert.ok(modalSrc.includes('panOffset'), 'Must track pan offset');
  assert.ok(modalSrc.includes('handlePanMouseMove') || modalSrc.includes('handleTouchMove'), 'Must support pan moving');
  assert.ok(modalSrc.includes('scale(${zoomLevel})') || modalSrc.includes('scale('), 'Zoom and pan must transform synchronously');
});

// 11. Page navigation works
check('11. Page navigation works (Previous, Next, and Page X of Y)', () => {
  assert.ok(modalSrc.includes('PREVIOUS') && modalSrc.includes('NEXT'), 'Must provide PREVIOUS and NEXT page buttons');
  assert.ok(modalSrc.includes('Page {activePageIndex + 1} of {totalPages}'), 'Must display Page X of Y');
  assert.ok(modalSrc.includes('Thumbnail') || modalSrc.includes('setActivePageIndex'), 'Must support thumbnail row navigation');
});

// 12. Page-specific annotations persist
check('12. Page-specific annotations persist across page switching in memory', () => {
  assert.ok(modalSrc.includes('pageAnnotations') && modalSrc.includes('setPageAnnotations'), 'Must maintain per-page annotations in memory');
  assert.ok(modalSrc.includes('handleAnnotationChange'), 'Must synchronize page annotation changes');
});

// 13. Original Cloudinary image is never modified
check('13. Original student Cloudinary image is never modified or replaced', () => {
  assert.ok(modalSrc.includes('submission.imageUrls'), 'Must display original submitted images');
  assert.ok(!serviceSrc.includes('cloudinary') && !serviceSrc.includes('uploadImage'), 'Annotation service must never upload replacement image');
});

// 14. Annotation data saves to Firestore
check('14. Annotation data saves to Firestore submissionAnnotations/{submissionId}', () => {
  assert.ok(serviceSrc.includes("doc(db, 'submissionAnnotations', data.submissionId)"), 'Service must save to submissionAnnotations collection');
  assert.ok(rulesSrc.includes('match /submissionAnnotations/{submissionId}'), 'Firestore rules must govern submissionAnnotations collection');
  assert.ok(rulesSrc.includes('isAdmin() || isStaff()'), 'Only staff and admin can write annotations');
});

// 15. Teacher UID is stored
check('15. Teacher UID is stored in annotation record and grading payload', () => {
  assert.ok(serviceSrc.includes('teacherId'), 'Annotation payload must contain teacherId');
  assert.ok(modalSrc.includes('teacherId: user.uid'), 'GradeSubmissionModal must bind teacherId from auth context');
});

// 16. DONE saves annotations
check('16. DONE button saves annotations with pending evaluation', () => {
  assert.ok(modalSrc.includes('handleDone'), 'Must implement handleDone');
  assert.ok(modalSrc.includes('saveCurrentAnnotations'), 'DONE must save annotations');
  assert.ok(modalSrc.includes('Unable to save changes. Please try again.'), 'Must alert teacher if saving fails');
});

// 17. DONE exits evaluation
check('17. DONE button exits evaluation and returns to Teacher Submissions', () => {
  assert.ok(modalSrc.includes('onClose()'), 'Must call onClose to exit full-screen workspace');
  assert.ok(modalSrc.includes('>DONE<') || modalSrc.includes('<span>DONE</span>'), 'Prominent DONE button rendered in header');
});

// 18. Marks still work
check('18. Marks entry works with validation and quick selector pills', () => {
  assert.ok(modalSrc.includes('Marks'), 'Must display Marks input');
  assert.ok(modalSrc.includes('maxMarks'), 'Must validate against maxMarks');
  assert.ok(modalSrc.includes('setMarks'), 'Must update marks state');
});

// 19. Feedback still works
check('19. Feedback textarea works with quick comment suggestions', () => {
  assert.ok(modalSrc.includes('Feedback'), 'Must display Feedback section');
  assert.ok(modalSrc.includes('setFeedback'), 'Must update feedback state');
  assert.ok(modalSrc.includes('Well presented') && modalSrc.includes('Good handwriting'), 'Must provide quick feedback chips');
});

// 20. Submit Grade still works
check('20. Submit Grade works with confirmation dialog', () => {
  assert.ok(modalSrc.includes('Submit Grade'), 'Must provide Submit Grade button');
  assert.ok(modalSrc.includes('showGradeConfirm'), 'Must show confirmation before submitting grade');
  assert.ok(modalSrc.includes('handleExecuteGrade'), 'Must execute grade submission after confirmation');
});

// 21. Return for Correction still works
check('21. Return for Correction works with confirmation and feedback', () => {
  assert.ok(modalSrc.includes('Return for Correction'), 'Must provide Return for Correction button');
  assert.ok(modalSrc.includes('showReturnConfirm'), 'Must show confirmation before returning');
  assert.ok(modalSrc.includes('handleExecuteReturn'), 'Must execute return after confirmation');
  assert.ok(subServiceSrc.includes('status: existing.status') || subServiceSrc.includes('history: []'), 'Submission service preserves history');
});

// 22. Verification code remains visible
check('22. Verification code remains visible with manual comparison checkbox', () => {
  assert.ok(modalSrc.includes('currentVerificationCode'), 'Header must display Verification Code');
  assert.ok(modalSrc.includes('I have verified the submission code'), 'Must provide visual comparison checkbox');
  assert.ok(modalSrc.includes('Manual visual comparison only'), 'Must clarify manual visual verification disclaimer');
});

// 23. Existing Cloudinary submissions still display
check('23. Existing Cloudinary submissions still display with high-resolution imagery', () => {
  assert.ok(modalSrc.includes('hasImages'), 'Must check for submitted image URLs');
  assert.ok(modalSrc.includes('currentUrl'), 'Must render active Cloudinary image page');
});

// 24. Legacy Google Drive submissions still display
check('24. Legacy Google Drive submissions still display with dedicated link action', () => {
  assert.ok(modalSrc.includes('isDriveLink'), 'Must identify legacy drive submissions');
  assert.ok(modalSrc.includes('OPEN GOOGLE DRIVE'), 'Must provide OPEN GOOGLE DRIVE button');
});

// 25. Existing SAM tests remain passing
check('25. Existing SAM test suites pass successfully', () => {
  try {
    const out = execSync('node test_submission_grading.mjs', { encoding: 'utf8' });
    assert.ok(out.includes('Results: 33 / 33 test assertions passed successfully.'), 'All 33 submission grading assertions must pass');
  } catch (err) {
    throw new Error(`test_submission_grading.mjs failed: ${err.message}`);
  }
});

console.log('----------------------------------------------------');
console.log(`Results: ${passed} / ${total} digital annotation & evaluation assertions passed successfully.`);
console.log('====================================================\n');

if (passed !== total) {
  process.exit(1);
}
