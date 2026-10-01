import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { Assignment, AssignmentStatus, ClassItem, StudentUser, Semester, Department } from '../types';
import { MockStore } from './mockStorage';
import { notificationService } from './notificationService';
import { academicService } from './academicService';
import { classService } from './classService';
import { formatDate } from '../utils/dateUtils';
import { DEPARTMENT } from '../config/constants';

function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

export const assignmentService = {
  /**
   * Validate if Staff is authorized to teach this subject and class
   */
  async verifyStaffTeachingAuthorization(staffId: string, semester: Semester, subject: string): Promise<boolean> {
    if (!staffId) return false;
    try {
      const authorizedAssignments = await academicService.getStaffTeachingAssignments(staffId);
      if (authorizedAssignments.length === 0) {
        // Fallback check against staff classes
        const classes = await academicService.getStaffClasses(staffId);
        return classes.some(
          (c) => c.semester === semester && c.subject.trim().toLowerCase() === subject.trim().toLowerCase()
        );
      }
      return authorizedAssignments.some(
        (ta) => 
          ta.semester === semester && 
          (ta.subjectName?.trim().toLowerCase() === subject.trim().toLowerCase() ||
           ta.subjectId === subject)
      );
    } catch (err) {
      console.error('Error verifying staff teaching authorization:', err);
      return false;
    }
  },

  /**
   * Staff/Teacher creates a new assignment for an authorized class/subject
   * Supports 'draft' and 'published' / 'active' states.
   */
  async createAssignment(params: {
    classItem: ClassItem;
    teacherId: string;
    teacherName: string;
    title: string;
    description: string;
    instructions?: string;
    dueDate: string;
    maxMarks?: number;
    status?: AssignmentStatus;
    published?: boolean;
    isAdminOverride?: boolean;
    questionImageUrl?: string;
    questionImageUrls?: string[];
    questionImages?: { url: string; publicId?: string; createdAt?: string }[];
    driveLink?: string;
  }): Promise<{ assignment: Assignment | null; error: string | null }> {
    let { 
      classItem, 
      teacherId, 
      teacherName, 
      title, 
      description, 
      instructions = '',
      dueDate, 
      maxMarks = 10,
      status = 'published',
      published = true,
      isAdminOverride = false,
      questionImageUrl,
      questionImageUrls,
      questionImages,
      driveLink,
    } = params;

    if (!questionImageUrl && questionImageUrls && questionImageUrls.length > 0) {
      questionImageUrl = questionImageUrls[0];
    }

    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();
    const cleanInst = (instructions || '').trim();

    if (!teacherId) {
      return { assignment: null, error: 'Staff authentication identity is required.' };
    }

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
      return { assignment: null, error: 'Maximum marks must be between 1 and 100.' };
    }

    // Authorization verification: staff must have admin-assigned teaching relationship
    if (!isAdminOverride) {
      const isAuthorized = await this.verifyStaffTeachingAuthorization(
        teacherId,
        classItem.semester,
        classItem.subject
      );
      if (!isAuthorized) {
        return { 
          assignment: null, 
          error: `Unauthorized: You are not assigned by Administrator to teach "${classItem.subject}" for ${classItem.semester} Semester.` 
        };
      }
    }

    const isPublished = published !== undefined ? published : (status !== 'draft');
    const finalStatus: AssignmentStatus = isPublished ? 'published' : 'draft';
    const nowIso = new Date().toISOString();

    const assignmentId = `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const primaryQuestionImageUrl = questionImageUrl?.trim() || (questionImageUrls && questionImageUrls.length > 0 ? questionImageUrls[0] : undefined);
    const resolvedQuestionImageUrls = (questionImageUrls && questionImageUrls.length > 0)
      ? questionImageUrls
      : (primaryQuestionImageUrl ? [primaryQuestionImageUrl] : undefined);
    const resolvedQuestionImages = (questionImages && questionImages.length > 0)
      ? questionImages
      : (resolvedQuestionImageUrls ? resolvedQuestionImageUrls.map(url => ({ url, createdAt: nowIso })) : undefined);

    const newAssignment: Assignment = {
      id: assignmentId,
      classId: classItem.id,
      teacherId,
      staffId: teacherId,
      teacherName: teacherName || 'Faculty',
      semester: classItem.semester,
      department: classItem.department || DEPARTMENT,
      subjectId: (classItem as any).subjectId || classItem.subject,
      subject: classItem.subject,
      title: cleanTitle,
      description: cleanDesc,
      instructions: cleanInst,
      dueDate,
      maxMarks,
      status: finalStatus,
      published: isPublished,
      createdAt: nowIso,
      questionImageUrl: questionImageUrl?.trim() || undefined,
      questionImageUrls: resolvedQuestionImageUrls,
      questionImages: resolvedQuestionImages,
      driveLink: driveLink?.trim() || undefined,
    };

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'assignments', assignmentId), cleanFirestoreData(newAssignment));

        // Only notify students if the assignment is actually published (never notify for drafts)
        if (isPublished) {
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
        }

        return { assignment: newAssignment, error: null };
      } catch (err: any) {
        console.error('Error creating assignment in Firestore:', err);
        return { assignment: null, error: err.message || 'Failed to create assignment. Please try again.' };
      }
    } else {
      MockStore.saveAssignment(newAssignment);

      if (isPublished) {
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
      }

      return { assignment: newAssignment, error: null };
    }
  },

  /**
   * Update an existing assignment (Staff can only update own assignments; Admin can update any)
   */
  async updateAssignment(
    assignmentId: string, 
    userId: string, 
    updates: Partial<Assignment>, 
    isAdmin: boolean = false
  ): Promise<{ assignment: Assignment | null; error: string | null }> {
    if (!assignmentId || !userId) {
      return { assignment: null, error: 'Assignment ID and User ID are required.' };
    }

    const existing = await this.getAssignmentById(assignmentId);
    if (!existing) {
      return { assignment: null, error: 'Assignment not found.' };
    }

    // Enforce ownership: Staff can only edit their own assignments
    const isOwner = (existing.staffId && existing.staffId === userId) || existing.teacherId === userId;
    if (!isAdmin && !isOwner) {
      return { assignment: null, error: 'Unauthorized: You can only edit assignments you created.' };
    }

    const wasDraft = !existing.published || existing.status === 'draft';
    const willPublish = updates.published === true || (updates.status && updates.status !== 'draft');

    const updatedAssignment: Assignment = {
      ...existing,
      ...updates,
      id: existing.id,
      teacherId: existing.teacherId,
      staffId: existing.staffId || existing.teacherId,
      updatedAt: new Date().toISOString(),
    };

    if (updates.published !== undefined) {
      updatedAssignment.published = updates.published;
      if (updates.published && updatedAssignment.status === 'draft') {
        updatedAssignment.status = 'published';
      }
    }

    if (updates.questionImageUrl !== undefined) {
      if (updates.questionImageUrl && updates.questionImageUrl.trim()) {
        updatedAssignment.questionImageUrl = updates.questionImageUrl.trim();
        if (!updatedAssignment.questionImageUrls || updatedAssignment.questionImageUrls.length === 0) {
          updatedAssignment.questionImageUrls = [updates.questionImageUrl.trim()];
        }
      } else {
        delete updatedAssignment.questionImageUrl;
        delete updatedAssignment.questionImageUrls;
      }
    }

    if (updates.questionImageUrls !== undefined) {
      if (updates.questionImageUrls && updates.questionImageUrls.length > 0) {
        updatedAssignment.questionImageUrls = updates.questionImageUrls;
        updatedAssignment.questionImageUrl = updates.questionImageUrls[0];
      } else {
        delete updatedAssignment.questionImageUrls;
      }
    }

    if (updates.questionImages !== undefined) {
      if (updates.questionImages && updates.questionImages.length > 0) {
        updatedAssignment.questionImages = updates.questionImages;
      } else {
        delete updatedAssignment.questionImages;
      }
    }

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'assignments', assignmentId), cleanFirestoreData(updatedAssignment));

        // If transitioning from draft to published, dispatch notifications to target class
        if (wasDraft && willPublish) {
          const students = await classService.getClassStudents(existing.classId);
          for (const student of students) {
            await notificationService.createNotification({
              recipientUid: student.studentId,
              senderUid: existing.teacherId,
              senderName: existing.teacherName,
              type: 'assignment_new',
              title: `New Assignment: ${existing.subject}`,
              message: `"${updatedAssignment.title}" has been published (Due: ${formatDate(updatedAssignment.dueDate)}).`,
              link: `/student/assignments/${assignmentId}`,
            });
          }
        }

        return { assignment: updatedAssignment, error: null };
      } catch (err: any) {
        console.error('Error updating assignment in Firestore:', err);
        return { assignment: null, error: err.message || 'Failed to update assignment.' };
      }
    } else {
      MockStore.saveAssignment(updatedAssignment);
      return { assignment: updatedAssignment, error: null };
    }
  },

  /**
   * Publish a draft assignment
   */
  async publishAssignment(
    assignmentId: string, 
    userId: string, 
    isAdmin: boolean = false
  ): Promise<{ assignment: Assignment | null; error: string | null }> {
    return this.updateAssignment(
      assignmentId, 
      userId, 
      { published: true, status: 'published' }, 
      isAdmin
    );
  },

  /**
   * Close an assignment (no longer accepting new submissions)
   */
  async closeAssignment(
    assignmentId: string, 
    userId: string, 
    isAdmin: boolean = false
  ): Promise<{ assignment: Assignment | null; error: string | null }> {
    return this.updateAssignment(
      assignmentId, 
      userId, 
      { status: 'closed' }, 
      isAdmin
    );
  },

  /**
   * Archive an assignment
   */
  async archiveAssignment(
    assignmentId: string, 
    userId: string, 
    isAdmin: boolean = false
  ): Promise<{ assignment: Assignment | null; error: string | null }> {
    return this.updateAssignment(
      assignmentId, 
      userId, 
      { status: 'archived' }, 
      isAdmin
    );
  },

  /**
   * Safe Delete: Never permanently delete assignments with existing student submissions.
   * Archives instead if submissions exist.
   */
  async deleteAssignment(
    assignmentId: string, 
    userId: string, 
    isAdmin: boolean = false
  ): Promise<{ success: boolean; error: string | null }> {
    if (!assignmentId || !userId) {
      return { success: false, error: 'Assignment ID and User ID are required.' };
    }

    const existing = await this.getAssignmentById(assignmentId);
    if (!existing) {
      return { success: false, error: 'Assignment not found.' };
    }

    const isOwner = (existing.staffId && existing.staffId === userId) || existing.teacherId === userId;
    if (!isAdmin && !isOwner) {
      return { success: false, error: 'Unauthorized: You can only delete assignments you created.' };
    }

    // Check for existing submissions
    let existingSubmissions: any[] = [];
    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDocs(
          query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId))
        );
        existingSubmissions = snap.docs;
      } catch (e) {
        console.error('Error checking submissions for assignment delete:', e);
      }
    } else {
      existingSubmissions = MockStore.getSubmissions().filter((s) => s.assignmentId === assignmentId);
    }

    if (existingSubmissions.length > 0) {
      // Historical submissions exist: archive instead of permanent deletion
      await this.archiveAssignment(assignmentId, userId, isAdmin);
      return { 
        success: false, 
        error: 'This assignment contains historical student submissions and cannot be permanently deleted. It has been archived instead.' 
      };
    }

    if (isLiveFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'assignments', assignmentId));
        return { success: true, error: null };
      } catch (err: any) {
        console.error('Error deleting assignment from Firestore:', err);
        return { success: false, error: err.message || 'Failed to delete assignment.' };
      }
    } else {
      MockStore.deleteAssignment(assignmentId);
      return { success: true, error: null };
    }
  },

  /**
   * Fetch all assignments created by a specific staff member
   * Supports filtering by lifecycle status ('all' | 'published' | 'draft' | 'closed' | 'archived')
   */
  async getTeacherAssignments(
    teacherId: string, 
    filterStatus?: 'all' | 'published' | 'draft' | 'closed' | 'archived'
  ): Promise<Assignment[]> {
    if (!teacherId) return [];

    let list: Assignment[] = [];
    if (isLiveFirebaseConfigured) {
      try {
        // Query by teacherId
        const q1 = query(collection(db, 'assignments'), where('teacherId', '==', teacherId));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => list.push(d.data() as Assignment));

        // Also query by staffId in case documents use staffId
        const q2 = query(collection(db, 'assignments'), where('staffId', '==', teacherId));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => {
          if (!list.some((a) => a.id === d.id)) {
            list.push(d.data() as Assignment);
          }
        });
      } catch (err) {
        console.error('Error fetching teacher assignments:', err);
        return [];
      }
    } else {
      list = MockStore.getAssignments().filter(
        (a) => a.teacherId === teacherId || a.staffId === teacherId
      );
    }

    // Filter by status if specified
    if (filterStatus && filterStatus !== 'all') {
      if (filterStatus === 'draft') {
        list = list.filter((a) => a.status === 'draft' || a.published === false);
      } else if (filterStatus === 'published') {
        list = list.filter((a) => (a.status === 'published' || a.status === 'active') && a.published !== false);
      } else {
        list = list.filter((a) => a.status === filterStatus);
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Fetch assignments for a single class
   */
  async getClassAssignments(classId: string): Promise<Assignment[]> {
    if (!classId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(collection(db, 'assignments'), where('classId', '==', classId));
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
   * EXACT CLASS TARGETING: Fetch assignments for a student based strictly on their authorized class & semester.
   *
   * Rules:
   * 1. Authoritative Identity: Firebase Auth UID is resolved to Student profile.
   * 2. Draft assignments are NEVER shown to students (published === true / status !== 'draft').
   * 3. Assignments belonging to unrelated classes/semesters are NEVER shown to students.
   * 4. Department must match 'CSE'.
   */
  async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    if (!studentId) return [];

    let studentProfile: StudentUser | null = null;
    if (isLiveFirebaseConfigured) {
      try {
        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (userDoc.exists()) {
          studentProfile = userDoc.data() as StudentUser;
        } else {
          const studentDoc = await getDoc(doc(db, 'students', studentId));
          if (studentDoc.exists()) {
            studentProfile = studentDoc.data() as StudentUser;
          }
        }
      } catch (err) {
        console.error('Error resolving student profile for assignments:', err);
      }
    } else {
      studentProfile = (MockStore.getUserByUid(studentId) as StudentUser) || null;
    }

    const targetSemester: Semester = studentProfile?.semester || '3rd';
    const targetClassId: string = studentProfile?.classId || '';
    const targetDepartment: Department = studentProfile?.department || DEPARTMENT;

    let assignments: Assignment[] = [];
    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'assignments'), 
          where('semester', '==', targetSemester)
        );
        const snap = await getDocs(q);
        snap.forEach((d) => assignments.push(d.data() as Assignment));
      } catch (err) {
        console.error('Error fetching student assignments by semester:', err);
        return [];
      }
    } else {
      assignments = MockStore.getAssignments().filter((a) => a.semester === targetSemester);
    }

    // STRICT FILTERING:
    // 1. Exclude drafts completely (Draft assignments must NEVER appear to students)
    // 2. Exact class targeting: Must match student's semester, classId if defined, and department.
    const visibleAssignments = assignments.filter((a) => {
      // Exclude drafts
      if (a.status === 'draft' || a.published === false) {
        return false;
      }

      // Department check
      if (a.department && a.department !== targetDepartment) {
        return false;
      }

      // Semester check
      if (a.semester !== targetSemester) {
        return false;
      }

      // If assignment has a specific classId and student has a specific classId, check matching
      if (targetClassId && a.classId && a.classId !== targetClassId) {
        // Also allow if classId corresponds to targetSemester
        if (!a.classId.includes(targetSemester)) {
          return false;
        }
      }

      return true;
    });

    return visibleAssignments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Fetch all assignments across all classes/semesters (for Admin overview)
   * Supports filtering by staffId, semester, status, and search query.
   */
  async getAllAssignments(filters?: {
    staffId?: string;
    semester?: string;
    status?: string;
    search?: string;
  }): Promise<Assignment[]> {
    let list: Assignment[] = [];

    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(db, 'assignments'));
        snap.forEach((d) => list.push(d.data() as Assignment));
      } catch (err) {
        console.error('Error getting all assignments:', err);
        return [];
      }
    } else {
      list = [...MockStore.getAssignments()];
    }

    if (filters) {
      const { staffId, semester, status, search } = filters;
      if (staffId && staffId !== 'all') {
        list = list.filter((a) => a.staffId === staffId || a.teacherId === staffId);
      }
      if (semester && semester !== 'all') {
        list = list.filter((a) => a.semester === semester);
      }
      if (status && status !== 'all') {
        if (status === 'draft') {
          list = list.filter((a) => a.status === 'draft' || a.published === false);
        } else if (status === 'published') {
          list = list.filter((a) => (a.status === 'published' || a.status === 'active') && a.published !== false);
        } else {
          list = list.filter((a) => a.status === status);
        }
      }
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.subject.toLowerCase().includes(q) ||
            (a.teacherName || '').toLowerCase().includes(q)
        );
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Fetch a single assignment by ID
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
