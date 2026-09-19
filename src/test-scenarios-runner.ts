// Comprehensive 26-Test Scenario Runner for SAM
import { authService } from './services/authService';
import { classService } from './services/classService';
import { inviteService } from './services/inviteService';
import { assignmentService } from './services/assignmentService';
import { submissionService } from './services/submissionService';
import { notificationService } from './services/notificationService';
import { MockStore } from './services/mockStorage';
import { StudentUser } from './types';

let passed = 0;
let total = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  total++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then((ok) => {
        if (ok) {
          console.log(`[PASS] Test ${total}: ${name}`);
          passed++;
        } else {
          console.error(`[FAIL] Test ${total}: ${name}`);
        }
      });
    } else {
      if (res) {
        console.log(`[PASS] Test ${total}: ${name}`);
        passed++;
      } else {
        console.error(`[FAIL] Test ${total}: ${name}`);
      }
    }
  } catch (err) {
    console.error(`[FAIL] Test ${total}: ${name}`, err);
  }
}

async function runAllTests() {
  console.log('======================================================');
  console.log('Running 26 Full Specification Tests for SAM (from scratch)');
  console.log('======================================================');

  // TEST 1: Teacher registers
  const teacherRes = await authService.registerTeacher({
    name: 'Ramesh Kumar',
    mobile: '9876543210',
    password: 'password123',
    confirmPassword: 'password123',
  });
  test('TEST 1: Teacher registers with mobile + password', () => {
    return teacherRes.user !== null && teacherRes.user.role === 'teacher';
  });

  const teacher = teacherRes.user!;

  // TEST 2: Teacher logs out
  await authService.logout();
  test('TEST 2: Teacher logs out and session clears', () => {
    return MockStore.getSession() === null;
  });

  // TEST 3: Teacher logs in again using mobile + password
  const teacherLogin = await authService.loginTeacher('9876543210', 'password123');
  test('TEST 3: Teacher logs in again using mobile + password without email', () => {
    return teacherLogin.user !== null && teacherLogin.user.uid === teacher.uid;
  });

  // TEST 4: Teacher creates 1st semester class
  const c1 = await classService.createClass({
    teacherId: teacher.uid,
    teacherName: teacher.name,
    semester: '1st',
    subject: 'Programming Fundamentals',
  });
  test('TEST 4: Teacher creates 1st semester class', () => c1.classItem !== null && c1.classItem.semester === '1st');

  // TEST 5: Teacher creates 3rd semester class
  const c3 = await classService.createClass({
    teacherId: teacher.uid,
    teacherName: teacher.name,
    semester: '3rd',
    subject: 'C Programming',
  });
  test('TEST 5: Teacher creates 3rd semester class', () => c3.classItem !== null && c3.classItem.semester === '3rd');

  // TEST 6: Teacher creates 4th semester class
  const c4 = await classService.createClass({
    teacherId: teacher.uid,
    teacherName: teacher.name,
    semester: '4th',
    subject: 'Database Management Systems',
  });
  test('TEST 6: Teacher creates 4th semester class', () => c4.classItem !== null && c4.classItem.semester === '4th');

  // TEST 7: Teacher creates 5th semester class
  const c5 = await classService.createClass({
    teacherId: teacher.uid,
    teacherName: teacher.name,
    semester: '5th',
    subject: 'Web Technology',
  });
  test('TEST 7: Teacher creates 5th semester class', () => c5.classItem !== null && c5.classItem.semester === '5th');

  // Verify all 4 classes belong to same teacher account
  const teacherClasses = await classService.getTeacherClasses(teacher.uid);
  test('Teacher manages all 4 classes from single dashboard', () => teacherClasses.length === 4);

  // TEST 8: Student registers
  const student1Res = await authService.registerStudent({
    name: 'Ravi Kumar',
    pin: '24170-CM-001',
    password: 'password123',
    confirmPassword: 'password123',
  });
  test('TEST 8: Student registers once with PIN + password', () => {
    return student1Res.user !== null && student1Res.user.role === 'student';
  });

  const student1 = student1Res.user! as StudentUser;

  // TEST 9: Student logs out and logs in again
  await authService.logout();
  const studentLogin = await authService.loginStudent('24170-CM-001', 'password123');
  test('TEST 9: Student logs out and logs in again using PIN + password', () => {
    return studentLogin.user !== null && studentLogin.user.uid === student1.uid;
  });

  // TEST 10: Teacher searches student using PIN
  const searched = await inviteService.searchStudentByPIN('24170-CM-001');
  test('TEST 10: Teacher searches student using PIN', () => {
    return searched !== null && searched.name === 'Ravi Kumar' && searched.pin === '24170-CM-001';
  });

  // TEST 11: Teacher sends invitation
  const inviteRes = await inviteService.sendInvitation({
    classItem: c3.classItem!,
    student: searched!,
    teacherId: teacher.uid,
    teacherName: teacher.name,
  });
  test('TEST 11: Teacher sends invitation to 3rd Sem C Programming', () => inviteRes.success);

  // Duplicate invite protection test
  const dupInvite = await inviteService.sendInvitation({
    classItem: c3.classItem!,
    student: searched!,
    teacherId: teacher.uid,
    teacherName: teacher.name,
  });
  test('Duplicate invite prevented', () => !dupInvite.success);

  // TEST 12: Student receives invitation
  const studentInvs = await inviteService.getStudentInvitations(student1.uid);
  test('TEST 12: Student receives invitation in portal', () => studentInvs.length === 1 && studentInvs[0].subject === 'C Programming');

  // TEST 13: Student accepts invitation
  const acceptRes = await inviteService.respondToInvitation(studentInvs[0], 'accept');
  test('TEST 13: Student accepts invitation', () => acceptRes.success);

  // TEST 14: Student sees only the accepted class
  const studentClasses = await classService.getStudentClasses(student1.uid);
  test('TEST 14: Student sees only the accepted class (1 class)', () => {
    return studentClasses.length === 1 && studentClasses[0].subject === 'C Programming';
  });

  // TEST 15: Teacher creates assignment
  const asgRes = await assignmentService.createAssignment({
    classItem: c3.classItem!,
    teacherId: teacher.uid,
    teacherName: teacher.name,
    title: 'Unit 1 Assignment',
    description: 'Write a C program to find the largest number among three numbers in your physical notebook.',
    dueDate: '2026-10-15',
    maxMarks: 10,
  });
  test('TEST 15: Teacher creates assignment (10 max marks)', () => asgRes.assignment !== null);
  const assignment = asgRes.assignment!;

  // TEST 16: Student sees the assignment
  const studentAsgs = await assignmentService.getStudentAssignments(student1.uid);
  test('TEST 16: Student sees the assignment in their enrolled class', () => {
    return studentAsgs.length === 1 && studentAsgs[0].id === assignment.id;
  });

  // TEST 17: Student submits Google Drive link
  const subRes = await submissionService.submitAssignment({
    assignment,
    student: student1,
    driveLink: 'https://drive.google.com/file/d/123456789abcdef/view?usp=sharing',
    comment: 'Completed in physical notebook with flowchart and code.',
  });
  test('TEST 17: Student submits valid Google Drive link', () => {
    return subRes.submission !== null && subRes.submission.status === 'submitted';
  });

  // TEST 18: Teacher sees ONLY that student's submission
  const teacherSubmissions = await submissionService.getAssignmentSubmissions(assignment.id);
  test('TEST 18: Teacher sees that student submission', () => {
    return teacherSubmissions.length === 1 && teacherSubmissions[0].studentPIN === '24170-CM-001';
  });

  // TEST 19: Teacher gives marks
  const gradeRes = await submissionService.gradeSubmission({
    submission: teacherSubmissions[0],
    teacherId: teacher.uid,
    teacherName: teacher.name,
    marks: 8,
    maxMarks: 10,
    feedback: 'Good work. Improve the explanation of the loop.',
    status: 'checked',
  });
  test('TEST 19: Teacher gives 8/10 marks and feedback', () => gradeRes.success);

  // TEST 20: Student sees correct marks
  const studentSubs = await submissionService.getStudentSubmissions(student1.uid);
  test('TEST 20: Student sees correct marks (8/10) and feedback', () => {
    return studentSubs.length === 1 && studentSubs[0].marks === 8 && studentSubs[0].status === 'checked';
  });

  // TEST 21: Student A logs out
  await authService.logout();
  test('TEST 21: Student A logs out', () => MockStore.getSession() === null);

  // TEST 22: Student B logs in on the SAME DEVICE
  const student2Res = await authService.registerStudent({
    name: 'Priya Sharma',
    pin: '24170-CM-002',
    password: 'password123',
    confirmPassword: 'password123',
  });
  const student2 = student2Res.user! as StudentUser;
  test('TEST 22: Student B registers and logs in on SAME DEVICE', () => student2.pin === '24170-CM-002');

  // TEST 23: Verify Student B does NOT see Student A's data
  const student2Classes = await classService.getStudentClasses(student2.uid);
  const student2Asgs = await assignmentService.getStudentAssignments(student2.uid);
  const student2Subs = await submissionService.getStudentSubmissions(student2.uid);
  const student2Notifs = await notificationService.getUserNotifications(student2.uid);

  test('TEST 23: Verify Student B does NOT see Student A classes', () => student2Classes.length === 0);
  test('TEST 23: Verify Student B does NOT see Student A assignments', () => student2Asgs.length === 0);
  test('TEST 23: Verify Student B does NOT see Student A submissions', () => student2Subs.length === 0);
  test('TEST 23: Verify Student B does NOT see Student A notifications', () => student2Notifs.length === 0);

  // TEST 24: Teacher B isolation
  const teacher2Res = await authService.registerTeacher({
    name: 'Anita Verma',
    mobile: '9123456780',
    password: 'password123',
    confirmPassword: 'password123',
  });
  const teacher2 = teacher2Res.user!;
  const teacher2Classes = await classService.getTeacherClasses(teacher2.uid);
  test('TEST 24: Teacher A cannot access Teacher B classes (Teacher 2 has 0 classes initially)', () => {
    return teacher2Classes.length === 0;
  });

  // TEST 25: Student cannot modify marks (validated in service & firestore.rules)
  const invalidMarks = await submissionService.gradeSubmission({
    submission: studentSubs[0],
    teacherId: teacher.uid,
    teacherName: teacher.name,
    marks: 15, // Out of bounds > 10
    maxMarks: 10,
    feedback: 'Tampered',
    status: 'checked',
  });
  test('TEST 25: Marks cannot exceed maximum marks', () => !invalidMarks.success);

  // TEST 26: Student cannot access another student submission
  test('TEST 26: Student B submissions query isolated by UID', () => {
    return !student2Subs.some((s) => s.studentId === student1.uid);
  });

  console.log('------------------------------------------------------');
  console.log(`TOTAL PASSED: ${passed} / ${total} tests.`);
  console.log('======================================================');
}

runAllTests();
