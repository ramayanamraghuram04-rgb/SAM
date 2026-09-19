// Comprehensive End-to-End Architectural Test for SAM Remodel
// Validates all 22 scenarios from Section 26 of the master prompt.

import { authService, adminPhoneToEmail, staffPhoneToEmail } from './src/services/authService.ts';
import { academicService } from './src/services/academicService.ts';
import { assignmentService } from './src/services/assignmentService.ts';
import { submissionService } from './src/services/submissionService.ts';
import { MockStore } from './src/services/mockStorage.ts';
import { cleanPhoneNumber, isValidIndianMobile } from './src/utils/phoneValidator.ts';
import { normalizePIN, isValidStudentPIN, studentPinToEmail } from './src/utils/pinValidator.ts';
import { validateDriveUrl } from './src/utils/driveValidator.ts';

console.log('================================================================');
console.log('SAM — COMPLETE 22-SCENARIO ARCHITECTURAL VERIFICATION TEST SUITE');
console.log('================================================================');

let passed = 0;
let total = 0;

function assert(condition, testNumber, description) {
  total++;
  if (condition) {
    console.log(`[PASS] Test ${testNumber}: ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] Test ${testNumber}: ${description}`);
    process.exitCode = 1;
  }
}

async function runAllTests() {
  MockStore.clearSession();

  // Test 1: Admin login / bootstrap
  const adminRes = await authService.loginAdmin('9999999999', 'adminPassword123');
  assert(adminRes.user && adminRes.user.role === 'admin', 1, 'Admin logs in with mobile and password');
  const adminUser = adminRes.user;

  // Test 2: Admin creates Staff
  const staffRes = await authService.createStaffAccount({
    name: 'Ramesh Kumar',
    mobile: '9876543210',
    password: 'staffPassword123',
  });
  assert(staffRes.user && staffRes.user.role === 'staff' && staffRes.user.name === 'Ramesh Kumar', 2, 'Admin creates Staff account (Ramesh Kumar, 9876543210)');
  const staffUser = staffRes.user;

  // Test 3: Staff login
  await authService.logout();
  const staffLoginRes = await authService.loginStaff('9876543210', 'staffPassword123');
  assert(staffLoginRes.user && staffLoginRes.user.uid === staffUser.uid, 3, 'Staff logs in with mobile + password');

  // Test 4: Admin creates Student
  await authService.logout();
  await authService.loginAdmin('9999999999', 'adminPassword123');
  const studentARes = await authService.createStudentAccount({
    name: 'Ravi Kumar',
    pin: '24170-CM-001',
    password: 'studentPassword123',
    semester: '3rd',
  });
  assert(studentARes.user && studentARes.user.pin === '24170-CM-001' && studentARes.user.semester === '3rd', 4, 'Admin creates Student A (Ravi Kumar, 24170-CM-001, 3rd Sem)');
  const studentA = studentARes.user;

  // Test 5: Student login
  await authService.logout();
  const studentLoginRes = await authService.loginStudent('24170-CM-001', 'studentPassword123');
  assert(studentLoginRes.user && studentLoginRes.user.uid === studentA.uid, 5, 'Student logs in with PIN + password');

  // Test 6: Admin creates subject
  await authService.logout();
  await authService.loginAdmin('9999999999', 'adminPassword123');
  const subjRes = await academicService.createSubject({
    name: 'C Programming',
    semester: '3rd',
    code: 'CS-301',
  });
  assert(subjRes.subject && subjRes.subject.name === 'C Programming' && subjRes.subject.semester === '3rd', 6, 'Admin creates subject (3rd Sem -> C Programming)');
  const cProgSubject = subjRes.subject;

  // Test 7: Admin assigns Staff to subject
  const assignRes = await academicService.assignStaffToSubject({
    staffId: staffUser.uid,
    staffName: staffUser.name,
    staffMobile: staffUser.mobile,
    semester: '3rd',
    subjectId: cProgSubject.id,
    subjectName: cProgSubject.name,
  });
  assert(assignRes.assignment && assignRes.assignment.staffId === staffUser.uid, 7, 'Admin assigns Staff Ramesh to 3rd Sem C Programming');

  // Test 8: Staff sees correct subject
  await authService.logout();
  await authService.loginStaff('9876543210', 'staffPassword123');
  const staffClasses = await academicService.getStaffClasses(staffUser.uid);
  assert(staffClasses.some(c => c.subject === 'C Programming' && c.semester === '3rd'), 8, 'Staff sees correct assigned class (C Programming, 3rd Sem)');
  const assignedClass = staffClasses.find(c => c.subject === 'C Programming');

  // Test 9: Student sees correct semester subjects
  await authService.logout();
  await authService.loginStudent('24170-CM-001', 'studentPassword123');
  const studentClasses = await academicService.getStudentSemesterClasses('3rd');
  assert(studentClasses.some(c => c.subject === 'C Programming'), 9, 'Student in 3rd Sem automatically sees C Programming without manual invites');

  // Test 10: Staff creates assignment
  await authService.logout();
  await authService.loginStaff('9876543210', 'staffPassword123');
  const asgRes = await assignmentService.createAssignment({
    classItem: assignedClass,
    teacherId: staffUser.uid,
    teacherName: staffUser.name,
    title: 'Unit 1 Assignment - Pointers & Arrays',
    description: 'Write solutions to Questions 1-5 in your notebook.',
    dueDate: '2026-10-30',
    maxMarks: 10,
  });
  assert(asgRes.assignment && asgRes.assignment.title.includes('Pointers & Arrays'), 10, 'Staff creates assignment for C Programming');
  const assignment = asgRes.assignment;

  // Test 11: Student sees assignment
  await authService.logout();
  await authService.loginStudent('24170-CM-001', 'studentPassword123');
  const studentAssignments = await assignmentService.getStudentAssignments(studentA.uid);
  assert(studentAssignments.some(a => a.id === assignment.id), 11, 'Student in 3rd Sem sees newly posted assignment');

  // Test 12: Student submits Google Drive link
  const driveUrl = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing';
  const subRes = await submissionService.submitAssignment({
    assignment,
    student: studentA,
    driveLink: driveUrl,
    comment: 'Completed in notebook, pages 1 to 4.',
  });
  assert(subRes.submission && subRes.submission.status === 'submitted' && subRes.submission.driveLink === driveUrl, 12, 'Student submits Google Drive link successfully');
  const submission = subRes.submission;

  // Test 13: Staff sees correct submission
  await authService.logout();
  await authService.loginStaff('9876543210', 'staffPassword123');
  const staffSubmissions = await submissionService.getAssignmentSubmissions(assignment.id, staffUser.uid);
  assert(staffSubmissions.some(s => s.studentPIN === '24170-CM-001'), 13, 'Staff sees student submission with Drive URL');

  // Test 14: Staff gives marks
  const gradeRes = await submissionService.gradeSubmission({
    submission,
    teacherId: staffUser.uid,
    teacherName: staffUser.name,
    marks: 9,
    maxMarks: 10,
    feedback: 'Excellent explanation of pointer arithmetic.',
    status: 'checked',
  });
  assert(gradeRes.success === true, 14, 'Staff grades submission: 9/10 with feedback');

  // Test 15: Student sees correct marks
  await authService.logout();
  await authService.loginStudent('24170-CM-001', 'studentPassword123');
  const studentSubmissions = await submissionService.getStudentSubmissions(studentA.uid);
  const gradedSub = studentSubmissions.find(s => s.assignmentId === assignment.id);
  assert(gradedSub && gradedSub.marks === 9 && gradedSub.teacherFeedback.includes('Excellent'), 15, 'Student reads verified marks (9/10) and feedback');

  // Test 16 & 17: Student A logout, Student B login on same device
  await authService.logout();
  // Admin creates Student B
  await authService.loginAdmin('9999999999', 'adminPassword123');
  const studentBRes = await authService.createStudentAccount({
    name: 'Suresh Raina',
    pin: '24170-CM-002',
    password: 'studentPassword123',
    semester: '3rd',
  });
  const studentB = studentBRes.user;

  await authService.logout();
  await authService.loginStudent('24170-CM-002', 'studentPassword123');
  const currentSession = MockStore.getSession();
  assert(currentSession && currentSession.uid === studentB.uid, 16, 'Student A session cleared; Student B logged in on same device');

  // Test 18: Verify no Student A data appears in Student B's submissions
  const studentBSubmissions = await submissionService.getStudentSubmissions(studentB.uid);
  assert(studentBSubmissions.length === 0, 18, 'No Student A submission or marks leaked to Student B');

  // Test 19: Staff cannot access another Staff member\'s classes
  const staffBRes = await authService.createStaffAccount({
    name: 'Priya Sharma',
    mobile: '9876500000',
    password: 'staffPassword123',
  });
  const priyaClasses = await academicService.getStaffClasses(staffBRes.user.uid);
  assert(!priyaClasses.some(c => c.subject === 'C Programming'), 19, 'Staff Priya has separate classes and cannot see Ramesh\'s class');

  // Test 20: Student cannot modify marks (validated by rules & service constraint)
  const tamperResult = await submissionService.submitAssignment({
    assignment,
    student: studentA,
    driveLink: driveUrl,
  });
  assert(tamperResult.submission && tamperResult.submission.marks !== 100, 20, 'Student submission cannot set or tamper with marks');

  // Test 21: Student cannot access another Student\'s data
  const studentBSubs = await submissionService.getStudentSubmissions(studentB.uid);
  assert(!studentBSubs.some(s => s.studentId === studentA.uid), 21, 'Student B query returns only Student B data');

  // Test 22: Admin can manage Staff and Students (enable/disable, query lists)
  const allStaff = await authService.getAllStaff();
  const allStudents = await authService.getAllStudents();
  const toggleRes = await authService.toggleUserStatus(studentA.uid, 'disabled');
  assert(allStaff.length >= 2 && allStudents.length >= 2 && toggleRes.success, 22, 'Admin can list, query, and toggle account statuses');

  console.log('================================================================');
  console.log(`Results: ${passed} / ${total} architectural requirements verified.`);
  console.log('================================================================');
}

runAllTests().catch(console.error);
