import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db, isLiveFirebaseConfigured } from '../config/firebase';
import { AppUser, TeacherUser, StudentUser, Department } from '../types';
import { isValidIndianMobile, cleanPhoneNumber, teacherPhoneToEmail } from '../utils/phoneValidator';
import { isValidStudentPIN, normalizePIN, studentPinToEmail } from '../utils/pinValidator';
import { MockStore } from './mockStorage';

const DEPARTMENT: Department = 'CSE';

export interface AuthResult {
  user: AppUser | null;
  error: string | null;
}

export const authService = {
  /**
   * Register a new Teacher
   */
  async registerTeacher(params: {
    name: string;
    mobile: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthResult> {
    const { name, mobile, password, confirmPassword } = params;

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { user: null, error: 'Full name is required.' };
    }

    if (!isValidIndianMobile(mobile)) {
      return { user: null, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }

    if (!password || password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    if (password !== confirmPassword) {
      return { user: null, error: 'Passwords do not match.' };
    }

    const cleanMobile = cleanPhoneNumber(mobile);
    const syntheticEmail = teacherPhoneToEmail(cleanMobile);

    if (isLiveFirebaseConfigured) {
      try {
        // Check if mobile already registered in Firestore
        const q = query(collection(db, 'users'), where('mobile', '==', cleanMobile));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return { user: null, error: 'Mobile number is already registered. Please log in.' };
        }

        // Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
        const uid = cred.user.uid;

        const teacherData: TeacherUser = {
          uid,
          role: 'teacher',
          name: trimmedName,
          mobile: cleanMobile,
          department: DEPARTMENT,
          createdAt: new Date().toISOString(),
        };

        // Store profile in users/{uid} and teachers/{uid}
        await setDoc(doc(db, 'users', uid), teacherData);
        await setDoc(doc(db, 'teachers', uid), teacherData);

        return { user: teacherData, error: null };
      } catch (err: any) {
        console.error('Teacher registration error:', err);
        if (err.code === 'auth/email-already-in-use') {
          return { user: null, error: 'Mobile number is already registered. Please log in.' };
        }
        return { user: null, error: 'Failed to create teacher account. Please try again.' };
      }
    } else {
      // Mock / Offline mode fallback
      const existing = MockStore.getUsers().find(
        (u) => u.role === 'teacher' && (u as TeacherUser).mobile === cleanMobile
      );
      if (existing) {
        return { user: null, error: 'Mobile number is already registered. Please log in.' };
      }

      const uid = `teacher_${cleanMobile}_${Date.now()}`;
      const teacherData: TeacherUser = {
        uid,
        role: 'teacher',
        name: trimmedName,
        mobile: cleanMobile,
        department: DEPARTMENT,
        createdAt: new Date().toISOString(),
      };

      MockStore.saveUser(teacherData, password);
      MockStore.setSession({ uid, role: 'teacher' });
      return { user: teacherData, error: null };
    }
  },

  /**
   * Teacher Login
   */
  async loginTeacher(mobile: string, password: string): Promise<AuthResult> {
    if (!mobile || !isValidIndianMobile(mobile)) {
      return { user: null, error: 'Please enter a valid 10-digit mobile number.' };
    }

    if (!password) {
      return { user: null, error: 'Password is required.' };
    }

    const cleanMobile = cleanPhoneNumber(mobile);
    const syntheticEmail = teacherPhoneToEmail(cleanMobile);

    if (isLiveFirebaseConfigured) {
      try {
        const cred = await signInWithEmailAndPassword(auth, syntheticEmail, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        
        if (!userDoc.exists()) {
          await signOut(auth);
          return { user: null, error: 'Teacher profile not found. Please register first.' };
        }

        const userData = userDoc.data() as AppUser;
        if (userData.role !== 'teacher') {
          await signOut(auth);
          return { user: null, error: 'Access denied. This account is registered as a student.' };
        }

        return { user: userData, error: null };
      } catch (err: any) {
        console.error('Teacher login error:', err);
        if (
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential' || 
          err.code === 'auth/user-not-found'
        ) {
          return { user: null, error: 'Incorrect mobile number or password.' };
        }
        return { user: null, error: 'Login failed. Please check your credentials and try again.' };
      }
    } else {
      // Mock / Offline mode fallback
      const user = MockStore.getUsers().find(
        (u) => u.role === 'teacher' && (u as TeacherUser).mobile === cleanMobile
      );

      if (!user) {
        return { user: null, error: 'Teacher account not found. Please register first.' };
      }

      if (user.passwordHash !== password) {
        return { user: null, error: 'Incorrect mobile number or password.' };
      }

      MockStore.setSession({ uid: user.uid, role: 'teacher' });
      return { user, error: null };
    }
  },

  /**
   * Register a new Student
   */
  async registerStudent(params: {
    name: string;
    pin: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthResult> {
    const { name, pin, password, confirmPassword } = params;

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { user: null, error: 'Student full name is required.' };
    }

    const normalizedPIN = normalizePIN(pin);
    if (!isValidStudentPIN(normalizedPIN)) {
      return { user: null, error: 'Invalid PIN. Please enter a valid college PIN (e.g. 24170-CM-001).' };
    }

    if (!password || password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    if (password !== confirmPassword) {
      return { user: null, error: 'Passwords do not match.' };
    }

    const syntheticEmail = studentPinToEmail(normalizedPIN);

    if (isLiveFirebaseConfigured) {
      try {
        // Check if PIN already registered in Firestore
        const q = query(collection(db, 'users'), where('pin', '==', normalizedPIN));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return { user: null, error: 'This PIN is already registered. Please log in.' };
        }

        // Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
        const uid = cred.user.uid;

        const studentData: StudentUser = {
          uid,
          role: 'student',
          name: trimmedName,
          pin: normalizedPIN,
          department: DEPARTMENT,
          createdAt: new Date().toISOString(),
        };

        // Store profile in users/{uid} and students/{uid}
        await setDoc(doc(db, 'users', uid), studentData);
        await setDoc(doc(db, 'students', uid), studentData);

        return { user: studentData, error: null };
      } catch (err: any) {
        console.error('Student registration error:', err);
        if (err.code === 'auth/email-already-in-use') {
          return { user: null, error: 'This PIN is already registered. Please log in.' };
        }
        return { user: null, error: 'Failed to create student account. Please try again.' };
      }
    } else {
      // Mock / Offline fallback
      const existing = MockStore.getUsers().find(
        (u) => u.role === 'student' && (u as StudentUser).pin === normalizedPIN
      );
      if (existing) {
        return { user: null, error: 'This PIN is already registered. Please log in.' };
      }

      const uid = `student_${normalizedPIN.replace(/[^A-Z0-9]/g, '')}_${Date.now()}`;
      const studentData: StudentUser = {
        uid,
        role: 'student',
        name: trimmedName,
        pin: normalizedPIN,
        department: DEPARTMENT,
        createdAt: new Date().toISOString(),
      };

      MockStore.saveUser(studentData, password);
      MockStore.setSession({ uid, role: 'student' });
      return { user: studentData, error: null };
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
          return { user: null, error: 'Student profile not found. Please register first.' };
        }

        const userData = userDoc.data() as AppUser;
        if (userData.role !== 'student') {
          await signOut(auth);
          return { user: null, error: 'Access denied. This account is registered as a teacher.' };
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
        return { user: null, error: 'Login failed. Please check your PIN and password.' };
      }
    } else {
      // Mock / Offline fallback
      const user = MockStore.getUsers().find(
        (u) => u.role === 'student' && (u as StudentUser).pin === normalizedPIN
      );

      if (!user) {
        return { user: null, error: 'Student PIN not found. Please register first.' };
      }

      if (user.passwordHash !== password) {
        return { user: null, error: 'Incorrect PIN or password.' };
      }

      MockStore.setSession({ uid: user.uid, role: 'student' });
      return { user, error: null };
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
   * Logout user and purge all temporary session data
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
