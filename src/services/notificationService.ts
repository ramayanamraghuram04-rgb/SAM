import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { AppNotification } from '../types';
import { MockStore } from './mockStorage';

export const notificationService = {
  /**
   * Create an in-app notification strictly routed to the recipient UID
   */
  async createNotification(params: {
    recipientUid: string;
    senderUid: string;
    senderName?: string;
    type: AppNotification['type'];
    title: string;
    message: string;
    link?: string;
  }): Promise<void> {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notification: AppNotification = {
      id: notifId,
      ...params,
      read: false,
      createdAt: new Date().toISOString(),
    };

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'notifications', notifId), notification);
      } catch (err) {
        console.error('Failed to write notification to Firestore:', err);
      }
    } else {
      MockStore.saveNotification(notification);
    }
  },

  /**
   * Fetch all notifications for a specific user UID (never leak across UIDs)
   */
  async getUserNotifications(uid: string): Promise<AppNotification[]> {
    if (!uid) return [];

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('recipientUid', '==', uid)
        );
        const snap = await getDocs(q);
        const list: AppNotification[] = [];
        snap.forEach((d) => list.push(d.data() as AppNotification));
        // Sort descending by date
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.error('Error fetching notifications:', err);
        return [];
      }
    } else {
      return MockStore.getNotifications()
        .filter((n) => n.recipientUid === uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    } else {
      MockStore.markNotificationRead(id);
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(recipientUid: string): Promise<void> {
    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('recipientUid', '==', recipientUid),
          where('read', '==', false)
        );
        const snap = await getDocs(q);
        const promises = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
        await Promise.all(promises);
      } catch (err) {
        console.error('Error marking all notifications read:', err);
      }
    } else {
      MockStore.markAllNotificationsRead(recipientUid);
    }
  },
};
