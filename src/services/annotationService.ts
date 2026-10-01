import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { SubmissionAnnotations } from '../types';
import { MockStore } from './mockStorage';

class AnnotationService {
  /**
   * Fetch digital annotations for a specific student submission
   */
  async getAnnotations(submissionId: string): Promise<SubmissionAnnotations | null> {
    if (!submissionId) return null;

    if (isLiveFirebaseConfigured) {
      try {
        const docRef = doc(db, 'submissionAnnotations', submissionId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as SubmissionAnnotations;
        }
        return null;
      } catch (err) {
        console.error('Failed to get annotations from Firestore:', err);
        // Fallback to local mock cache
        return MockStore.getAnnotations(submissionId) || null;
      }
    } else {
      return MockStore.getAnnotations(submissionId) || null;
    }
  }

  /**
   * Save digital annotations for a submission
   * Architecture: Stores separately in submissionAnnotations/{submissionId}
   * Never modifies or overwrites the student's original Cloudinary image
   */
  async saveAnnotations(data: SubmissionAnnotations): Promise<{ success: boolean; error?: string }> {
    if (!data.submissionId) {
      return { success: false, error: 'Submission ID is required.' };
    }
    if (!data.teacherId) {
      return { success: false, error: 'Teacher ID is required.' };
    }

    const payload: SubmissionAnnotations = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (isLiveFirebaseConfigured) {
      try {
        const docRef = doc(db, 'submissionAnnotations', data.submissionId);
        await setDoc(docRef, payload, { merge: true });
        MockStore.saveAnnotations(payload);
        return { success: true };
      } catch (err: any) {
        console.error('Failed to save annotations to Firestore:', err);
        // Save locally so teacher doesn't lose work
        MockStore.saveAnnotations(payload);
        return { success: false, error: err?.message || 'Unable to save changes. Please try again.' };
      }
    } else {
      MockStore.saveAnnotations(payload);
      return { success: true };
    }
  }

  /**
   * Delete annotations for a submission
   */
  async deleteAnnotations(submissionId: string): Promise<void> {
    if (!submissionId) return;

    if (isLiveFirebaseConfigured) {
      try {
        const docRef = doc(db, 'submissionAnnotations', submissionId);
        await deleteDoc(docRef);
      } catch (err) {
        console.error('Failed to delete annotations:', err);
      }
    }
    MockStore.deleteAnnotations(submissionId);
  }
}

export const annotationService = new AnnotationService();
