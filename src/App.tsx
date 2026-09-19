import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { AdminLoginPage } from './pages/public/AdminLoginPage';
import { TeacherLoginPage } from './pages/public/TeacherLoginPage';
import { StudentLoginPage } from './pages/public/StudentLoginPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminSubjectsPage } from './pages/admin/AdminSubjectsPage';
import { AdminTeachingAssignmentsPage } from './pages/admin/AdminTeachingAssignmentsPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

// Staff / Teacher pages
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
  | 'admin-login' 
  | 'staff-login' 
  | 'student-login';

export function App() {
  const { user, role, loading } = useAuth();

  // Public screen state
  const [publicScreen, setPublicScreen] = useState<PublicScreen>('landing');

  // Authenticated tab states
  const [adminTab, setAdminTab] = useState<string>('home');
  const [staffTab, setStaffTab] = useState<string>('home');
  const [studentTab, setStudentTab] = useState<string>('home');

  // Drilldown states for Staff
  const [selectedStaffClass, setSelectedStaffClass] = useState<ClassItem | null>(null);
  const [selectedStaffAssignment, setSelectedStaffAssignment] = useState<Assignment | null>(null);

  // Drilldown states for Student
  const [selectedStudentClass, setSelectedStudentClass] = useState<ClassMember | null>(null);
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<Assignment | null>(null);

  // Reset drilldown and tabs when authentication state changes or user changes (prevents same-device data leakage)
  useEffect(() => {
    setSelectedStaffClass(null);
    setSelectedStaffAssignment(null);
    setSelectedStudentClass(null);
    setSelectedStudentAssignment(null);
    setAdminTab('home');
    setStaffTab('home');
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

  const renderContent = () => {
    // 1. Unauthenticated Public Flow
    if (!user || !role) {
      switch (publicScreen) {
        case 'admin-login':
          return (
            <AdminLoginPage
              onSuccess={() => {}}
              onSwitchToStaff={() => setPublicScreen('staff-login')}
              onSwitchToStudent={() => setPublicScreen('student-login')}
              onBackToHome={() => setPublicScreen('landing')}
            />
          );
        case 'staff-login':
          return (
            <TeacherLoginPage
              onSuccess={() => {}}
              onSwitchToAdmin={() => setPublicScreen('admin-login')}
              onSwitchToStudent={() => setPublicScreen('student-login')}
              onBackToHome={() => setPublicScreen('landing')}
            />
          );
        case 'student-login':
          return (
            <StudentLoginPage
              onSuccess={() => {}}
              onSwitchToAdmin={() => setPublicScreen('admin-login')}
              onSwitchToStaff={() => setPublicScreen('staff-login')}
              onBackToHome={() => setPublicScreen('landing')}
            />
          );
        case 'landing':
        default:
          return (
            <LandingPage
              onGoToLogin={(r) => {
                if (r === 'admin') setPublicScreen('admin-login');
                else if (r === 'staff') setPublicScreen('staff-login');
                else setPublicScreen('student-login');
              }}
            />
          );
      }
    }

    // 2. Authenticated Admin Flow
    if (role === 'admin') {
      return (
        <AppLayout currentTab={adminTab} onSelectTab={(tab) => setAdminTab(tab)}>
          {adminTab === 'home' && (
            <AdminDashboard onNavigateTab={(tab) => setAdminTab(tab)} />
          )}
          {adminTab === 'staff' && <AdminStaffPage />}
          {adminTab === 'students' && <AdminStudentsPage />}
          {adminTab === 'subjects' && <AdminSubjectsPage />}
          {adminTab === 'teaching' && <AdminTeachingAssignmentsPage />}
          {adminTab === 'overview' && <AdminOverviewPage />}
          {adminTab === 'profile' && <AdminProfilePage />}
        </AppLayout>
      );
    }

    // 3. Authenticated Staff / Teacher Flow
    if (role === 'staff' || role === 'teacher') {
      // Handle drilldown views first
      if (selectedStaffAssignment) {
        return (
          <AppLayout currentTab={staffTab} onSelectTab={(tab) => {
            setSelectedStaffAssignment(null);
            setSelectedStaffClass(null);
            setStaffTab(tab);
          }}>
            <TeacherAssignmentDetailsPage
              assignment={selectedStaffAssignment}
              onBack={() => setSelectedStaffAssignment(null)}
            />
          </AppLayout>
        );
      }

      if (selectedStaffClass) {
        return (
          <AppLayout currentTab={staffTab} onSelectTab={(tab) => {
            setSelectedStaffClass(null);
            setStaffTab(tab);
          }}>
            <TeacherClassDetailsPage
              classItem={selectedStaffClass}
              onBack={() => setSelectedStaffClass(null)}
              onSelectAssignment={(asg) => setSelectedStaffAssignment(asg)}
            />
          </AppLayout>
        );
      }

      // Main staff tabs
      return (
        <AppLayout
          currentTab={staffTab}
          onSelectTab={(tab) => {
            setSelectedStaffClass(null);
            setSelectedStaffAssignment(null);
            setStaffTab(tab);
          }}
        >
          {staffTab === 'home' && (
            <TeacherDashboard
              onNavigateTab={(tab) => setStaffTab(tab)}
              onSelectClass={(cls) => setSelectedStaffClass(cls)}
              onSelectAssignment={(asg) => setSelectedStaffAssignment(asg)}
            />
          )}
          {staffTab === 'classes' && (
            <TeacherClassesPage
              onSelectClass={(cls) => setSelectedStaffClass(cls)}
            />
          )}
          {staffTab === 'assignments' && (
            <TeacherAssignmentsPage
              onSelectAssignment={(asg) => setSelectedStaffAssignment(asg)}
            />
          )}
          {staffTab === 'notifications' && <TeacherNotificationsPage />}
          {staffTab === 'profile' && <TeacherProfilePage />}
        </AppLayout>
      );
    }

    // 4. Authenticated Student Flow
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
  };

  return (
    <>
      {renderContent()}
      <PWAInstallBanner />
    </>
  );
}

export default App;
