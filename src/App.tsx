import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { TeacherLoginPage } from './pages/public/TeacherLoginPage';
import { TeacherRegisterPage } from './pages/public/TeacherRegisterPage';
import { StudentLoginPage } from './pages/public/StudentLoginPage';
import { StudentRegisterPage } from './pages/public/StudentRegisterPage';

// Teacher pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherClassesPage } from './pages/teacher/TeacherClassesPage';
import { TeacherClassDetailsPage } from './pages/teacher/TeacherClassDetailsPage';
import { TeacherAssignmentsPage } from './pages/teacher/TeacherAssignmentsPage';
import { TeacherAssignmentDetailsPage } from './pages/teacher/TeacherAssignmentDetailsPage';
import { TeacherNotificationsPage } from './pages/teacher/TeacherNotificationsPage';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentClassesPage } from './pages/student/StudentClassesPage';
import { StudentClassDetailsPage } from './pages/student/StudentClassDetailsPage';
import { StudentAssignmentsPage } from './pages/student/StudentAssignmentsPage';
import { StudentAssignmentDetailsPage } from './pages/student/StudentAssignmentDetailsPage';
import { StudentMarksPage } from './pages/student/StudentMarksPage';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

import { ClassItem, ClassMember, Assignment } from './types';

type PublicScreen = 
  | 'landing' 
  | 'teacher-login' 
  | 'teacher-register' 
  | 'student-login' 
  | 'student-register';

