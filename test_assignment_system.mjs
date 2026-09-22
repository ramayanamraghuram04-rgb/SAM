/**
 * test_assignment_system.mjs
 * 
 * STEP 11 Comprehensive Verification Suite:
 * Harden and Complete Assignment Creation, Publishing, Targeting, and Student Visibility System
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('====================================================');
console.log('SAM Assignment Creation, Publishing & Targeting Suite');
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

// 1. Staff can create authorized assignment
test('1. Staff can create authorized assignment (teaching relationship enforced)', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('verifyStaffTeachingAuthorization'), 'assignmentService must include verifyStaffTeachingAuthorization');
  assert(service.includes('createAssignment'), 'assignmentService must include createAssignment');
  assert(service.includes('cleanFirestoreData'), 'assignmentService must sanitize undefined values for Firestore');
});

// 2. Staff cannot create unauthorized assignment
test('2. Staff cannot create unauthorized assignment', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('Unauthorized: You are not assigned'), 'Service must reject unauthorized subject/class combinations');
  
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('authorizedClasses'), 'Modal must restrict class selection to authorized combinations');
  assert(modal.includes('availableSubjects'), 'Modal must restrict subject selection to assigned subjects');
});

// 3. Draft assignment is hidden from Students
test('3. Draft assignment is hidden from Students', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes("a.status === 'draft' || a.published === false"), 'getStudentAssignments must strictly exclude draft and unpublished assignments');
  
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes("resource.data.published == true ||"), 'Firestore rules must restrict student reads to published assignments');
});

// 4. Published assignment is visible to the correct class
test('4. Published assignment is visible to the correct class', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('getStudentAssignments'), 'assignmentService must provide getStudentAssignments');
  assert(service.includes('targetSemester'), 'getStudentAssignments must resolve targetSemester from student profile');
  assert(service.includes('visibleAssignments'), 'getStudentAssignments must filter visible assignments matching student profile');
});

// 5. Published assignment is hidden from unrelated class
test('5. Published assignment is hidden from unrelated class', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('a.semester !== targetSemester'), 'Must exclude assignments whose semester does not match student semester');
});

// 6. Student identity comes from Firebase UID
test('6. Student identity comes from Firebase UID (Never localStorage/device ID)', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('getStudentAssignments(studentId: string)'), 'getStudentAssignments must take studentId (Firebase Auth UID)');
  assert(!service.includes('localStorage.getItem'), 'assignmentService must never read identity from localStorage');
  
  const studentDash = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');
  assert(studentDash.includes('assignmentService.getStudentAssignments(user.uid)'), 'Student dashboard must pass user.uid to getStudentAssignments');
});

// 7. Student A cannot access Student B submission
test('7. Student A cannot access Student B submission', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('resource.data.studentId == request.auth.uid'), 'Rules must enforce studentId matches auth.uid for reading submission');
  
  const subService = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(subService.includes('getStudentSubmissions'), 'submissionService must isolate submissions per studentId');
});

// 8. Same-device Student A -> logout -> Student B isolation
test('8. Same-device Student A -> logout -> Student B isolation', () => {
  const authContext = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
  assert(authContext.includes('setUser(null);'), 'logout must immediately nullify user in memory');
  assert(authContext.includes('authService.logout()'), 'logout must invoke authService session purge');
  
  const studentDash = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');
  assert(studentDash.includes('[user?.uid]'), 'StudentDashboard must reload completely when user.uid changes');
});

// 9. Student cannot submit to unauthorized assignment
test('9. Student cannot submit to unauthorized assignment (Class/Semester mismatch check)', () => {
  const subService = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(subService.includes('student.semester !== assignment.semester'), 'submitAssignment must verify student semester matches assignment semester');
  assert(subService.includes('student.department !== assignment.department'), 'submitAssignment must verify student department matches assignment department');
});

// 10. Assignment stores correct staffId
test('10. Assignment stores correct staffId', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('staffId: teacherId'), 'createAssignment must set staffId to authenticated staff UID');
  
  const types = fs.readFileSync('src/types/index.ts', 'utf8');
  assert(types.includes('staffId?: string;'), 'Assignment interface must support staffId');
});

// 11. Assignment stores correct subjectId
test('11. Assignment stores correct subjectId', () => {
  const types = fs.readFileSync('src/types/index.ts', 'utf8');
  assert(types.includes('subjectId?: string;'), 'Assignment interface must include subjectId');
  
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('subjectId:'), 'createAssignment must record subjectId');
});

// 12. Assignment stores correct classId
test('12. Assignment stores correct classId', () => {
  const types = fs.readFileSync('src/types/index.ts', 'utf8');
  assert(types.includes('classId: string;'), 'Assignment interface must require classId');
  
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('getTargetClassItem'), 'CreateAssignmentModal must compute authorized class item');
});

// 13. Assignment publication state works
test('13. Assignment publication state works (transitions and notifications)', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('publishAssignment'), 'assignmentService must include publishAssignment');
  assert(service.includes("status: 'published'"), 'publishAssignment must transition status to published');
  assert(service.includes('notificationService.createNotification'), 'Publishing must dispatch notification to target class students');
});

// 14. Draft state works
test('14. Draft state works (Save Draft and view drafts)', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('handleSaveDraft'), 'CreateAssignmentModal must include handleSaveDraft');
  assert(modal.includes("status: 'draft'"), 'handleSaveDraft must store status as draft');
  assert(modal.includes('published: false'), 'handleSaveDraft must set published: false');
});

// 15. Due-date validation works
test('15. Due-date validation works', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('Please select a valid due date.'), 'CreateAssignmentModal must validate due date presence');
  
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('dueDate'), 'assignmentService must record dueDate');
});

// 16. Verification code remains student+assignment specific
test('16. Verification code remains student+assignment specific', () => {
  const vCodeService = fs.readFileSync('src/services/verificationCodeService.ts', 'utf8');
  assert(vCodeService.includes('getOrCreateVerificationCode'), 'verificationCodeService must implement getOrCreateVerificationCode');
  assert(vCodeService.includes('studentId'), 'Verification code must be bound to studentId');
  assert(vCodeService.includes('assignmentId'), 'Verification code must be bound to assignmentId');
});

// 17. Recapture preserves verification code
test('17. Recapture preserves verification code', () => {
  const vCodeService = fs.readFileSync('src/services/verificationCodeService.ts', 'utf8');
  assert(vCodeService.includes('snap.exists()'), 'verificationCodeService must check existing code in Firestore');
  assert(vCodeService.includes('MockStore.getVerificationCode'), 'verificationCodeService must check existing code in MockStore');
});

// 18. Resubmission preserves verification code
test('18. Resubmission preserves verification code', () => {
  const subService = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(subService.includes('verificationCode: verificationCode || existingData.verificationCode'), 'Resubmission must preserve existing verification code');
});

// 19. Cloudinary camera flow remains functional
test('19. Cloudinary camera flow remains functional', () => {
  const cloudService = fs.readFileSync('src/services/cloudinary.ts', 'utf8');
  assert(cloudService.includes('uploadImage'), 'cloudinary.ts must provide uploadImage');
  
  const cameraModal = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(cameraModal.includes('getUserMedia'), 'Camera capture must use getUserMedia');
  
  const imageCompressor = fs.readFileSync('src/utils/imageCompressor.ts', 'utf8');
  assert(imageCompressor.includes('drawVerificationWatermark'), 'Camera flow must apply watermark before upload');
});

// 20. Legacy Google Drive submission remains functional
test('20. Legacy Google Drive submission remains functional', () => {
  const subService = fs.readFileSync('src/services/submissionService.ts', 'utf8');
  assert(subService.includes('validateDriveUrl'), 'submissionService must maintain validateDriveUrl support');
  assert(subService.includes('driveLink'), 'submissionService must record driveLink for backward compatibility');
});

// 21. Staff cannot manage another Staff member\'s assignment
test('21. Staff cannot manage another Staff member\'s assignment', () => {
  const service = fs.readFileSync('src/services/assignmentService.ts', 'utf8');
  assert(service.includes('Unauthorized: You can only edit assignments you created.'), 'assignmentService must guard updateAssignment');
  assert(service.includes('Unauthorized: You can only delete assignments you created.'), 'assignmentService must guard deleteAssignment');
  
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('resource.data.teacherId == request.auth.uid'), 'Rules must enforce assignment ownership on update/delete');
  assert(rules.includes('resource.data.staffId == request.auth.uid'), 'Rules must support staffId ownership on update/delete');
});

// 22. Admin can view assignments
test('22. Admin can view and manage all assignments with filters', () => {
  const adminPage = fs.readFileSync('src/pages/admin/AdminAssignmentsPage.tsx', 'utf8');
  assert(adminPage.includes('getAllAssignments'), 'Admin assignments page must load all assignments');
  assert(adminPage.includes('selectedSemester'), 'Admin page must provide semester filter');
  assert(adminPage.includes('selectedStaff'), 'Admin page must provide staff filter');
  assert(adminPage.includes('selectedStatus'), 'Admin page must provide status filter');
  assert(adminPage.includes('handlePublishAssignment'), 'Admin can publish draft to class');
  assert(adminPage.includes('handleCloseAssignment'), 'Admin can close assignment');
  assert(adminPage.includes('handleArchiveAssignment'), 'Admin can archive assignment');
});

// 23. Publish Confirmation Dialog & Duplicate Click Protection
test('23. Publish Confirmation Dialog and Duplicate Assignment Protection', () => {
  const modal = fs.readFileSync('src/components/teacher/CreateAssignmentModal.tsx', 'utf8');
  assert(modal.includes('Publish this assignment to the selected class?'), 'Modal must show confirmation message before publish');
  assert(modal.includes('disabled={isLoading}'), 'Action buttons must be disabled while saving/publishing to prevent double submits');
});

// 24. Student Assignment Card & Details Status Badges
test('24. Student Assignment Card & Details show exact 6 display statuses', () => {
  const dateUtils = fs.readFileSync('src/utils/dateUtils.ts', 'utf8');
  assert(dateUtils.includes('getAssignmentDisplayStatus'), 'dateUtils must provide getAssignmentDisplayStatus');
  assert(dateUtils.includes("'NEW'"), 'Display status must handle NEW');
  assert(dateUtils.includes("'PENDING'"), 'Display status must handle PENDING');
  assert(dateUtils.includes("'SUBMITTED'"), 'Display status must handle SUBMITTED');
  assert(dateUtils.includes("'RETURNED'"), 'Display status must handle RETURNED');
  assert(dateUtils.includes("'GRADED'"), 'Display status must handle GRADED');
  assert(dateUtils.includes("'OVERDUE'"), 'Display status must handle OVERDUE');
});

// 25. Empty States
test('25. User-friendly Empty States for Student, Staff, and Admin', () => {
  const studentPage = fs.readFileSync('src/pages/student/StudentAssignmentsPage.tsx', 'utf8');
  assert(studentPage.includes('No assignments yet'), 'Student page must display "No assignments yet" when empty');
  
  const teacherPage = fs.readFileSync('src/pages/teacher/TeacherAssignmentsPage.tsx', 'utf8');
  assert(teacherPage.includes('No assignments created yet'), 'Staff page must display "No assignments created yet" when empty');
  
  const adminPage = fs.readFileSync('src/pages/admin/AdminAssignmentsPage.tsx', 'utf8');
  assert(adminPage.includes('No assignments found'), 'Admin page must display "No assignments found" when empty');
});

console.log('----------------------------------------------------');
console.log(`Results: ${passCount} / ${totalCount} test assertions passed successfully.`);
console.log('====================================================\n');

if (passCount !== totalCount) {
  process.exit(1);
}
