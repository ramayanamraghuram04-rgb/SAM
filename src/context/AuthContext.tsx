import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, isLiveFirebaseConfigured } from '../config/firebase';
import { AppUser, TeacherUser, StudentUser, UserRole } from '../types';
import { authService } from '../services/authService';
import { MockStore } from '../services/mockStorage';

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  teacherUser: TeacherUser | null;
  studentUser: StudentUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserManually: (user: AppUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user profile safely based strictly on authenticated UID
  const loadProfile = useCallback(async (uid: string) => {
    try {
      const profile = await authService.getUserProfile(uid);
      setUser(profile);
    } catch (err) {
      console.error('Failed to load profile for UID:', uid, err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (user?.uid) {
      await loadProfile(user.uid);
    }
  }, [user?.uid, loadProfile]);

  const logout = useCallback(async () => {
    // 1. Immediately clear memory state
    setUser(null);
    // 2. Perform service logout
    await authService.logout();
    setLoading(false);
  }, []);

  const setUserManually = useCallback((newUser: AppUser | null) => {
    setUser(newUser);
    if (newUser) {
      MockStore.setSession({ uid: newUser.uid, role: newUser.role });
    } else {
      MockStore.clearSession();
    }
  }, []);

  useEffect(() => {
    if (isLiveFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          await loadProfile(firebaseUser.uid);
        } else {
          setUser(null);
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } else {
      // Mock / Offline session recovery
      const session = MockStore.getSession();
      if (session?.uid) {
        loadProfile(session.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, [loadProfile]);

  const role = user?.role || null;
  const teacherUser = user?.role === 'teacher' ? (user as TeacherUser) : null;
  const studentUser = user?.role === 'student' ? (user as StudentUser) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        teacherUser,
        studentUser,
        loading,
        logout,
        refreshUser,
        setUserManually,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
