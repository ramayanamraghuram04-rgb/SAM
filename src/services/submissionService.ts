import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { Submission, Assignment, StudentUser } from '../types';
import { validateDriveUrl } from '../utils/driveValidator';
import { MockStore } from './mockStorage';
import { notificationService } from './notificationService';

export const submissionService = {
  /**
   * Submit or resubmit an assignment with a Google Drive sharing link
   */
  async submitAssignment(params: {
    assignment: Assignment;
    student: StudentUser;
    driveLink: string;
    comment?: string;
  }): Promise<{ submission: Submission | null; error: string | null }> {
    const { assignment, student, driveLink, comment } = params;

    const validation = validateDriveUrl(driveLink);
    if (!validation.isValid || !validation.normalizedUrl) {
      return { submission: null, error: validation.errorMessage || 'Please enter a valid Google Drive link.' };
    }

    const cleanLink = validation.normalizedUrl;
    const nowIso = new Date().toISOString();

    if (isLiveFirebaseConfigured) {
      try {
        // Check for existing submission by this student for this assignment
        const q = query(
          collection(db, 'submissions'),
          where('assignmentId', '==', assignment.id),
          where('studentId', '==', student.uid)
        );
        const snap = await getDocs(q);

        let submissionId: string;
        let submissionData: Submission;

        if (!snap.empty) {
          // Resubmission / update
          const existingDoc = snap.docs[0];
          submissionId = existingDoc.id;
          const existingData = existingDoc.data() as Submission;

          const history = existingData.history || [];
          if (existingData.driveLink) {
            history.push({
              driveLink: existingData.driveLink,
              submittedAt: existingData.submittedAt,
              comment: existingData.comment,
            });
          }

          submissionData = {
            ...existingData,
            driveLink: cleanLink,
            comment: comment || existingData.comment || '',
            status: 'submitted',
            submittedAt: nowIso,
            history,
          };

          await updateDoc(doc(db, 'submissions', submissionId), {
            driveLink: cleanLink,
            comment: comment || existingData.comment || '',
            status: 'submitted',
            submittedAt: nowIso,
            history,
          });
        } else {
          // New submission
          submissionId = `sub_${assignment.id}_${student.uid}`;
          submissionData = {
            id: submissionId,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            classId: assignment.classId,
            teacherId: assignment.teacherId,
            studentId: student.uid,
            studentName: student.name,
            studentPIN: student.pin,
            driveLink: cleanLink,
            comment: comment || '',
            status: 'submitted',
            marks: null,
            teacherFeedback: '',
            submittedAt: nowIso,
            checkedAt: null,
            history: [],
          };

          await setDoc(doc(db, 'submissions', submissionId), submissionData);
        }

        // Notify teacher
        await notificationService.createNotification({
          recipientUid: assignment.teacherId,
          senderUid: student.uid,
          senderName: student.name,
          type: 'submission_new',
          title: `New Submission: ${assignment.subject}`,
          message: `${student.name} (${student.pin}) submitted "${assignment.title}".`,
          link: `/teacher/assignments/${assignment.id}`,
        });

        return { submission: submissionData, error: null };
      } catch (err) {
        console.error('Error submitting assignment:', err);
        return { submission: null, error: 'Failed to submit assignment. Please try again.' };
      }
    } else {
      // Mock fallback
      const existing = MockStore.getSubmissions().find(
        (s) => s.assignmentId === assignment.id && s.studentId === student.uid
      );

      let submissionData: Submission;
      if (existing) {
        const history = existing.history || [];
        if (existing.driveLink) {
          history.push({
            driveLink: existing.driveLink,
            submittedAt: existing.submittedAt,
            comment: existing.comment,
          });
        }
        submissionData = {
          ...existing,
          driveLink: cleanLink,
          comment: comment || existing.comment || '',
          status: 'submitted',
          submittedAt: nowIso,
          history,
        };
      } else {
        const submissionId = `sub_${assignment.id}_${student.uid}`;
        submissionData = {
          id: submissionId,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          classId: assignment.classId,
          teacherId: assignment.teacherId,
          studentId: student.uid,
          studentName: student.name,
          studentPIN: student.pin,
          driveLink: cleanLink,
          comment: comment || '',
          status: 'submitted',
          marks: null,
          teacherFeedback: '',
          submittedAt: nowIso,
          checkedAt: null,
          history: [],
        };
      }

      MockStore.saveSubmission(submissionData);

      // Notify teacher in mock
      await notificationService.createNotification({
        recipientUid: assignment.teacherId,
        senderUid: student.uid,
        senderName: student.name,
        type: 'submission_new',
        title: `New Submission: ${assignment.subject}`,
        message: `${student.name} (${student.pin}) submitted "${assignment.title}".`,
        link: `/teacher/assignments/${assignment.id}`,
      });

      return { submission: submissionData, error: null };
    }
  },

  /**
   * Fetch submissions for a specific assignment (for teacher review)
   */
  async getAssignmentSubmissions(assignmentId: string, teacherId?: string): Promise<Submission[]> {
    if (!assignmentId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const constraints: any[] = [where('assignmentId', '==', assignmentId)];
        if (teacherId) {
          constraints.unshift(where('teacherId', '==', teacherId));
        }
        const q = query(collection(db, 'submissions'), ...constraints);
        const snap = await getDocs(q);
        const list: Submission[] = [];
        snap.forEach((d) => list.push(d.data() as Submission));
        return list;
      } catch (err) {
        console.error('Error fetching assignment submissions:', err);
        return [];
      }
    } else {
      return MockStore.getSubmissions().filter((s) => s.assignmentId === assignmentId);
    }
  },

  /**
   * Fetch all submissions for a student
   */
  async getStudentSubmissions(studentId: string): Promise<Submission[]> {
    if (!studentId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('studentId', '==', studentId)
        );
        const snap = await getDocs(q);
        const list: Submission[] = [];
        snap.forEach((d) => list.push(d.data() as Submission));
        return list;
      } catch (err) {
        console.error('Error fetching student submissions:', err);
        return [];
      }
    } else {
      return MockStore.getSubmissions().filter((s) => s.studentId === studentId);
    }
  },

  /**
   * Teacher evaluates submission: marks, feedback, status
   */
  async gradeSubmission(params: {
    submission: Submission;
    teacherId: string;
    teacherName: string;
    marks: number;
    maxMarks: number;
    feedback: string;
    status: 'checked' | 'returned';
  }): Promise<{ success: boolean; error: string | null }> {
    const { submission, teacherId, teacherName, marks, maxMarks, feedback, status } = params;

    if (marks < 0 || marks > maxMarks) {
      return { success: false, error: `Marks must be between 0 and ${maxMarks}.` };
    }

    const checkedAt = new Date().toISOString();

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'submissions', submission.id), {
          marks: status === 'checked' ? marks : null,
          teacherFeedback: feedback.trim(),
          status,
          checkedAt: status === 'checked' ? checkedAt : null,
        });

        // Notify student
        const isChecked = status === 'checked';
        await notificationService.createNotification({
          recipientUid: submission.studentId,
          senderUid: teacherId,
          senderName: teacherName,
          type: isChecked ? 'submission_graded' : 'submission_returned',
          title: isChecked ? 'Assignment Evaluated' : 'Resubmission Requested',
          message: isChecked
            ? `Your assignment "${submission.assignmentTitle}" received ${marks}/${maxMarks} marks. ${feedback ? `Feedback: "${feedback}"` : ''}`
            : `Teacher requested resubmission for "${submission.assignmentTitle}". Note: "${feedback}"`,
          link: `/student/assignments/${submission.assignmentId}`,
        });

        return { success: true, error: null };
      } catch (err) {
        console.error('Error grading submission:', err);
        return { success: false, error: 'Failed to update marks. Please try again.' };
      }
    } else {
      // Mock fallback
      const updated: Submission = {
        ...submission,
        marks: status === 'checked' ? marks : null,
        teacherFeedback: feedback.trim(),
        status,
        checkedAt: status === 'checked' ? checkedAt : null,
      };

      MockStore.saveSubmission(updated);

      const isChecked = status === 'checked';
      await notificationService.createNotification({
        recipientUid: submission.studentId,
        senderUid: teacherId,
        senderName: teacherName,
        type: isChecked ? 'submission_graded' : 'submission_returned',
        title: isChecked ? 'Assignment Evaluated' : 'Resubmission Requested',
        message: isChecked
          ? `Your assignment "${submission.assignmentTitle}" received ${marks}/${maxMarks} marks. ${feedback ? `Feedback: "${feedback}"` : ''}`
          : `Teacher requested resubmission for "${submission.assignmentTitle}". Note: "${feedback}"`,
        link: `/student/assignments/${submission.assignmentId}`,
      });

      return { success: true, error: null };
    }
  },
};
