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
import { Assignment, ClassItem, ClassMember } from '../types';
import { MockStore } from './mockStorage';
import { notificationService } from './notificationService';
import { classService } from './classService';
import { formatDate } from '../utils/dateUtils';

export const assignmentService = {
  /**
   * Teacher creates a new assignment for a class
   */
  async createAssignment(params: {
    classItem: ClassItem;
    teacherId: string;
    teacherName: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks?: number;
  }): Promise<{ assignment: Assignment | null; error: string | null }> {
    const { classItem, teacherId, teacherName, title, description, dueDate, maxMarks = 10 } = params;

    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();

    if (!cleanTitle) {
      return { assignment: null, error: 'Assignment title is required.' };
    }

    if (!cleanDesc) {
      return { assignment: null, error: 'Assignment question or description is required.' };
    }

    if (!dueDate) {
      return { assignment: null, error: 'Due date is required.' };
    }

    if (maxMarks <= 0 || maxMarks > 100) {
      return { assignment: null, error: 'Maximum marks must be greater than 0.' };
    }

    const assignmentId = `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAssignment: Assignment = {
      id: assignmentId,
      classId: classItem.id,
      teacherId,
      teacherName,
      semester: classItem.semester,
      subject: classItem.subject,
      title: cleanTitle,
      description: cleanDesc,
      dueDate,
      maxMarks,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'assignments', assignmentId), newAssignment);

        // Notify all enrolled students in this class
        const students = await classService.getClassStudents(classItem.id);
        for (const student of students) {
          await notificationService.createNotification({
            recipientUid: student.studentId,
            senderUid: teacherId,
            senderName: teacherName,
            type: 'assignment_new',
            title: `New Assignment: ${classItem.subject}`,
            message: `"${cleanTitle}" has been posted (Due: ${formatDate(dueDate)}).`,
            link: `/student/assignments/${assignmentId}`,
          });
        }

        return { assignment: newAssignment, error: null };
      } catch (err) {
        console.error('Error creating assignment:', err);
        return { assignment: null, error: 'Failed to create assignment. Please try again.' };
      }
    } else {
      MockStore.saveAssignment(newAssignment);

      // Notify students in mock
      const students = await classService.getClassStudents(classItem.id);
      for (const student of students) {
        await notificationService.createNotification({
          recipientUid: student.studentId,
          senderUid: teacherId,
          senderName: teacherName,
          type: 'assignment_new',
          title: `New Assignment: ${classItem.subject}`,
          message: `"${cleanTitle}" has been posted (Due: ${formatDate(dueDate)}).`,
          link: `/student/assignments/${assignmentId}`,
        });
      }

      return { assignment: newAssignment, error: null };
    }
  },

  /**
   * Fetch all assignments created by a teacher
   */
  async getTeacherAssignments(teacherId: string): Promise<Assignment[]> {
    if (!teacherId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'assignments'),
          where('teacherId', '==', teacherId)
        );
        const snap = await getDocs(q);
        const list: Assignment[] = [];
        snap.forEach((d) => list.push(d.data() as Assignment));
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.error('Error fetching teacher assignments:', err);
        return [];
      }
    } else {
      return MockStore.getAssignments()
        .filter((a) => a.teacherId === teacherId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  /**
   * Fetch all assignments for a single class
   */
  async getClassAssignments(classId: string): Promise<Assignment[]> {
    if (!classId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'assignments'),
          where('classId', '==', classId)
        );
        const snap = await getDocs(q);
        const list: Assignment[] = [];
        snap.forEach((d) => list.push(d.data() as Assignment));
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.error('Error fetching class assignments:', err);
        return [];
      }
    } else {
      return MockStore.getAssignments()
        .filter((a) => a.classId === classId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  /**
   * Fetch assignments for classes that a student is actively enrolled in
   */
  async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    if (!studentId) return [];

    const enrolledMembers = await classService.getStudentClasses(studentId);
    if (enrolledMembers.length === 0) return [];

    const classIds = enrolledMembers.map((m) => m.classId);

    if (isLiveFirebaseConfigured) {
      try {
        // In Firestore, 'in' queries allow up to 30 elements
        const chunks: string[][] = [];
        for (let i = 0; i < classIds.length; i += 10) {
          chunks.push(classIds.slice(i, i + 10));
        }

        const assignments: Assignment[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'assignments'), where('classId', 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach((d) => assignments.push(d.data() as Assignment));
        }

        return assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.error('Error fetching student assignments:', err);
        return [];
      }
    } else {
      return MockStore.getAssignments()
        .filter((a) => classIds.includes(a.classId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  /**
   * Fetch single assignment by ID
   */
  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    if (!assignmentId) return null;

    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDoc(doc(db, 'assignments', assignmentId));
        return snap.exists() ? (snap.data() as Assignment) : null;
      } catch (err) {
        console.error('Error fetching assignment by id:', err);
        return null;
      }
    } else {
      return MockStore.getAssignments().find((a) => a.id === assignmentId) || null;
    }
  },
};
