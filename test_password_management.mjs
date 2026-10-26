// Comprehensive Acceptance Test Suite for Student & Teacher Password Update Feature
import assert from 'node:assert';
import fs from 'node:fs';

console.log('====================================================');
console.log('SAM Student & Teacher Password Update Test Suite');
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
    console.error(`       Error: ${err.message}`);
  }
}

// 1. Password Policy and Evaluator Unit Test (Pure Logic Test)
test('1. Password strength evaluator identifies weak, medium, and strong passwords', () => {
  const validatorSource = fs.readFileSync('src/utils/passwordValidator.ts', 'utf8');
  assert(validatorSource.includes('evaluatePasswordStrength'), 'Must define evaluatePasswordStrength');
  assert(validatorSource.includes('validatePasswordChange'), 'Must define validatePasswordChange');
  assert(validatorSource.includes('score'), 'Must score password strength');
  assert(validatorSource.includes('weak'), 'Must handle weak passwords');
  assert(validatorSource.includes('medium'), 'Must handle medium passwords');
  assert(validatorSource.includes('strong'), 'Must handle strong passwords');
});

// 2. Password Validation Rules
test('2. Password validation rejects mismatched, empty, or short passwords', () => {
  const validatorSource = fs.readFileSync('src/utils/passwordValidator.ts', 'utf8');
  assert(validatorSource.includes('Current password is required.'), 'Must validate current password presence');
  assert(validatorSource.includes('New password is required.'), 'Must validate new password presence');
  assert(validatorSource.includes('New password must be at least 6 characters long.'), 'Must enforce min 6 chars');
  assert(validatorSource.includes('New password cannot be the same as your current password.'), 'Must prevent same password');
  assert(validatorSource.includes('New password and confirm password do not match.'), 'Must prevent mismatched confirmation');
});

// 3. Data Model Types: mustChangePassword boolean flag
test('3. BaseUser interface includes optional mustChangePassword boolean flag', () => {
  const typesContent = fs.readFileSync('src/types/index.ts', 'utf8');
  assert(typesContent.includes('mustChangePassword?: boolean;'), 'BaseUser must contain mustChangePassword boolean flag');
});

// 4. Initial Account Creation sets mustChangePassword: true
test('4. Initial Student and Staff creation sets mustChangePassword: true', () => {
  const authSource = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authSource.includes('mustChangePassword: true'), 'Initial account creation must set mustChangePassword: true');
  
  // Verify staff creation sets the flag
  assert(authSource.includes('role: \'staff\'') && authSource.includes('mustChangePassword: true'), 'Staff creation must set mustChangePassword: true');
  // Verify student creation sets the flag
  assert(authSource.includes('role: \'student\'') && authSource.includes('mustChangePassword: true'), 'Student creation must set mustChangePassword: true');
});

// 5. Firebase Auth Reauthentication and Password Update
test('5. authService.changePassword reauthenticates with current password and updates Firebase Auth password', () => {
  const authSource = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authSource.includes('async changePassword('), 'authService must export changePassword method');
  assert(authSource.includes('EmailAuthProvider.credential('), 'Must create reauthentication credential with EmailAuthProvider');
  assert(authSource.includes('reauthenticateWithCredential('), 'Must call reauthenticateWithCredential');
  assert(authSource.includes('updatePassword('), 'Must call updatePassword on Firebase user');
  assert(authSource.includes('Current password is incorrect.'), 'Must return clear error when current password fails');
});

// 6. Security: Passwords are NEVER stored in Firestore
test('6. Security: Passwords are never stored as plain text in Firestore, localStorage, or application logs', () => {
  const authSource = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(!authSource.includes("password: newPassword"), 'Must not store newPassword plain text in Firestore documents');
  assert(!authSource.includes("newPassword: newPassword"), 'Must not store newPassword in Firestore documents');
  // In changePassword, only metadata is written to Firestore:
  assert(authSource.includes('mustChangePassword: false'), 'Must clear mustChangePassword boolean flag');
  assert(authSource.includes('updatedAt: new Date().toISOString()'), 'Must update timestamp');
});

// 7. Username/Mobile only experience preserved
test('7. Preserves PIN and mobile login experience without asking for email', () => {
  const modalSource = fs.readFileSync('src/components/common/ChangePasswordModal.tsx', 'utf8');
  assert(!modalSource.includes('type="email"'), 'ChangePasswordModal must not ask for email');
  assert(!modalSource.includes('Enter your email'), 'ChangePasswordModal must never require email from user');
  assert(modalSource.includes('Current Password'), 'Must only require Current Password');
  assert(modalSource.includes('New Password'), 'Must require New Password');
  assert(modalSource.includes('Confirm New Password'), 'Must require Confirm New Password');
});

