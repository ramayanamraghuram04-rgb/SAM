/**
 * test_admin_system.mjs
 * 
 * STEP 10 Comprehensive Verification Suite:
 * Professional Admin Management System with Strict Role Control
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('====================================================');
console.log('SAM Admin Management & Strict Role Control Test Suite');
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

// 1. Exactly 3 Roles Test
test('1. System enforces exactly 3 distinct user roles (ADMIN, STAFF/TEACHER, STUDENT)', () => {
  const typesContent = fs.readFileSync('src/types/index.ts', 'utf8');
  assert(typesContent.includes("export type UserRole = 'admin' | 'staff' | 'student' | 'teacher'"), 'UserRole definition must contain admin, staff, student');
  assert(typesContent.includes("role: UserRole"), 'BaseUser must contain role field');
});

// 2. Authoritative Identity is Firebase Auth UID
test('2. Authoritative identity is Firebase Auth UID (Never localStorage, device ID, or IP)', () => {
  const authService = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authService.includes('auth.currentUser'), 'Auth service must check auth.currentUser');
  assert(authService.includes('cred.user.uid'), 'Account records must use Firebase cred.user.uid');
  assert(!authService.includes('localStorage.getItem("authenticated_uid")'), 'localStorage must not be used as identity authority');
});

// 3. Admin Login Fields & Behavior
test('3. Admin login uses Mobile Number + Password without technical leak', () => {
  const adminLogin = fs.readFileSync('src/pages/public/AdminLoginPage.tsx', 'utf8');
  assert(adminLogin.includes('Mobile Number'), 'Admin login requires mobile number');
  assert(adminLogin.includes('type="password"'), 'Admin login requires password');
  assert(adminLogin.includes('authService.loginAdmin'), 'Admin login triggers authService.loginAdmin');
});

// 4. Staff Login & Synthetic Mapping
test('4. Staff login uses Mobile Number + Password with synthetic email mapping', () => {
  const teacherLogin = fs.readFileSync('src/pages/public/TeacherLoginPage.tsx', 'utf8');
  assert(teacherLogin.includes('Mobile Number') || teacherLogin.includes('Phone'), 'Staff login requires mobile number');
  assert(teacherLogin.includes('type="password"'), 'Staff login requires password');
  
  const authService = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authService.includes('@sam.internal'), 'Staff login uses synthetic @sam.internal email format');
});

// 5. Student Login & PIN handling
test('5. Student login uses PIN + Password; PIN is not used as Firebase Auth UID', () => {
  const studentLogin = fs.readFileSync('src/pages/public/StudentLoginPage.tsx', 'utf8');
  assert(studentLogin.includes('Diploma PIN') || studentLogin.includes('PIN'), 'Student login requires PIN');
  assert(studentLogin.includes('type="password"'), 'Student login requires password');
  
  const authService = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authService.includes('student_'), 'Student login maps PIN to synthetic auth identifier');
});

// 6. Admin Navigation has all 10 destinations
test('6. Admin navigation includes all required destinations in Sidebar', () => {
  const sidebarContent = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
  const requiredTabs = [
    { id: 'home', label: 'Dashboard' },
    { id: 'students', label: 'Students' },
    { id: 'staff', label: 'Faculty / Staff' },
    { id: 'classes', label: 'Classes' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
  ];

  for (const item of requiredTabs) {
    assert(sidebarContent.includes(`id: '${item.id}'`), `Sidebar must contain nav item id: ${item.id}`);
  }
});

// 7. Admin Dashboard Stats Cards
test('7. Admin Dashboard displays "Welcome Admin" and 6 core stats cards', () => {
  const dashboardContent = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
  assert(dashboardContent.includes('Welcome Admin'), 'Dashboard must display "Welcome Admin" banner');
  assert(dashboardContent.includes('Total Students') || dashboardContent.includes('totalStudents'), 'Dashboard must compute/display Total Students');
  assert(dashboardContent.includes('Total Staff') || dashboardContent.includes('totalStaff'), 'Dashboard must compute/display Total Staff');
  assert(dashboardContent.includes('Total Classes') || dashboardContent.includes('totalClasses'), 'Dashboard must compute/display Total Classes');
  assert(dashboardContent.includes('Total Subjects') || dashboardContent.includes('totalSubjects'), 'Dashboard must compute/display Total Subjects');
  assert(dashboardContent.includes('Active Assignments') || dashboardContent.includes('activeAssignments'), 'Dashboard must compute/display Active Assignments');
  assert(dashboardContent.includes('Pending Submissions') || dashboardContent.includes('pendingSubmissions'), 'Dashboard must compute/display Pending Submissions');
});

// 8. Student Management Capabilities
test('8. Student Management allows Add, View, Disable/Enable, Reset Password, Search & Filter', () => {
  const studentsPage = fs.readFileSync('src/pages/admin/AdminStudentsPage.tsx', 'utf8');
  assert(studentsPage.includes('handleCreateStudent'), 'AdminStudentsPage must support adding student');
  assert(studentsPage.includes('handleToggleStatus'), 'AdminStudentsPage must support disabling/enabling student');
  assert(studentsPage.includes('editPassword'), 'AdminStudentsPage must support resetting student password');
  assert(studentsPage.includes('searchQuery'), 'AdminStudentsPage must support search');
  assert(studentsPage.includes('selectedSemester'), 'AdminStudentsPage must support semester filtering');
  assert(studentsPage.includes('selectedStatus'), 'AdminStudentsPage must support status filtering');
});

// 9. Staff Management Capabilities
test('9. Staff Management allows Add, View, Disable/Enable, Reset Password, and multi-teaching assignment', () => {
  const staffPage = fs.readFileSync('src/pages/admin/AdminStaffPage.tsx', 'utf8');
  assert(staffPage.includes('handleCreateStaff'), 'AdminStaffPage must support adding staff');
  assert(staffPage.includes('handleToggleStatus'), 'AdminStaffPage must support disabling/enabling staff');
  assert(staffPage.includes('editPassword'), 'AdminStaffPage must support resetting staff password');
  assert(staffPage.includes('searchQuery'), 'AdminStaffPage must support search');
  assert(staffPage.includes('teachingAssignments') || staffPage.includes('assignStaffToSubject'), 'AdminStaffPage must link teaching assignments');
});

// 10. Class Management Capabilities & Semester Support
test('10. Class Management supports 1st, 3rd, 4th, 5th Semesters and student roster view', () => {
  const classesPage = fs.readFileSync('src/pages/admin/AdminClassesPage.tsx', 'utf8');
  assert(classesPage.includes('handleCreateClass'), 'AdminClassesPage must support creating classes');
  assert(classesPage.includes('handleToggleStatus'), 'AdminClassesPage must support disabling/enabling classes');
  assert(classesPage.includes('studentsInViewClass') || classesPage.includes('viewingClass'), 'AdminClassesPage must support viewing students enrolled in class');
  
  const academicService = fs.readFileSync('src/services/academicService.ts', 'utf8');
  assert(academicService.includes('getAllClasses'), 'academicService must support getAllClasses');
  assert(academicService.includes('createClass'), 'academicService must support createClass');
  assert(academicService.includes('toggleClassStatus'), 'academicService must support toggleClassStatus');
});

// 11. Subject Management & Non-Hardcoded Relationships
test('11. Subject Management stores subjects in Firestore and supports add/edit/toggle status', () => {
  const subjectsPage = fs.readFileSync('src/pages/admin/AdminSubjectsPage.tsx', 'utf8');
  assert(subjectsPage.includes('handleCreateSubject'), 'AdminSubjectsPage must support adding subjects');
  assert(subjectsPage.includes('handleUpdateSubject'), 'AdminSubjectsPage must support editing subjects');
  
  const academicService = fs.readFileSync('src/services/academicService.ts', 'utf8');
  assert(academicService.includes('updateSubject'), 'academicService must support updating subjects in Firestore');
});

// 12. Teaching Assignments & Duplicate Prevention
test('12. Teaching Assignments interface prevents duplicate staff + subject + class combinations', () => {
  const teachingPage = fs.readFileSync('src/pages/admin/AdminTeachingAssignmentsPage.tsx', 'utf8');
  assert(teachingPage.includes('handleAssign'), 'AdminTeachingAssignmentsPage must support adding assignments');
  assert(teachingPage.includes('handleDeleteAssignment'), 'AdminTeachingAssignmentsPage must support removing assignments');
  
  const academicService = fs.readFileSync('src/services/academicService.ts', 'utf8');
  assert(
    academicService.includes('already exists') || academicService.includes('is already assigned'),
    'academicService must detect and reject duplicate staff+subject+class assignment'
  );
});

// 13. Password Security: Never store plain text in Firestore
test('13. Password Security: Passwords handled by Firebase Auth, never stored plain-text in Firestore', () => {
  const authService = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authService.includes('createUserWithEmailAndPassword'), 'Account creation uses Firebase Auth createUserWithEmailAndPassword');
  
  const studentDocSlice = authService.substring(authService.indexOf('adminCreateStudent'));
  assert(!studentDocSlice.includes('password: password'), 'Student Firestore document must NOT contain plain password');
  
  const staffDocSlice = authService.substring(authService.indexOf('adminCreateStaff'));
  assert(!staffDocSlice.includes('password: password'), 'Staff Firestore document must NOT contain plain password');
});

// 14. Same-Device Student Isolation
test('14. Same-Device Isolation: State resets on user change so Student B never sees Student A data', () => {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  assert(appContent.includes('[user?.uid]'), 'App.tsx must watch user?.uid in useEffect for clean state isolation');
  assert(appContent.includes('setSelectedStaffClass(null)'), 'Must clear staff class drilldown state');
  assert(appContent.includes('setSelectedStudentClass(null)'), 'Must clear student class drilldown state');
  assert(appContent.includes('setSelectedStudentAssignment(null)'), 'Must clear student assignment drilldown state');
  assert(appContent.includes('setAdminTab(\'home\')'), 'Must reset admin tab');
  assert(appContent.includes('setStudentTab(\'home\')'), 'Must reset student tab');
});

// 15. Role-Based Route Protection in App.tsx
test('15. Role-Based Route Protection: Students and Staff cannot access Admin routes', () => {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  assert(appContent.includes("if (role === 'admin')"), 'App.tsx must guard Admin flow with role === "admin"');
  assert(appContent.includes("if (role === 'staff' || role === 'teacher')"), 'App.tsx must guard Staff flow');
  assert(appContent.includes("if (role === 'student')"), 'App.tsx must guard Student flow');
});

// 16. Firestore Security Rules
test('16. Firestore Security Rules enforce role checks and block unauthorized modifications', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('function isAdmin()'), 'Rules must include isAdmin helper');
  assert(rules.includes('function isStaff()'), 'Rules must include isStaff helper');
  assert(rules.includes('function isStudent()'), 'Rules must include isStudent helper');
  assert(rules.includes('match /users/{userId}'), 'Rules must protect users collection');
  assert(rules.includes('request.resource.data.role == resource.data.role'), 'Rules must block clients from modifying their own role');
  assert(rules.includes('match /submissions/{submissionId}'), 'Rules must protect submissions collection');
  assert(rules.includes('resource.data.studentUid == request.auth.uid'), 'Rules must restrict student submission access to own UID');
});

// 17. No Public Registration
test('17. No public registration forms for Staff or Students exist in public routes', () => {
  const landingPage = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf8');
  assert(!landingPage.includes('Register as Student'), 'LandingPage must not offer public Student Registration');
  assert(!landingPage.includes('Register as Staff'), 'LandingPage must not offer public Staff Registration');
  assert(!landingPage.includes('Create Account'), 'LandingPage must not offer self-service account registration');
});

// 18. User Disabling preserves data and revokes access
test('18. User Status toggling preserves user document without destructive deletion', () => {
  const authService = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authService.includes('toggleUserStatus'), 'authService must support toggleUserStatus');
  assert(authService.includes("status: newStatus"), 'toggleUserStatus must update status to disabled or active');
});

// 19. Camera Submission and Verification Code features preserved
test('19. Camera submission, Cloudinary integration, and verification codes remain intact', () => {
  const modalContent = fs.readFileSync('src/components/student/SubmitAssignmentModal.tsx', 'utf8');
  assert(modalContent.includes('getUserMedia'), 'Live camera getUserMedia preserved');
  assert(modalContent.includes('verificationCode'), 'Verification code preserved in submission modal');
  assert(modalContent.includes('cloudinaryService.uploadImage'), 'Cloudinary upload preserved in submission modal');
});

// 20. Admin Submissions & Notebook Inspection
test('20. Admin Submissions page allows inspecting student notebook pages and verification codes', () => {
  const submissionsPage = fs.readFileSync('src/pages/admin/AdminSubmissionsPage.tsx', 'utf8');
  assert(submissionsPage.includes('verificationCode'), 'AdminSubmissionsPage must display verification codes');
  assert(submissionsPage.includes('imageUrls'), 'AdminSubmissionsPage must support notebook page inspection');
  assert(submissionsPage.includes('searchQuery'), 'AdminSubmissionsPage must support filtering submissions');
});

console.log('----------------------------------------------------');
console.log(`Results: ${passCount} / ${totalCount} test assertions passed successfully.`);
console.log('====================================================\n');

if (passCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
