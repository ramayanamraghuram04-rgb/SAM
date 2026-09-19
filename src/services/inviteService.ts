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
import { Invitation, ClassMember, StudentUser, ClassItem } from '../types';
import { normalizePIN } from '../utils/pinValidator';
import { MockStore } from './mockStorage';
import { notificationService } from './notificationService';

export const inviteService = {
  /**
   * Search for a student by their college PIN
   */
  async searchStudentByPIN(pin: string): Promise<StudentUser | null> {
    const normalized = normalizePIN(pin);
    if (!normalized) return null;

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('pin', '==', normalized)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return snap.docs[0].data() as StudentUser;
      } catch (err) {
        console.error('Error searching student by PIN:', err);
        return null;
      }
    } else {
      const student = MockStore.getUsers().find(
        (u) => u.role === 'student' && (u as StudentUser).pin === normalized
      );
      return (student as StudentUser) || null;
    }
  },

  /**
   * Teacher sends a class invitation to a student
   */
  async sendInvitation(params: {
    classItem: ClassItem;
    student: StudentUser;
    teacherId: string;
    teacherName: string;
  }): Promise<{ success: boolean; error: string | null }> {
    const { classItem, student, teacherId, teacherName } = params;

    if (isLiveFirebaseConfigured) {
      try {
        // 1. Check if student is already an active member
        const memberQ = query(
          collection(db, 'classMembers'),
          where('classId', '==', classItem.id),
          where('studentId', '==', student.uid)
        );
        const memberSnap = await getDocs(memberQ);
        if (!memberSnap.empty) {
          return { success: false, error: 'This student is already a member of this class.' };
        }

        // 2. Check if already invited and pending
        const inviteQ = query(
          collection(db, 'invitations'),
          where('classId', '==', classItem.id),
          where('studentId', '==', student.uid),
          where('status', '==', 'pending')
        );
        const inviteSnap = await getDocs(inviteQ);
        if (!inviteSnap.empty) {
          return { success: false, error: 'This student is already invited to this class.' };
        }

        // 3. Create invitation record
        const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const invitation: Invitation = {
          id: invitationId,
          classId: classItem.id,
          teacherId,
          teacherName,
          subject: classItem.subject,
          semester: classItem.semester,
          studentId: student.uid,
          studentName: student.name,
          studentPIN: student.pin,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'invitations', invitationId), invitation);

        // 4. Send notification to student
        await notificationService.createNotification({
          recipientUid: student.uid,
          senderUid: teacherId,
          senderName: teacherName,
          type: 'invitation',
          title: 'Class Invitation',
          message: `${teacherName} invited you to join ${classItem.semester} Semester ${classItem.subject}.`,
          link: '/student/invitations',
        });

        return { success: true, error: null };
      } catch (err) {
        console.error('Error sending invitation:', err);
        return { success: false, error: 'Failed to send invitation. Please try again.' };
      }
    } else {
      // Mock fallback
      const members = MockStore.getMembers();
      if (members.some((m) => m.classId === classItem.id && m.studentId === student.uid)) {
        return { success: false, error: 'This student is already a member of this class.' };
      }

      const invs = MockStore.getInvitations();
      if (invs.some((i) => i.classId === classItem.id && i.studentId === student.uid && i.status === 'pending')) {
        return { success: false, error: 'This student is already invited to this class.' };
      }

      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const invitation: Invitation = {
        id: invitationId,
        classId: classItem.id,
        teacherId,
        teacherName,
        subject: classItem.subject,
        semester: classItem.semester,
        studentId: student.uid,
        studentName: student.name,
        studentPIN: student.pin,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      MockStore.saveInvitation(invitation);

      // Notification
      await notificationService.createNotification({
        recipientUid: student.uid,
        senderUid: teacherId,
        senderName: teacherName,
        type: 'invitation',
        title: 'Class Invitation',
        message: `${teacherName} invited you to join ${classItem.semester} Semester ${classItem.subject}.`,
        link: '/student/invitations',
      });

      return { success: true, error: null };
    }
  },

  /**
   * Fetch all pending invitations for a student
   */
  async getStudentInvitations(studentId: string): Promise<Invitation[]> {
    if (!studentId) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'invitations'),
          where('studentId', '==', studentId),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        const list: Invitation[] = [];
        snap.forEach((d) => list.push(d.data() as Invitation));
        return list;
      } catch (err) {
        console.error('Error fetching student invitations:', err);
        return [];
      }
    } else {
      return MockStore.getInvitations().filter(
        (i) => i.studentId === studentId && i.status === 'pending'
      );
    }
  },

  /**
   * Student accepts or declines an invitation
   */
  async respondToInvitation(
    invitation: Invitation,
    response: 'accept' | 'decline'
  ): Promise<{ success: boolean; error: string | null }> {
    const newStatus = response === 'accept' ? 'accepted' : 'declined';

    if (isLiveFirebaseConfigured) {
      try {
        // Update invitation document
        await updateDoc(doc(db, 'invitations', invitation.id), {
          status: newStatus,
        });

        if (response === 'accept') {
          // Create class membership record
          const memberId = `mem_${invitation.classId}_${invitation.studentId}`;
          const membership: ClassMember = {
            id: memberId,
            classId: invitation.classId,
            studentId: invitation.studentId,
            studentName: invitation.studentName,
            studentPIN: invitation.studentPIN,
            teacherId: invitation.teacherId,
            subject: invitation.subject,
            semester: invitation.semester,
            status: 'active',
            joinedAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'classMembers', memberId), membership);

          // Notify teacher
          await notificationService.createNotification({
            recipientUid: invitation.teacherId,
            senderUid: invitation.studentId,
            senderName: invitation.studentName,
            type: 'invitation_accepted',
            title: 'Student Accepted Invitation',
            message: `${invitation.studentName} (${invitation.studentPIN}) accepted your invitation for ${invitation.subject}.`,
            link: `/teacher/classes/${invitation.classId}`,
          });
        }

        return { success: true, error: null };
      } catch (err) {
        console.error('Error responding to invitation:', err);
        return { success: false, error: 'Failed to process invitation. Please try again.' };
      }
    } else {
      // Mock fallback
      MockStore.updateInvitation(invitation.id, newStatus);

      if (response === 'accept') {
        const memberId = `mem_${invitation.classId}_${invitation.studentId}`;
        const membership: ClassMember = {
          id: memberId,
          classId: invitation.classId,
          studentId: invitation.studentId,
          studentName: invitation.studentName,
          studentPIN: invitation.studentPIN,
          teacherId: invitation.teacherId,
          subject: invitation.subject,
          semester: invitation.semester,
          status: 'active',
          joinedAt: new Date().toISOString(),
        };
        MockStore.saveMember(membership);

        await notificationService.createNotification({
          recipientUid: invitation.teacherId,
          senderUid: invitation.studentId,
          senderName: invitation.studentName,
          type: 'invitation_accepted',
          title: 'Student Accepted Invitation',
          message: `${invitation.studentName} (${invitation.studentPIN}) accepted your invitation for ${invitation.subject}.`,
          link: `/teacher/classes/${invitation.classId}`,
        });
      }

      return { success: true, error: null };
    }
  },
};
