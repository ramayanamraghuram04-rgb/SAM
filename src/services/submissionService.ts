import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc,
  deleteField 
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { Submission, Assignment, StudentUser, SubmissionImageMetadata } from '../types';
import { validateDriveUrl } from '../utils/driveValidator';
import { MockStore } from './mockStorage';
import { notificationService } from './notificationService';

export const submissionService = {
  /**
   * Submit or resubmit an assignment with camera-captured Cloudinary image URLs or Google Drive sharing link
   */
  async submitAssignment(params: {
    assignment: Assignment;
    student: StudentUser;
    driveLink?: string;
    imageUrls?: string[];
    imagesMetadata?: SubmissionImageMetadata[];
    verificationCode?: string;
    verificationCodeCreatedAt?: string;
    verificationCodeStatus?: 'active' | 'regenerated';
    comment?: string;
  }): Promise<{ submission: Submission | null; error: string | null }> {
    const { 
      assignment, 
      student, 
      driveLink, 
      imageUrls, 
      imagesMetadata, 
      verificationCode, 
      verificationCodeCreatedAt,
      verificationCodeStatus,
      comment 
    } = params;

    if (!student?.uid) {
      return { submission: null, error: 'Student authentication is required.' };
    }

    // Verify Student belongs to target class / semester & department (Section 15: Submission Authorization)
    if (student.semester !== assignment.semester) {
      return { 
        submission: null, 
        error: `Unauthorized: You belong to ${student.semester} Semester and cannot submit to this ${assignment.semester} Semester assignment.` 
      };
    }

    if (student.department && assignment.department && student.department !== assignment.department) {
      return {
        submission: null,
        error: `Unauthorized: Department mismatch (${student.department} vs ${assignment.department}).`
      };
    }

    // Section 25: Check if assignment is closed or archived
    if (assignment.status === 'closed' || assignment.status === 'archived') {
      return {
        submission: null,
        error: 'This assignment is closed for submissions.'
      };
    }

    const isCamera = Boolean(imageUrls && imageUrls.length > 0);
    let cleanLink = driveLink?.trim() || '';
    let legacyDriveLink = cleanLink;

    if (!isCamera && !legacyDriveLink) {
      return { submission: null, error: 'Please capture at least one notebook page with the camera.' };
    }

    if (!isCamera && legacyDriveLink) {
      const validation = validateDriveUrl(legacyDriveLink);
      if (!validation.isValid || !validation.normalizedUrl) {
        return { submission: null, error: validation.errorMessage || 'Please enter a valid Google Drive link.' };
      }
      legacyDriveLink = validation.normalizedUrl;
    }

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

          // Maintain submission history preserving marks, feedback, status, timestamps, and previous links
          const history = existingData.history ? [...existingData.history] : [];
          if (existingData.driveLink || (existingData.imageUrls && existingData.imageUrls.length > 0)) {
            history.push({
              driveLink: existingData.driveLink,
              imageUrls: existingData.imageUrls,
              verificationCode: existingData.verificationCode,
              submittedAt: existingData.submittedAt,
              comment: existingData.comment,
              marks: existingData.marks,
              feedback: existingData.teacherFeedback || existingData.feedback,
              teacherFeedback: existingData.teacherFeedback || existingData.feedback,
              status: existingData.status,
              gradedAt: existingData.checkedAt || existingData.gradedAt,
              returnedAt: existingData.returnedAt,
              returnedBy: existingData.returnedBy,
            });
          }

          submissionData = {
            ...existingData,
            imageUrls: isCamera ? imageUrls! : (existingData.imageUrls || []),
            imagesMetadata: isCamera ? (imagesMetadata || []) : (existingData.imagesMetadata || []),
            submissionType: isCamera ? 'camera' : (existingData.submissionType || 'drive'),
            verificationCode: existingData.verificationCode || verificationCode, // verificationCode: verificationCode || existingData.verificationCode
            verificationCodeCreatedAt: existingData.verificationCodeCreatedAt || verificationCodeCreatedAt || nowIso,
            verificationCodeStatus: existingData.verificationCodeStatus || verificationCodeStatus || 'active',
            comment: comment !== undefined ? comment : (existingData.comment || ''),
            status: 'submitted',
            submittedAt: nowIso,
            updatedAt: nowIso,
            marks: null,
            teacherFeedback: '',
            feedback: '',
            history,
          };

          // If updating via camera, do not retain active driveLink (it is preserved in history)
          if (isCamera) {
            delete (submissionData as any).driveLink;
          } else if (legacyDriveLink) {
            submissionData.driveLink = legacyDriveLink;
          }

          const updatePayload: Record<string, any> = {
            imageUrls: isCamera ? imageUrls! : (existingData.imageUrls || []),
            imagesMetadata: isCamera ? (imagesMetadata || []) : (existingData.imagesMetadata || []),
            submissionType: isCamera ? 'camera' : (existingData.submissionType || 'drive'),
            verificationCode: verificationCode || existingData.verificationCode || null,
            verificationCodeCreatedAt: existingData.verificationCodeCreatedAt || verificationCodeCreatedAt || nowIso,
            verificationCodeStatus: existingData.verificationCodeStatus || verificationCodeStatus || 'active',
            comment: comment !== undefined ? comment : (existingData.comment || ''),
            status: 'submitted',
            submittedAt: nowIso,
            updatedAt: nowIso,
            marks: null,
            teacherFeedback: '',
            feedback: '',
            history,
          };

          if (isCamera) {
            updatePayload.driveLink = deleteField();
          } else if (legacyDriveLink) {
            updatePayload.driveLink = legacyDriveLink;
          }

          await updateDoc(doc(db, 'submissions', submissionId), updatePayload);
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
            studentUid: student.uid,
            studentName: student.name,
            studentPIN: student.pin,
            imageUrls: isCamera ? imageUrls! : [],
            imagesMetadata: isCamera ? (imagesMetadata || []) : [],
            submissionType: isCamera ? 'camera' : 'drive',
            verificationCode: verificationCode || undefined,
            verificationCodeCreatedAt: verificationCodeCreatedAt || (verificationCode ? nowIso : undefined),
            verificationCodeStatus: verificationCode ? (verificationCodeStatus || 'active') : undefined,
            comment: comment || '',
            status: 'submitted',
            marks: null,
            teacherFeedback: '',
            submittedAt: nowIso,
            checkedAt: null,
            history: [],
          };

          // Only set driveLink if legacy drive submission (never for camera)
          if (!isCamera && legacyDriveLink) {
            submissionData.driveLink = legacyDriveLink;
          }

          await setDoc(doc(db, 'submissions', submissionId), submissionData);
        }

        // Notify Teacher of submission
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
        const history = existing.history ? [...existing.history] : [];
        if (existing.driveLink || (existing.imageUrls && existing.imageUrls.length > 0)) {
          history.push({
            driveLink: existing.driveLink,
            imageUrls: existing.imageUrls,
            verificationCode: existing.verificationCode,
            submittedAt: existing.submittedAt,
            comment: existing.comment,
            marks: existing.marks,
            feedback: existing.teacherFeedback || existing.feedback,
            teacherFeedback: existing.teacherFeedback || existing.feedback,
            status: existing.status,
            gradedAt: existing.checkedAt || existing.gradedAt,
            returnedAt: existing.returnedAt,
            returnedBy: existing.returnedBy,
          });
        }
        submissionData = {
          ...existing,
          imageUrls: isCamera ? imageUrls! : (existing.imageUrls || []),
          imagesMetadata: isCamera ? (imagesMetadata || []) : (existing.imagesMetadata || []),
          submissionType: isCamera ? 'camera' : (existing.submissionType || 'drive'),
          verificationCode: verificationCode || existing.verificationCode,
          verificationCodeCreatedAt: existing.verificationCodeCreatedAt || verificationCodeCreatedAt || nowIso,
          verificationCodeStatus: existing.verificationCodeStatus || verificationCodeStatus || 'active',
          comment: comment !== undefined ? comment : (existing.comment || ''),
          status: 'submitted',
          submittedAt: nowIso,
          updatedAt: nowIso,
          marks: null,
          teacherFeedback: '',
          feedback: '',
          history,
        };
        if (isCamera) {
          delete (submissionData as any).driveLink;
        } else if (legacyDriveLink) {
          submissionData.driveLink = legacyDriveLink;
        }
      } else {
        const submissionId = `sub_${assignment.id}_${student.uid}`;
        submissionData = {
          id: submissionId,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          classId: assignment.classId,
          teacherId: assignment.teacherId,
          studentId: student.uid,
          studentUid: student.uid,
          studentName: student.name,
          studentPIN: student.pin,
          imageUrls: isCamera ? imageUrls! : [],
          imagesMetadata: isCamera ? (imagesMetadata || []) : [],
          submissionType: isCamera ? 'camera' : 'drive',
          verificationCode: verificationCode || undefined,
          verificationCodeCreatedAt: verificationCodeCreatedAt || (verificationCode ? nowIso : undefined),
          verificationCodeStatus: verificationCode ? (verificationCodeStatus || 'active') : undefined,
          comment: comment || '',
          status: 'submitted',
          marks: null,
          teacherFeedback: '',
          feedback: '',
          submittedAt: nowIso,
          checkedAt: null,
          gradedAt: null,
          gradedBy: undefined,
          returnedAt: null,
          returnedBy: undefined,
          updatedAt: nowIso,
          history: [],
        };
        if (!isCamera && legacyDriveLink) {
          submissionData.driveLink = legacyDriveLink;
        }
      }

      MockStore.saveSubmission(submissionData);

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
    }
  },

  /**
   * Fetch submissions for a specific assignment
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
   * Fetch all submissions for assignments managed by a Staff member
   */
  async getStaffSubmissions(staffId: string): Promise<Submission[]> {
    if (!staffId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(collection(db, 'submissions'), where('teacherId', '==', staffId));
        const snap = await getDocs(q);
        const list: Submission[] = [];
        snap.forEach((d) => list.push(d.data() as Submission));
        return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      } catch (err) {
        console.error('Error fetching staff submissions:', err);
        return [];
      }
    } else {
      return MockStore.getSubmissions()
        .filter((s) => s.teacherId === staffId)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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

    if (status === 'checked') {
      if (marks < 0 || marks > maxMarks) {
        return { success: false, error: `Marks must be between 0 and ${maxMarks}.` };
      }
    }

    const checkedAt = new Date().toISOString();
    const isChecked = status === 'checked';

    const updates = {
      marks: isChecked ? marks : null,
      teacherFeedback: feedback.trim(),
      feedback: feedback.trim(),
      status,
      checkedAt: isChecked ? checkedAt : null,
      gradedAt: isChecked ? checkedAt : null,
      gradedBy: isChecked ? teacherId : undefined,
      returnedAt: !isChecked ? checkedAt : null,
      returnedBy: !isChecked ? teacherId : undefined,
      updatedAt: checkedAt,
    };

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'submissions', submission.id), updates);

        // Notify student
        await notificationService.createNotification({
          recipientUid: submission.studentId,
          senderUid: teacherId,
          senderName: teacherName,
          type: isChecked ? 'submission_graded' : 'submission_returned',
          title: isChecked ? 'Assignment Evaluated' : 'Returned for Correction',
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
        ...updates,
      };

      MockStore.saveSubmission(updated);

      await notificationService.createNotification({
        recipientUid: submission.studentId,
        senderUid: teacherId,
        senderName: teacherName,
        type: isChecked ? 'submission_graded' : 'submission_returned',
        title: isChecked ? 'Assignment Evaluated' : 'Returned for Correction',
        message: isChecked
          ? `Your assignment "${submission.assignmentTitle}" received ${marks}/${maxMarks} marks. ${feedback ? `Feedback: "${feedback}"` : ''}`
          : `Teacher requested resubmission for "${submission.assignmentTitle}". Note: "${feedback}"`,
        link: `/student/assignments/${submission.assignmentId}`,
      });

      return { success: true, error: null };
    }
  },

  /**
   * Fetch all submissions across system (for Admin overview)
   */
  async getAllSubmissions(): Promise<Submission[]> {
    if (isLiveFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(db, 'submissions'));
        const list: Submission[] = [];
        snap.forEach((d) => list.push(d.data() as Submission));
        return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      } catch (err) {
        console.error('Error getting all submissions:', err);
        return [];
      }
    } else {
      return MockStore.getSubmissions().sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    }
  },
};

