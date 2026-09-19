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
import { ClassItem, ClassMember, Semester, Department } from '../types';
import { MockStore } from './mockStorage';

const DEPARTMENT: Department = 'CSE';

export const classService = {
  /**
   * Teacher creates a new class/subject
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
   * Fetch all classes owned by a specific teacher
   */
  async getTeacherClasses(teacherId: string): Promise<ClassItem[]> {
    if (!teacherId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'classes'),
          where('teacherId', '==', teacherId),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        const classes: ClassItem[] = [];
        snap.forEach((d) => classes.push(d.data() as ClassItem));

        // Augment with counts
        for (const cls of classes) {
          const memberQ = query(
            collection(db, 'classMembers'), 
            where('teacherId', '==', teacherId),
            where('classId', '==', cls.id)
          );
          const memberSnap = await getDocs(memberQ);
          cls.studentCount = memberSnap.size;

          const assignQ = query(collection(db, 'assignments'), where('classId', '==', cls.id));
          const assignSnap = await getDocs(assignQ);
          cls.assignmentCount = assignSnap.size;
        }

        return classes;
      } catch (err) {
        console.error('Error fetching teacher classes:', err);
        return [];
      }
    } else {
      const classes = MockStore.getClasses().filter(
        (c) => c.teacherId === teacherId && c.status === 'active'
      );
      const members = MockStore.getMembers();
      const assignments = MockStore.getAssignments();

      return classes.map((c) => ({
        ...c,
        studentCount: members.filter((m) => m.classId === c.id).length,
        assignmentCount: assignments.filter((a) => a.classId === c.id).length,
      }));
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
   * Fetch all active class memberships for a student
   */
  async getStudentClasses(studentId: string): Promise<ClassMember[]> {
    if (!studentId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'classMembers'),
          where('studentId', '==', studentId),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        const list: ClassMember[] = [];
        snap.forEach((d) => list.push(d.data() as ClassMember));
        return list;
      } catch (err) {
        console.error('Error fetching student classes:', err);
        return [];
      }
    } else {
      return MockStore.getMembers().filter(
        (m) => m.studentId === studentId && m.status === 'active'
      );
    }
  },

  /**
   * Fetch all enrolled students in a class
   */
  async getClassStudents(classId: string, teacherId?: string): Promise<ClassMember[]> {
    if (!classId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const constraints: any[] = [
          where('classId', '==', classId),
          where('status', '==', 'active')
        ];
        if (teacherId) {
          constraints.unshift(where('teacherId', '==', teacherId));
        }
        const q = query(collection(db, 'classMembers'), ...constraints);
        const snap = await getDocs(q);
        const list: ClassMember[] = [];
        snap.forEach((d) => list.push(d.data() as ClassMember));
        return list;
      } catch (err) {
        console.error('Error getting class students:', err);
        return [];
      }
    } else {
      return MockStore.getMembers().filter(
        (m) => m.classId === classId && m.status === 'active'
      );
    }
  },
};
