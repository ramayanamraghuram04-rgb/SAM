import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { Subject, TeachingAssignment, Semester, Department, ClassItem } from '../types';
import { SUGGESTED_SUBJECTS, DEPARTMENT } from '../config/constants';
import { MockStore } from './mockStorage';

export const academicService = {
  /**
   * Seed default CSE subjects if database is empty
   */
  async seedDefaultSubjects(): Promise<void> {
    const existing = await this.getAllSubjects();
    if (existing.length > 0) return;

    for (const [sem, subjects] of Object.entries(SUGGESTED_SUBJECTS)) {
      const semester = sem as Semester;
      for (const subjectName of subjects) {
        await this.createSubject({
          name: subjectName,
          semester,
        });
      }
    }
  },

  /**
   * Get all registered subjects
   */
  async getAllSubjects(): Promise<Subject[]> {
    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(db, 'subjects'));
        const list: Subject[] = [];
        snap.forEach((d) => list.push(d.data() as Subject));
        return list.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        console.error('Error getting subjects:', err);
        return [];
      }
    } else {
      return MockStore.getSubjects();
    }
  },

  /**
   * Get subjects filtered by semester
   */
  async getSubjectsBySemester(semester: Semester): Promise<Subject[]> {
    const all = await this.getAllSubjects();
    return all.filter((s) => s.semester === semester);
  },

  /**
   * Create a new subject
   */
  async createSubject(params: {
    name: string;
    semester: Semester;
    code?: string;
  }): Promise<{ subject: Subject | null; error: string | null }> {
    const { name, semester, code } = params;
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return { subject: null, error: 'Subject name is required.' };
    }

    if (!['1st', '3rd', '4th', '5th'].includes(semester)) {
      return { subject: null, error: 'Invalid semester.' };
    }

    const subjectId = `subj_${semester.toLowerCase()}_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}_${Date.now() % 10000}`;

    const newSubject: Subject = {
      id: subjectId,
      name: cleanName,
      code: code?.trim() || undefined,
      semester,
      department: DEPARTMENT,
      createdAt: new Date().toISOString(),
    };

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'subjects', subjectId), newSubject);
        return { subject: newSubject, error: null };
      } catch (err: any) {
        console.error('Error creating subject:', err);
        return { subject: null, error: err.message || 'Failed to create subject.' };
      }
    } else {
      MockStore.saveSubject(newSubject);
      return { subject: newSubject, error: null };
    }
  },

  /**
   * Delete a subject
   */
  async deleteSubject(subjectId: string): Promise<{ success: boolean; error: string | null }> {
    if (!subjectId) return { success: false, error: 'Subject ID is required.' };

    if (isLiveFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'subjects', subjectId));
        return { success: true, error: null };
      } catch (err: any) {
        console.error('Error deleting subject:', err);
        return { success: false, error: err.message || 'Failed to delete subject.' };
      }
    } else {
      MockStore.deleteSubject(subjectId);
      return { success: true, error: null };
    }
  },

  /**
   * Assign a Staff member to teach a Semester + Subject
   */
  async assignStaffToSubject(params: {
    staffId: string;
    staffName: string;
    staffMobile: string;
    semester: Semester;
    subjectId: string;
    subjectName: string;
  }): Promise<{ assignment: TeachingAssignment | null; error: string | null }> {
    const { staffId, staffName, staffMobile, semester, subjectId, subjectName } = params;

    if (!staffId || !subjectId) {
      return { assignment: null, error: 'Staff and Subject are required.' };
    }

    // Check if duplicate assignment exists
    const existing = await this.getAllTeachingAssignments();
    const isDuplicate = existing.some(
      (a) => a.staffId === staffId && a.semester === semester && a.subjectId === subjectId
    );
    if (isDuplicate) {
      return { assignment: null, error: 'This subject is already assigned to this staff member.' };
    }

    const assignmentId = `ta_${staffId.slice(0, 8)}_${semester}_${subjectId.slice(0, 10)}_${Date.now() % 10000}`;

    const newAssignment: TeachingAssignment = {
      id: assignmentId,
      staffId,
      staffName,
      staffMobile,
      semester,
      subjectId,
      subjectName,
      department: DEPARTMENT,
      createdAt: new Date().toISOString(),
    };

    // Also create/sync corresponding ClassItem so existing classes/assignments/submissions logic works seamlessly
    const classId = `cls_${semester}_${subjectId}_${staffId}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const classItem: ClassItem = {
      id: classId,
      teacherId: staffId,
      teacherName: staffName,
      department: DEPARTMENT,
      semester,
      subject: subjectName,
      status: 'active',
      createdAt: new Date().toISOString(),
      studentCount: 0,
      assignmentCount: 0,
    };

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'teachingAssignments', assignmentId), newAssignment);
        await setDoc(doc(db, 'classes', classId), classItem);
        return { assignment: newAssignment, error: null };
      } catch (err: any) {
        console.error('Error assigning staff:', err);
        return { assignment: null, error: err.message || 'Failed to assign staff.' };
      }
    } else {
      MockStore.saveTeachingAssignment(newAssignment);
      MockStore.saveClass(classItem);
      return { assignment: newAssignment, error: null };
    }
  },

  /**
   * Delete a teaching assignment
   */
  async deleteTeachingAssignment(id: string): Promise<{ success: boolean; error: string | null }> {
    if (!id) return { success: false, error: 'ID is required.' };

    if (isLiveFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'teachingAssignments', id));
        return { success: true, error: null };
      } catch (err: any) {
        console.error('Error removing teaching assignment:', err);
        return { success: false, error: err.message || 'Failed to remove assignment.' };
      }
    } else {
      MockStore.deleteTeachingAssignment(id);
      return { success: true, error: null };
    }
  },

  /**
   * Get all teaching assignments
   */
  async getAllTeachingAssignments(): Promise<TeachingAssignment[]> {
    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(db, 'teachingAssignments'));
        const list: TeachingAssignment[] = [];
        snap.forEach((d) => list.push(d.data() as TeachingAssignment));
        return list;
      } catch (err) {
        console.error('Error getting teaching assignments:', err);
        return [];
      }
    } else {
      return MockStore.getTeachingAssignments();
    }
  },

  /**
   * Get all teaching assignments for a specific staff member
   */
  async getStaffTeachingAssignments(staffId: string): Promise<TeachingAssignment[]> {
    if (!staffId) return [];
    const all = await this.getAllTeachingAssignments();
    return all.filter((a) => a.staffId === staffId);
  },

  /**
   * Get all classes for a staff member (derived from teaching assignments + classes)
   */
  async getStaffClasses(staffId: string): Promise<ClassItem[]> {
    if (!staffId) return [];
    
    // Fetch staff teaching assignments
    const assignments = await this.getStaffTeachingAssignments(staffId);
    
    // Fetch classes and assignments for count calculation
    let allClasses: ClassItem[] = [];
    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', staffId)));
        snap.forEach((d) => allClasses.push(d.data() as ClassItem));
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    } else {
      allClasses = MockStore.getClasses().filter((c) => c.teacherId === staffId);
    }

    // Ensure each teaching assignment has a corresponding ClassItem
    const result: ClassItem[] = [];
    for (const ta of assignments) {
      let matching = allClasses.find((c) => c.semester === ta.semester && c.subject === ta.subjectName);
      if (!matching) {
        const classId = `cls_${ta.semester}_${ta.subjectId}_${ta.staffId}`.replace(/[^a-zA-Z0-9_]/g, '_');
        matching = {
          id: classId,
          teacherId: ta.staffId,
          teacherName: ta.staffName,
          department: DEPARTMENT,
          semester: ta.semester,
          subject: ta.subjectName,
          status: 'active',
          createdAt: ta.createdAt,
          studentCount: 0,
          assignmentCount: 0,
        };
        if (isLiveFirebaseConfigured) {
          setDoc(doc(db, 'classes', classId), matching).catch(console.error);
        } else {
          MockStore.saveClass(matching);
        }
      }
      result.push(matching);
    }

    return result;
  },

  /**
   * Get all classes/subjects available to a student based on semester
   * Automatic enrollment: All subjects in the student's semester are available!
   */
  async getStudentSemesterClasses(semester: Semester): Promise<ClassItem[]> {
    if (!semester) return [];

    let allClasses: ClassItem[] = [];
    if (isLiveFirebaseConfigured) {
      try {
        const q = query(collection(db, 'classes'), where('semester', '==', semester), where('status', '==', 'active'));
        const snap = await getDocs(q);
        snap.forEach((d) => allClasses.push(d.data() as ClassItem));
      } catch (err) {
        console.error('Error fetching student semester classes:', err);
      }
    } else {
      allClasses = MockStore.getClasses().filter((c) => c.semester === semester && c.status === 'active');
    }

    // Also cross-reference with subjects in this semester
    const subjects = await this.getSubjectsBySemester(semester);
    const teachingAssignments = await this.getAllTeachingAssignments();

    // Ensure all semester subjects are represented
    for (const subj of subjects) {
      const exists = allClasses.some((c) => c.subject === subj.name);
      if (!exists) {
        const ta = teachingAssignments.find((a) => a.semester === semester && (a.subjectId === subj.id || a.subjectName === subj.name));
        const syntheticClass: ClassItem = {
          id: `cls_${semester}_${subj.id}_auto`.replace(/[^a-zA-Z0-9_]/g, '_'),
          teacherId: ta?.staffId || 'unassigned',
          teacherName: ta?.staffName || 'Staff Assigned by Admin',
          department: DEPARTMENT,
          semester,
          subject: subj.name,
          status: 'active',
          createdAt: subj.createdAt,
          studentCount: 0,
          assignmentCount: 0,
        };
        allClasses.push(syntheticClass);
      }
    }

    return allClasses;
  },
};