export function App() {
  const { user, role, loading } = useAuth();

  // Public screen state
  const [publicScreen, setPublicScreen] = useState<PublicScreen>('landing');

  // Authenticated tab states
  const [teacherTab, setTeacherTab] = useState<string>('home');
  const [studentTab, setStudentTab] = useState<string>('home');

  // Drilldown states for Teacher
  const [selectedTeacherClass, setSelectedTeacherClass] = useState<ClassItem | null>(null);
  const [selectedTeacherAssignment, setSelectedTeacherAssignment] = useState<Assignment | null>(null);

  // Drilldown states for Student
  const [selectedStudentClass, setSelectedStudentClass] = useState<ClassMember | null>(null);
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<Assignment | null>(null);

  // Reset drilldown and tabs when authentication state changes or user changes (prevents same-device leakage)
  useEffect(() => {
    setSelectedTeacherClass(null);
    setSelectedTeacherAssignment(null);
    setSelectedStudentClass(null);
    setSelectedStudentAssignment(null);
    setTeacherTab('home');
    setStudentTab('home');
    if (!user) {
      setPublicScreen('landing');
    }
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoadingSpinner message="Starting SAM..." />
      </div>
    );
  }

  // 1. Unauthenticated Public Flow
  if (!user || !role) {
    switch (publicScreen) {
      case 'teacher-login':
        return (
          <TeacherLoginPage
            onSuccess={() => {}}
            onGoToRegister={() => setPublicScreen('teacher-register')}
            onSwitchToStudent={() => setPublicScreen('student-login')}
            onBackToHome={() => setPublicScreen('landing')}
          />
        );
      case 'teacher-register':
        return (
          <TeacherRegisterPage
            onSuccess={() => {}}
            onGoToLogin={() => setPublicScreen('teacher-login')}
            onBackToHome={() => setPublicScreen('landing')}
          />
        );
      case 'student-login':
        return (
          <StudentLoginPage
            onSuccess={() => {}}
            onGoToRegister={() => setPublicScreen('student-register')}
            onSwitchToTeacher={() => setPublicScreen('teacher-login')}
            onBackToHome={() => setPublicScreen('landing')}
          />
        );
      case 'student-register':
        return (
          <StudentRegisterPage
            onSuccess={() => {}}
            onGoToLogin={() => setPublicScreen('student-login')}
            onBackToHome={() => setPublicScreen('landing')}
          />
        );
      case 'landing':
      default:
        return (
          <LandingPage
            onSelectRole={(r) =>
              setPublicScreen(r === 'teacher' ? 'teacher-login' : 'student-login')
            }
            onGoToLogin={(r) =>
              setPublicScreen(r === 'teacher' ? 'teacher-login' : 'student-login')
            }
            onGoToRegister={(r) =>
              setPublicScreen(r === 'teacher' ? 'teacher-register' : 'student-register')
            }
          />
        );
    }
  }

  // 2. Authenticated Teacher Flow
  if (role === 'teacher') {
    // Handle drilldown views first
    if (selectedTeacherAssignment) {
      return (
        <AppLayout currentTab={teacherTab} onSelectTab={(tab) => {
          setSelectedTeacherAssignment(null);
          setSelectedTeacherClass(null);
          setTeacherTab(tab);
        }}>
          <TeacherAssignmentDetailsPage
            assignment={selectedTeacherAssignment}
            onBack={() => setSelectedTeacherAssignment(null)}
          />
        </AppLayout>
      );
    }

    if (selectedTeacherClass) {
      return (
        <AppLayout currentTab={teacherTab} onSelectTab={(tab) => {
          setSelectedTeacherClass(null);
          setTeacherTab(tab);
        }}>
          <TeacherClassDetailsPage
            classItem={selectedTeacherClass}
            onBack={() => setSelectedTeacherClass(null)}
            onSelectAssignment={(asg) => setSelectedTeacherAssignment(asg)}
          />
        </AppLayout>
      );
    }

    // Main teacher tabs
    return (
      <AppLayout
        currentTab={teacherTab}
        onSelectTab={(tab) => {
          setSelectedTeacherClass(null);
          setSelectedTeacherAssignment(null);
          setTeacherTab(tab);
        }}
      >
        {teacherTab === 'home' && (
          <TeacherDashboard
            onNavigateTab={(tab) => setTeacherTab(tab)}
            onSelectClass={(cls) => setSelectedTeacherClass(cls)}
            onSelectAssignment={(asg) => setSelectedTeacherAssignment(asg)}
          />
        )}
        {teacherTab === 'classes' && (
          <TeacherClassesPage
            onSelectClass={(cls) => setSelectedTeacherClass(cls)}
          />
        )}
        {teacherTab === 'assignments' && (
          <TeacherAssignmentsPage
            onSelectAssignment={(asg) => setSelectedTeacherAssignment(asg)}
          />
        )}
        {teacherTab === 'notifications' && <TeacherNotificationsPage />}
        {teacherTab === 'profile' && <TeacherProfilePage />}
      </AppLayout>
    );
  }

  // 3. Authenticated Student Flow
  if (role === 'student') {
    if (selectedStudentAssignment) {
      return (
        <AppLayout currentTab={studentTab} onSelectTab={(tab) => {
          setSelectedStudentAssignment(null);
          setSelectedStudentClass(null);
          setStudentTab(tab);
        }}>
          <StudentAssignmentDetailsPage
            assignment={selectedStudentAssignment}
            onBack={() => setSelectedStudentAssignment(null)}
          />
        </AppLayout>
      );
    }

    if (selectedStudentClass) {
      return (
        <AppLayout currentTab={studentTab} onSelectTab={(tab) => {
          setSelectedStudentClass(null);
          setStudentTab(tab);
        }}>
          <StudentClassDetailsPage
            classMember={selectedStudentClass}
            onBack={() => setSelectedStudentClass(null)}
            onSelectAssignment={(asg) => setSelectedStudentAssignment(asg)}
          />
        </AppLayout>
      );
    }

    // Main student tabs
    return (
      <AppLayout
        currentTab={studentTab}
        onSelectTab={(tab) => {
          setSelectedStudentClass(null);
          setSelectedStudentAssignment(null);
          setStudentTab(tab);
        }}
      >
        {studentTab === 'home' && (
          <StudentDashboard
            onNavigateTab={(tab) => setStudentTab(tab)}
            onSelectAssignment={(asg) => setSelectedStudentAssignment(asg)}
          />
        )}
        {studentTab === 'classes' && (
          <StudentClassesPage
            onSelectClass={(cls) => setSelectedStudentClass(cls)}
          />
        )}
        {studentTab === 'assignments' && (
          <StudentAssignmentsPage
            onSelectAssignment={(asg) => setSelectedStudentAssignment(asg)}
          />
        )}
        {studentTab === 'marks' && <StudentMarksPage />}
        {studentTab === 'notifications' && <StudentNotificationsPage />}
        {studentTab === 'profile' && <StudentProfilePage />}
      </AppLayout>
    );
  }

  return null;
}

export default App;