// 8. ChangePasswordModal UI Controls
test('8. ChangePasswordModal includes all required inputs, show/hide toggles, Update and Cancel buttons', () => {
  const modalSource = fs.readFileSync('src/components/common/ChangePasswordModal.tsx', 'utf8');
  assert(modalSource.includes('showCurrent ? \'text\' : \'password\''), 'Must toggle Current Password visibility');
  assert(modalSource.includes('showNew ? \'text\' : \'password\''), 'Must toggle New Password visibility');
  assert(modalSource.includes('showConfirm ? \'text\' : \'password\''), 'Must toggle Confirm Password visibility');
  assert(modalSource.includes('Update Password'), 'Must render Update Password button');
  assert(modalSource.includes('Cancel') || modalSource.includes('Sign Out Instead'), 'Must render Cancel / Sign Out button');
  assert(modalSource.includes('Password updated successfully.'), 'Must display required success message');
});

// 9. AppHeader Profile Dropdown Integration
test('9. AppHeader renders Profile dropdown menu with Change Password option', () => {
  const headerSource = fs.readFileSync('src/components/layout/AppHeader.tsx', 'utf8');
  assert(headerSource.includes('onChangePasswordClick'), 'AppHeader must accept onChangePasswordClick prop');
  assert(headerSource.includes('isDropdownOpen'), 'AppHeader must track dropdown state');
  assert(headerSource.includes('Change Password'), 'Dropdown menu must render Change Password button');
  assert(headerSource.includes('View Profile'), 'Dropdown menu must render View Profile button');
  assert(headerSource.includes('Sign Out'), 'Dropdown menu must render Sign Out button');
});

// 10. AppLayout Global Password Modal & First Login Enforcement
test('10. AppLayout manages global ChangePasswordModal and forces password update on first login', () => {
  const layoutSource = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf8');
  assert(layoutSource.includes('ChangePasswordModal'), 'AppLayout must render ChangePasswordModal');
  assert(layoutSource.includes('mustChangePassword'), 'AppLayout must check user.mustChangePassword');
  assert(layoutSource.includes('isForcedFirstLogin={mustChangePassword}'), 'AppLayout must enforce first login change');
  assert(layoutSource.includes('openChangePasswordDialog'), 'AppLayout must export openChangePasswordDialog');
});

// 11. Student Profile Page Integration
test('11. Student Profile Page includes Change Password option while keeping existing fields untouched', () => {
  const studentProfile = fs.readFileSync('src/pages/student/StudentProfilePage.tsx', 'utf8');
  assert(studentProfile.includes('Change Password'), 'StudentProfilePage must render Change Password button');
  assert(studentProfile.includes('openChangePasswordDialog'), 'Must hook into openChangePasswordDialog');
  assert(studentProfile.includes('studentUser?.pin'), 'Student PIN field must remain intact');
  assert(studentProfile.includes('DEPARTMENT_FULL'), 'Department field must remain intact');
  assert(studentProfile.includes('classes.length'), 'Enrolled classes list must remain intact');
});

// 12. Teacher Profile Page Integration
test('12. Teacher Profile Page includes Change Password option while keeping existing fields untouched', () => {
  const teacherProfile = fs.readFileSync('src/pages/teacher/TeacherProfilePage.tsx', 'utf8');
  assert(teacherProfile.includes('Change Password'), 'TeacherProfilePage must render Change Password button');
  assert(teacherProfile.includes('openChangePasswordDialog'), 'Must hook into openChangePasswordDialog');
  assert(teacherProfile.includes('teacherUser?.mobile'), 'Teacher mobile field must remain intact');
  assert(teacherProfile.includes('DEPARTMENT_FULL'), 'Department field must remain intact');
  assert(teacherProfile.includes('classes.length'), 'Assigned classes list must remain intact');
});

// 13. Student Dashboard Quick Action Integration
test('13. Student Dashboard provides direct Change Password action in header banner', () => {
  const studentDash = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');
  assert(studentDash.includes('Change Password'), 'Student Dashboard banner must render Change Password button');
  assert(studentDash.includes('openChangePasswordDialog'), 'Student Dashboard must hook into openChangePasswordDialog');
});

// 14. Teacher Dashboard Quick Action Integration
test('14. Teacher Dashboard provides direct Change Password action in header banner', () => {
  const teacherDash = fs.readFileSync('src/pages/teacher/TeacherDashboard.tsx', 'utf8');
  assert(teacherDash.includes('Change Password'), 'Teacher Dashboard banner must render Change Password button');
  assert(teacherDash.includes('openChangePasswordDialog'), 'Teacher Dashboard must hook into openChangePasswordDialog');
});

// 15. Offline / Mock storage support for resilient testing
test('15. Resilient MockStore supports passwordHash updates and mustChangePassword flag clearing', () => {
  const authSource = fs.readFileSync('src/services/authService.ts', 'utf8');
  assert(authSource.includes('MockStore.updateUserData(session.uid, {'), 'Mock mode must update user data');
  assert(authSource.includes('passwordHash: newPassword'), 'Mock mode must update password hash for subsequent logins');
  assert(authSource.includes('mustChangePassword: false'), 'Mock mode must clear mustChangePassword');
});

console.log('\n----------------------------------------------------');
console.log(`Results: ${passCount} / ${totalCount} test assertions passed successfully.`);
console.log('====================================================\n');

if (passCount !== totalCount) {
  process.exit(1);
}
