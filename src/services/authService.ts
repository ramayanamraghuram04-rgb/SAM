import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword,
  User as FirebaseUser,
  getAuth
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db, firebaseConfig, isLiveFirebaseConfigured } from '../config/firebase';
import { AppUser, AdminUser, StaffUser, StudentUser, Department, Semester, UserStatus } from '../types';
import { isValidIndianMobile, cleanPhoneNumber, teacherPhoneToEmail } from '../utils/phoneValidator';
import { isValidStudentPIN, normalizePIN, studentPinToEmail } from '../utils/pinValidator';
import { MockStore } from './mockStorage';
import { academicService } from './academicService';

const DEPARTMENT: Department = 'CSE';

export interface AuthResult {
  user: AppUser | null;
  error: string | null;
}

export function adminPhoneToEmail(mobile: string): string {
  const clean = cleanPhoneNumber(mobile);
  return `admin_${clean}@sam.internal`;
}

export function staffPhoneToEmail(mobile: string): string {
  const clean = cleanPhoneNumber(mobile);
  return `staff_${clean}@sam.internal`;
}

export const authService = {
  /**
   * Compatibility alias for Teacher login
   */
  async loginTeacher(mobile: string, password: string): Promise<AuthResult> {
    return this.loginStaff(mobile, password);
  },

  /**
   * Compatibility alias for Staff/Teacher registration
   */
  async registerTeacher(params: { name: string; mobile: string; password: string; confirmPassword?: string }): Promise<AuthResult> {
    const res = await this.createStaffAccount({
      name: params.name,
      mobile: params.mobile,
      password: params.password,
    });
    return { user: res.user, error: res.error };
  },

  /**
   * Compatibility alias for Student registration
   */
  async registerStudent(params: { name: string; pin: string; password: string; confirmPassword?: string; semester?: Semester }): Promise<AuthResult> {
    const res = await this.createStudentAccount({
      name: params.name,
      pin: params.pin,
      password: params.password,
      semester: params.semester || '3rd',
    });
    return { user: res.user, error: res.error };
  },
  /**
   * Admin Login
   */
  async loginAdmin(mobile: string, password: string): Promise<AuthResult> {
    if (!mobile || !isValidIndianMobile(mobile)) {
      return { user: null, error: 'Please enter a valid 10-digit mobile number.' };
    }

    if (!password) {
      return { user: null, error: 'Password is required.' };
    }

    const cleanMobile = cleanPhoneNumber(mobile);
    const syntheticEmail = adminPhoneToEmail(cleanMobile);

    if (isLiveFirebaseConfigured) {
      try {
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, syntheticEmail, password);
        } catch (signInErr: any) {
          if (
            (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') &&
            password.length >= 6
          ) {
            try {
              cred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
              const adminData: AdminUser = {
                uid: cred.user.uid,
                role: 'admin',
                name: 'Raghuram (Admin)',
                mobile: cleanMobile,
                department: DEPARTMENT,
                status: 'active',
                createdAt: new Date().toISOString(),
              };
              await setDoc(doc(db, 'users', cred.user.uid), adminData);
              return { user: adminData, error: null };
            } catch (createErr: any) {
              if (createErr.code !== 'auth/email-already-in-use') {
                throw createErr;
              }
            }
          }
          throw signInErr;
        }

        let userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (!userDoc.exists()) {
          const adminData: AdminUser = {
            uid: cred.user.uid,
            role: 'admin',
            name: 'Raghuram (Admin)',
            mobile: cleanMobile,
            department: DEPARTMENT,
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', cred.user.uid), adminData);
          return { user: adminData, error: null };
        }

        const userData = userDoc.data() as AppUser;
        if (userData.role !== 'admin') {
          await signOut(auth);
          return { user: null, error: 'Access denied. Account is not registered as Admin.' };
        }

        if (userData.status === 'disabled') {
          await signOut(auth);
          return { user: null, error: 'This admin account has been disabled. Contact system supervisor.' };
        }

        return { user: userData, error: null };
      } catch (err: any) {
        console.error('Admin login error:', err);
        if (
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential' || 
          err.code === 'auth/user-not-found'
        ) {
          return { user: null, error: 'Incorrect mobile number or password.' };
        }
        return { user: null, error: err.message || 'Login failed. Please verify credentials.' };
      }
    } else {
      // Mock / Offline mode fallback
      let user = MockStore.getUsers().find(
        (u) => u.role === 'admin' && (u as AdminUser).mobile === cleanMobile
      );

      // Auto-bootstrap default mock admin if not present
      if (!user && password.length >= 6) {
        const uid = `admin_${cleanMobile}_${Date.now()}`;
        const adminData: AdminUser = {
          uid,
          role: 'admin',
          name: 'System Admin',
          mobile: cleanMobile,
          department: DEPARTMENT,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        MockStore.saveUser(adminData, password);
        user = { ...adminData, passwordHash: password } as any;
      }

      if (!user) {
        return { user: null, error: 'Admin account not found.' };
      }

      if ((user as any).passwordHash !== password) {
        return { user: null, error: 'Incorrect mobile number or password.' };
      }

      if (user.status === 'disabled') {
        return { user: null, error: 'This admin account is disabled.' };
      }

      MockStore.setSession({ uid: user.uid, role: 'admin' });
      return { user, error: null };
    }
  },

  /**
   * Staff / Teacher Login
   */
  async loginStaff(mobile: string, password: string): Promise<AuthResult> {
    if (!mobile || !isValidIndianMobile(mobile)) {
      return { user: null, error: 'Please enter a valid 10-digit mobile number.' };
    }

    if (!password) {
      return { user: null, error: 'Password is required.' };
    }

    const cleanMobile = cleanPhoneNumber(mobile);
    const staffEmail = staffPhoneToEmail(cleanMobile);
    const legacyTeacherEmail = teacherPhoneToEmail(cleanMobile);

    if (isLiveFirebaseConfigured) {
      try {
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, staffEmail, password);
        } catch (err: any) {
          // Fallback to legacy teacher email if staff account was registered previously
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            try {
              cred = await signInWithEmailAndPassword(auth, legacyTeacherEmail, password);
            } catch (legacyErr) {
              throw err;
            }
          } else {
            throw err;
          }
        }

        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (!userDoc.exists()) {
          await signOut(auth);
          return { user: null, error: 'Staff profile not found. Accounts are created by the Admin.' };
        }

        const userData = userDoc.data() as AppUser;
        if (userData.role !== 'staff' && userData.role !== 'teacher') {
          await signOut(auth);
          return { user: null, error: 'Access denied. Account is not registered as Staff.' };
        }

        if (userData.status === 'disabled') {
          await signOut(auth);
          return { user: null, error: 'Your Staff account has been disabled by Admin.' };
        }

        return { user: userData, error: null };
      } catch (err: any) {
        console.error('Staff login error:', err);
        if (
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential' || 
          err.code === 'auth/user-not-found'
        ) {
          return { user: null, error: 'Incorrect mobile number or password.' };
        }
        return { user: null, error: 'Login failed. Please check your credentials or contact Admin.' };
      }
    } else {
      // Mock fallback
      const user = MockStore.getUsers().find(
        (u) => (u.role === 'staff' || u.role === 'teacher') && (u as StaffUser).mobile === cleanMobile
      );

      if (!user) {
        return { user: null, error: 'Staff account not found. Please contact Admin.' };
      }

      if ((user as any).passwordHash !== password) {
        return { user: null, error: 'Incorrect mobile number or password.' };
      }

      if (user.status === 'disabled') {
        return { user: null, error: 'Your Staff account has been disabled by Admin.' };
      }

      MockStore.setSession({ uid: user.uid, role: 'staff' });
      return { user, error: null };
    }
  },

  /**
   * Student Login
   */
  async loginStudent(pin: string, password: string): Promise<AuthResult> {
    const normalizedPIN = normalizePIN(pin);
    if (!normalizedPIN || !isValidStudentPIN(normalizedPIN)) {
      return { user: null, error: 'Please enter a valid student PIN (e.g. 24170-CM-001).' };
    }

    if (!password) {
      return { user: null, error: 'Password is required.' };
    }

    const syntheticEmail = studentPinToEmail(normalizedPIN);

    if (isLiveFirebaseConfigured) {
      try {
        const cred = await signInWithEmailAndPassword(auth, syntheticEmail, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));

        if (!userDoc.exists()) {
          await signOut(auth);
          return { user: null, error: 'Student profile not found. Accounts are created by the Admin.' };
        }

        const userData = userDoc.data() as AppUser;
        if (userData.role !== 'student') {
          await signOut(auth);
          return { user: null, error: 'Access denied. Account is not registered as Student.' };
        }

        if (userData.status === 'disabled') {
          await signOut(auth);
          return { user: null, error: 'Your Student account has been disabled by Admin.' };
        }

        return { user: userData, error: null };
      } catch (err: any) {
        console.error('Student login error:', err);
        if (
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential' || 
          err.code === 'auth/user-not-found'
        ) {
          return { user: null, error: 'Incorrect PIN or password.' };
        }
        return { user: null, error: 'Login failed. Please check your PIN and password or contact Admin.' };
      }
    } else {
      // Mock fallback
      const user = MockStore.getUsers().find(
        (u) => u.role === 'student' && (u as StudentUser).pin === normalizedPIN
      );

      if (!user) {
        return { user: null, error: 'Student PIN not found. Please contact Admin.' };
      }

      if ((user as any).passwordHash !== password) {
        return { user: null, error: 'Incorrect PIN or password.' };
      }

      if (user.status === 'disabled') {
        return { user: null, error: 'Your Student account has been disabled by Admin.' };
      }

      MockStore.setSession({ uid: user.uid, role: 'student' });
      return { user, error: null };
    }
  },

  /**
   * Admin Action: Create Staff Account
   * Supports assigning multiple subjects across multiple semesters to a single Staff account!
   */
  async createStaffAccount(params: {
    name: string;
    mobile: string;
    password: string;
    teachingAssignments?: Array<{
      semester: Semester;
      subjectId: string;
      subjectName: string;
    }>;
  }): Promise<{ user: StaffUser | null; error: string | null }> {
    const { name, mobile, password, teachingAssignments = [] } = params;

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return { user: null, error: 'Staff name is required.' };
    }

    if (!isValidIndianMobile(mobile)) {
      return { user: null, error: 'Valid 10-digit Indian mobile number is required.' };
    }

    if (!password || password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    const cleanMobile = cleanPhoneNumber(mobile);
    const syntheticEmail = staffPhoneToEmail(cleanMobile);

    if (isLiveFirebaseConfigured) {
      // Use secondary Firebase app to create user without disrupting the current Admin session!
      let secondaryApp;
      try {
        const tempAppName = `SAM_TempCreate_${Date.now()}_${Math.random()}`;
        secondaryApp = initializeApp(firebaseConfig, tempAppName);
        const secondaryAuth = getAuth(secondaryApp);

        const cred = await createUserWithEmailAndPassword(secondaryAuth, syntheticEmail, password);
        const uid = cred.user.uid;

        const staffData: StaffUser = {
          uid,
          role: 'staff',
          name: trimmedName,
          mobile: cleanMobile,
          department: DEPARTMENT,
          status: 'active',
          assignedSubjects: teachingAssignments.map((t) => t.subjectName),
          assignedSemesters: Array.from(new Set(teachingAssignments.map((t) => t.semester))),
          createdAt: new Date().toISOString(),
        };

        // Save in users/{uid}, staff/{uid} and legacy teachers/{uid}
        await setDoc(doc(db, 'users', uid), staffData);
        await setDoc(doc(db, 'staff', uid), staffData);
        await setDoc(doc(db, 'teachers', uid), staffData);

        // Assign teaching classes in Firestore
        for (const ta of teachingAssignments) {
          await academicService.assignStaffToSubject({
            staffId: uid,
            staffName: trimmedName,
            staffMobile: cleanMobile,
            semester: ta.semester,
            subjectId: ta.subjectId,
            subjectName: ta.subjectName,
          });
        }

        return { user: staffData, error: null };
      } catch (err: any) {
        console.error('Error creating staff account in Firebase:', err);
        if (err.code === 'auth/email-already-in-use') {
          return { user: null, error: 'A staff member with this mobile number already exists.' };
        }
        return { user: null, error: err.message || 'Failed to create staff account.' };
      } finally {
        if (secondaryApp) {
          try { await deleteApp(secondaryApp); } catch (_) {}
        }
      }
    } else {
      // Mock mode
      const existing = MockStore.getUsers().find(
        (u) => (u.role === 'staff' || u.role === 'teacher') && (u as StaffUser).mobile === cleanMobile
      );
      if (existing) {
        return { user: null, error: 'A staff member with this mobile number already exists.' };
      }

      const uid = `staff_${cleanMobile}_${Date.now()}`;
      const staffData: StaffUser = {
        uid,
        role: 'staff',
        name: trimmedName,
        mobile: cleanMobile,
        department: DEPARTMENT,
        status: 'active',
        assignedSubjects: teachingAssignments.map((t) => t.subjectName),
        assignedSemesters: Array.from(new Set(teachingAssignments.map((t) => t.semester))),
        createdAt: new Date().toISOString(),
      };

      MockStore.saveUser(staffData, password);

      for (const ta of teachingAssignments) {
        await academicService.assignStaffToSubject({
          staffId: uid,
          staffName: trimmedName,
          staffMobile: cleanMobile,
          semester: ta.semester,
          subjectId: ta.subjectId,
          subjectName: ta.subjectName,
        });
      }

      return { user: staffData, error: null };
    }
  },

  /**
   * Admin Action: Create Student Account
   */
  async createStudentAccount(params: {
    name: string;
    pin: string;
    password: string;
    semester: Semester;
  }): Promise<{ user: StudentUser | null; error: string | null }> {
    const { name, pin, password, semester } = params;

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return { user: null, error: 'Student full name is required.' };
    }

    const normalizedPIN = normalizePIN(pin);
    if (!isValidStudentPIN(normalizedPIN)) {
      return { user: null, error: 'Please enter a valid student PIN (e.g. 24170-CM-001).' };
    }

    if (!password || password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    if (!['1st', '3rd', '4th', '5th'].includes(semester)) {
      return { user: null, error: 'Please select a valid semester (1st, 3rd, 4th, 5th).' };
    }

    const syntheticEmail = studentPinToEmail(normalizedPIN);

    if (isLiveFirebaseConfigured) {
      let secondaryApp;
      try {
        const tempAppName = `SAM_TempStudent_${Date.now()}_${Math.random()}`;
        secondaryApp = initializeApp(firebaseConfig, tempAppName);
        const secondaryAuth = getAuth(secondaryApp);

        const cred = await createUserWithEmailAndPassword(secondaryAuth, syntheticEmail, password);
        const uid = cred.user.uid;

        const studentData: StudentUser = {
          uid,
          role: 'student',
          name: trimmedName,
          pin: normalizedPIN,
          semester,
          department: DEPARTMENT,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', uid), studentData);
        await setDoc(doc(db, 'students', uid), studentData);

        return { user: studentData, error: null };
      } catch (err: any) {
        console.error('Error creating student in Firebase:', err);
        if (err.code === 'auth/email-already-in-use') {
          return { user: null, error: 'A student with this PIN already exists in the system.' };
        }
        return { user: null, error: err.message || 'Failed to create student account.' };
      } finally {
        if (secondaryApp) {
          try { await deleteApp(secondaryApp); } catch (_) {}
        }
      }
    } else {
      // Mock mode
      const existing = MockStore.getUsers().find(
        (u) => u.role === 'student' && (u as StudentUser).pin === normalizedPIN
      );
      if (existing) {
        return { user: null, error: 'A student with this PIN already exists in the system.' };
      }

      const uid = `student_${normalizedPIN.replace(/[^A-Z0-9]/g, '')}_${Date.now()}`;
      const studentData: StudentUser = {
        uid,
        role: 'student',
        name: trimmedName,
        pin: normalizedPIN,
        semester,
        department: DEPARTMENT,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      MockStore.saveUser(studentData, password);
      return { user: studentData, error: null };
    }
  },

  /**
   * Admin Action: Toggle account status (Enable / Disable)
   */
  async toggleUserStatus(uid: string, newStatus: UserStatus): Promise<{ success: boolean; error: string | null }> {
    if (!uid) return { success: false, error: 'User ID is required.' };

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', uid), { status: newStatus });
        // Attempt mirror updates in staff/students
        getDoc(doc(db, 'staff', uid)).then(snap => {
          if (snap.exists()) updateDoc(doc(db, 'staff', uid), { status: newStatus }).catch(() => {});
        }).catch(() => {});
        getDoc(doc(db, 'students', uid)).then(snap => {
          if (snap.exists()) updateDoc(doc(db, 'students', uid), { status: newStatus }).catch(() => {});
        }).catch(() => {});
        return { success: true, error: null };
      } catch (err: any) {
        console.error('Error updating user status:', err);
        return { success: false, error: err.message || 'Failed to update status.' };
      }
    } else {
      MockStore.updateUserStatus(uid, newStatus);
      return { success: true, error: null };
    }
  },

  /**
   * Admin Action: Delete Staff Account
   */
  async deleteStaffAccount(uid: string): Promise<{ success: boolean; error: string | null }> {
    if (!uid) return { success: false, error: 'User ID is required.' };

    MockStore.deleteUser(uid);
    try {
      const taList = await academicService.getAllTeachingAssignments();
      for (const ta of taList.filter(t => t.staffId === uid)) {
        await academicService.deleteTeachingAssignment(ta.id);
      }
    } catch {}

    if (isLiveFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'users', uid)).catch(() => {});
        await deleteDoc(doc(db, 'staff', uid)).catch(() => {});
        await deleteDoc(doc(db, 'teachers', uid)).catch(() => {});
        return { success: true, error: null };
      } catch (err: any) {
        console.warn('Error deleting staff from cloud, removed locally:', err.message);
        return { success: true, error: null };
      }
    }
    return { success: true, error: null };
  },

  /**
   * Admin Action: Update Staff Account (Name, Mobile, Password)
   */
  async updateStaffAccount(
    uid: string, 
    params: { name?: string; mobile?: string; password?: string }
  ): Promise<{ success: boolean; error: string | null }> {
    if (!uid) return { success: false, error: 'User ID is required.' };

    const updatePayload: any = {};
    if (params.name?.trim()) updatePayload.name = params.name.trim();
    if (params.mobile?.trim()) {
      const clean = cleanPhoneNumber(params.mobile);
      if (isValidIndianMobile(clean)) {
        updatePayload.mobile = clean;
      }
    }

    MockStore.updateUserData(uid, {
      ...updatePayload,
      ...(params.password ? { passwordHash: params.password } : {})
    });

    if (isLiveFirebaseConfigured) {
      try {
        if (Object.keys(updatePayload).length > 0) {
          await updateDoc(doc(db, 'users', uid), updatePayload).catch(() => {});
          await updateDoc(doc(db, 'staff', uid), updatePayload).catch(() => {});
          await updateDoc(doc(db, 'teachers', uid), updatePayload).catch(() => {});
        }
        return { success: true, error: null };
      } catch (err: any) {
        console.warn('Staff update cloud error, updated locally:', err.message);
        return { success: true, error: null };
      }
    }
    return { success: true, error: null };
  },

  /**
   * Admin Action: Delete Student Account
   */
  async deleteStudentAccount(uid: string): Promise<{ success: boolean; error: string | null }> {
    if (!uid) return { success: false, error: 'User ID is required.' };

    MockStore.deleteUser(uid);

    if (isLiveFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'users', uid)).catch(() => {});
        await deleteDoc(doc(db, 'students', uid)).catch(() => {});
        return { success: true, error: null };
      } catch (err: any) {
        console.warn('Error deleting student from cloud, removed locally:', err.message);
        return { success: true, error: null };
      }
    }
    return { success: true, error: null };
  },

  /**
   * Admin Action: Update Student Account (Name, PIN, Semester, Password)
   */
  async updateStudentAccount(
    uid: string, 
    params: { name?: string; pin?: string; semester?: Semester; password?: string }
  ): Promise<{ success: boolean; error: string | null }> {
    if (!uid) return { success: false, error: 'User ID is required.' };

    const updatePayload: any = {};
    if (params.name?.trim()) updatePayload.name = params.name.trim();
    if (params.semester) updatePayload.semester = params.semester;
    if (params.pin?.trim()) {
      const norm = normalizePIN(params.pin);
      if (isValidStudentPIN(norm)) {
        updatePayload.pin = norm;
      }
    }

    MockStore.updateUserData(uid, {
      ...updatePayload,
      ...(params.password ? { passwordHash: params.password } : {})
    });

    if (isLiveFirebaseConfigured) {
      try {
        if (Object.keys(updatePayload).length > 0) {
          await updateDoc(doc(db, 'users', uid), updatePayload).catch(() => {});
          await updateDoc(doc(db, 'students', uid), updatePayload).catch(() => {});
        }
        return { success: true, error: null };
      } catch (err: any) {
        console.warn('Student update cloud error, updated locally:', err.message);
        return { success: true, error: null };
      }
    }
    return { success: true, error: null };
  },

  /**
   * Admin Action: Update Admin's Own Profile (Name, Mobile, Password)
   */
  async updateAdminProfile(
    uid: string,
    params: { name?: string; mobile?: string; newPassword?: string }
  ): Promise<{ success: boolean; error: string | null }> {
    if (!uid) return { success: false, error: 'Admin UID is required.' };

    const updatePayload: any = {};
    if (params.name?.trim()) updatePayload.name = params.name.trim();
    if (params.mobile?.trim()) {
      const clean = cleanPhoneNumber(params.mobile);
      if (isValidIndianMobile(clean)) {
        updatePayload.mobile = clean;
      }
    }

    MockStore.updateUserData(uid, {
      ...updatePayload,
      ...(params.newPassword ? { passwordHash: params.newPassword } : {})
    });

    if (isLiveFirebaseConfigured) {
      try {
        if (params.newPassword && params.newPassword.length >= 6 && auth.currentUser) {
          try {
            await updatePassword(auth.currentUser, params.newPassword);
          } catch (pwdErr: any) {
            console.warn('Could not update Auth password directly (may require recent login):', pwdErr.message);
          }
        }

        if (Object.keys(updatePayload).length > 0) {
          await updateDoc(doc(db, 'users', uid), updatePayload);
        }
        return { success: true, error: null };
      } catch (err: any) {
        console.error('Error updating admin profile:', err);
        return { success: false, error: err.message || 'Failed to update admin profile.' };
      }
    }
    return { success: true, error: null };
  },

  /**
   * Fetch all staff members (for Admin dashboard)
   */
  async getAllStaff(): Promise<StaffUser[]> {
    if (isLiveFirebaseConfigured) {
      try {
        const q = query(collection(db, 'users'), where('role', 'in', ['staff', 'teacher']));
        const snap = await getDocs(q);
        const list: StaffUser[] = [];
        snap.forEach((d) => list.push(d.data() as StaffUser));
        return list.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        console.error('Error fetching staff list:', err);
        return [];
      }
    } else {
      return MockStore.getUsers().filter(
        (u) => u.role === 'staff' || u.role === 'teacher'
      ) as StaffUser[];
    }
  },

  /**
   * Fetch all students (for Admin dashboard)
   */
  async getAllStudents(): Promise<StudentUser[]> {
    if (isLiveFirebaseConfigured) {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        const list: StudentUser[] = [];
        snap.forEach((d) => list.push(d.data() as StudentUser));
        return list.sort((a, b) => a.pin.localeCompare(b.pin));
      } catch (err) {
        console.error('Error fetching student list:', err);
        return [];
      }
    } else {
      return MockStore.getUsers().filter((u) => u.role === 'student') as StudentUser[];
    }
  },

  /**
   * Fetch user profile by UID
   */
  async getUserProfile(uid: string): Promise<AppUser | null> {
    if (!uid) return null;

    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? (snap.data() as AppUser) : null;
      } catch (err) {
        console.error('Failed to get user profile', err);
        return null;
      }
    } else {
      return MockStore.getUserByUid(uid);
    }
  },

  /**
   * Logout user and purge all temporary session data to eliminate same-device bleed
   */
  async logout(): Promise<void> {
    try {
      if (isLiveFirebaseConfigured) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      MockStore.clearSession();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('sam_current_auth_session');
      }
    }
  },
};
