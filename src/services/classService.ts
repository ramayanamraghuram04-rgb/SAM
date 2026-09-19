import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc 
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { ClassItem, ClassMember, Semester, Department, StudentUser } from '../types';
import { MockStore } from './mockStorage';
import { academicService } from './academicService';
import { DEPARTMENT } from '../config/constants';

export const classService = {
  /**
   * Create a new class/subject
   */
  async createClass(params: {
    teacherId: string;
    teacherName: string;
    semester: Semester;
    subject: string;
  }): Promise<{ classItem: ClassItem | null; error: string | null }> {
    const { teacherId, teacherName, semester, subject } = params;
    const cleanSubject = (subject || '').trim();

    if (!cleanSubject) {
      return { classItem: null, error: 'Subject name is required.' };
    }

    if (!['1st', '3rd', '4th', '5th'].includes(semester)) {
      return { classItem: null, error: 'Invalid semester selected. Supported: 1st, 3rd, 4th, 5th.' };
    }

    const classId = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newClass: ClassItem = {
      id: classId,
      teacherId,
      teacherName,
      department: DEPARTMENT,
      semester,
      subject: cleanSubject,
      status: 'active',
      createdAt: new Date().toISOString(),
      studentCount: 0,
      assignmentCount: 0,
    };

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'classes', classId), newClass);
        return { classItem: newClass, error: null };
      } catch (err) {
        console.error('Error creating class in Firestore:', err);
        return { classItem: null, error: 'Failed to create class. Please try again.' };
      }
    } else {
      MockStore.saveClass(newClass);
      return { classItem: newClass, error: null };
    }
  },

  /**
   * Fetch all classes assigned to a specific staff/teacher
   * Dynamically resolves from both teaching assignments and classes
   */
  async getTeacherClasses(teacherId: string): Promise<ClassItem[]> {
    if (!teacherId) return [];

    try {
      // 1. Get staff classes via academicService (auto-synced with teachingAssignments)
      const staffClasses = await academicService.getStaffClasses(teacherId);

      // 2. Augment each class with studentCount (all students enrolled in that semester) and assignmentCount
      let allStudents: StudentUser[] = [];
      if (isLiveFirebaseConfigured) {
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'student'));
          const snap = await getDocs(q);
          snap.forEach((d) => allStudents.push(d.data() as StudentUser));
        } catch (e) {
          console.error('Error fetching students for count:', e);
        }
      } else {
        allStudents = MockStore.getUsers().filter((u) => u.role === 'student') as StudentUser[];
      }

      // Also get assignments for count
      let allAssignments: any[] = [];
      if (isLiveFirebaseConfigured) {
        try {
          const asgSnap = await getDocs(query(collection(db, 'assignments'), where('teacherId', '==', teacherId)));
          asgSnap.forEach((d) => allAssignments.push(d.data()));
        } catch (e) {
          console.error('Error fetching assignments for count:', e);
        }
      } else {
        allAssignments = MockStore.getAssignments().filter((a) => a.teacherId === teacherId);
      }

      return staffClasses.map((cls) => {
        const semesterStudents = allStudents.filter(
          (s) => (s.semester === cls.semester) && s.status !== 'disabled'
        );
        const classAssignments = allAssignments.filter(
          (a) => a.classId === cls.id || (a.semester === cls.semester && a.subject === cls.subject)
        );
        return {
          ...cls,
          studentCount: semesterStudents.length,
          assignmentCount: classAssignments.length,
        };
      });
    } catch (err) {
      console.error('Error in getTeacherClasses:', err);
      return [];
    }
  },

  /**
   * Fetch single class details
   */
  async getClassById(classId: string): Promise<ClassItem | null> {
    if (!classId) return null;

    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDoc(doc(db, 'classes', classId));
        return snap.exists() ? (snap.data() as ClassItem) : null;
      } catch (err) {
        console.error('Error getting class by id:', err);
        return null;
      }
    } else {
      return MockStore.getClasses().find((c) => c.id === classId) || null;
    }
  },

  /**
   * Fetch all active class subjects available for a student based on their semester
   * Automatic enrollment: A student belongs to a semester, so all subjects in that semester are automatically available!
   */
  async getStudentClasses(studentId: string, studentSemester?: Semester): Promise<ClassMember[]> {
    if (!studentId) return [];

    let targetSemester = studentSemester;

    // If semester not provided, resolve student's profile
    if (!targetSemester) {
      if (isLiveFirebaseConfigured) {
        try {
          const userSnap = await getDoc(doc(db, 'users', studentId));
          if (userSnap.exists()) {
            targetSemester = (userSnap.data() as StudentUser).semester;
          }
        } catch (err) {
          console.error('Error fetching student profile for classes:', err);
        }
      } else {
        const found = MockStore.getUserByUid(studentId) as StudentUser;
        targetSemester = found?.semester;
      }
    }

    if (!targetSemester) {
      targetSemester = '3rd'; // safe default
    }

    // Get all subjects/classes for that semester
    const semesterClasses = await academicService.getStudentSemesterClasses(targetSemester);

    // Map to ClassMember structure for compatibility with existing UI components
    return semesterClasses.map((cls) => ({
      id: `mem_${cls.id}_${studentId}`,
      classId: cls.id,
      studentId,
      studentName: 'Student',
      studentPIN: '',
      teacherId: cls.teacherId,
      subject: cls.subject,
      semester: cls.semester,
      status: 'active',
      joinedAt: cls.createdAt || new Date().toISOString(),
    }));
  },

  /**
   * Fetch all students enrolled in a class (all students in that semester)
   */
  async getClassStudents(classId: string, teacherId?: string): Promise<ClassMember[]> {
    if (!classId) return [];

    // Find class to determine semester
    const classItem = await this.getClassById(classId);
    const semester = classItem?.semester || '3rd';

    let students: StudentUser[] = [];
    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'users'), 
          where('role', '==', 'student'),
          where('semester', '==', semester)
        );
        const snap = await getDocs(q);
        snap.forEach((d) => students.push(d.data() as StudentUser));
      } catch (err) {
        console.error('Error getting class students:', err);
      }
    } else {
      students = MockStore.getUsers().filter(
        (u) => u.role === 'student' && (u as StudentUser).semester === semester
      ) as StudentUser[];
    }

    return students.map((s) => ({
      id: `mem_${classId}_${s.uid}`,
      classId,
      studentId: s.uid,
      studentName: s.name,
      studentPIN: s.pin,
      teacherId: teacherId || classItem?.teacherId || '',
      subject: classItem?.subject || '',
      semester,
      status: 'active',
      joinedAt: s.createdAt,
    }));
  },
};
