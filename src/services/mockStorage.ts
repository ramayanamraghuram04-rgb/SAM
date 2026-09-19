// Resilient mock store for offline/demo operation when Firebase is not connected
import { 
  AppUser, 
  TeacherUser, 
  StudentUser, 
  ClassItem, 
  ClassMember, 
  Invitation, 
  Assignment, 
  Submission, 
  AppNotification 
} from '../types';

const STORAGE_KEYS = {
  USERS: 'sam_users',
  CLASSES: 'sam_classes',
  MEMBERS: 'sam_class_members',
  INVITATIONS: 'sam_invitations',
  ASSIGNMENTS: 'sam_assignments',
  SUBMISSIONS: 'sam_submissions',
  NOTIFICATIONS: 'sam_notifications',
  CURRENT_SESSION: 'sam_current_auth_session',
};

const memoryStore = new Map<string, string>();
const sessionMemoryStore = new Map<string, string>();

function getItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function setItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

function removeItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

function getSessionItem(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key);
  }
  return sessionMemoryStore.get(key) || null;
}

function setSessionItem(key: string, value: string): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, value);
  } else {
    sessionMemoryStore.set(key, value);
  }
}

function removeSessionItem(key: string): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(key);
  } else {
    sessionMemoryStore.delete(key);
  }
}

function getList<T>(key: string): T[] {
  try {
    const raw = getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, data: T[]): void {
  try {
    setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to mock storage', err);
  }
}

export const MockStore = {
  // Current session management (mimicking Firebase Auth currentUser)
  getSession(): { uid: string; role: 'teacher' | 'student' } | null {
    try {
      const raw = getSessionItem(STORAGE_KEYS.CURRENT_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(session: { uid: string; role: 'teacher' | 'student' } | null): void {
    if (!session) {
      removeSessionItem(STORAGE_KEYS.CURRENT_SESSION);
    } else {
      setSessionItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    }
  },

  clearSession(): void {
    removeSessionItem(STORAGE_KEYS.CURRENT_SESSION);
  },

  // Users
  getUsers(): (AppUser & { passwordHash: string })[] {
    return getList<AppUser & { passwordHash: string }>(STORAGE_KEYS.USERS);
  },

  getUserByUid(uid: string): AppUser | null {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid) || null;
  },

  saveUser(user: AppUser, passwordHash: string): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.uid === user.uid);
    const record = { ...user, passwordHash };
    if (existingIndex >= 0) {
      users[existingIndex] = record;
    } else {
      users.push(record);
    }
    saveList(STORAGE_KEYS.USERS, users);
  },

  // Classes
  getClasses(): ClassItem[] {
    return getList<ClassItem>(STORAGE_KEYS.CLASSES);
  },

  saveClass(classItem: ClassItem): void {
    const classes = this.getClasses();
    classes.unshift(classItem);
    saveList(STORAGE_KEYS.CLASSES, classes);
  },

  // Class Members
  getMembers(): ClassMember[] {
    return getList<ClassMember>(STORAGE_KEYS.MEMBERS);
  },

  saveMember(member: ClassMember): void {
    const members = this.getMembers();
    members.push(member);
    saveList(STORAGE_KEYS.MEMBERS, members);
  },

  // Invitations
  getInvitations(): Invitation[] {
    return getList<Invitation>(STORAGE_KEYS.INVITATIONS);
  },

  saveInvitation(inv: Invitation): void {
    const invs = this.getInvitations();
    invs.unshift(inv);
    saveList(STORAGE_KEYS.INVITATIONS, invs);
  },

  updateInvitation(id: string, status: Invitation['status']): void {
    const invs = this.getInvitations();
    const target = invs.find((i) => i.id === id);
    if (target) {
      target.status = status;
      saveList(STORAGE_KEYS.INVITATIONS, invs);
    }
  },

  // Assignments
  getAssignments(): Assignment[] {
    return getList<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
  },

  saveAssignment(assignment: Assignment): void {
    const assignments = this.getAssignments();
    assignments.unshift(assignment);
    saveList(STORAGE_KEYS.ASSIGNMENTS, assignments);
  },

  // Submissions
  getSubmissions(): Submission[] {
    return getList<Submission>(STORAGE_KEYS.SUBMISSIONS);
  },

  saveSubmission(submission: Submission): void {
    const subs = this.getSubmissions();
    const idx = subs.findIndex((s) => s.id === submission.id);
    if (idx >= 0) {
      subs[idx] = submission;
    } else {
      subs.unshift(submission);
    }
    saveList(STORAGE_KEYS.SUBMISSIONS, subs);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return getList<AppNotification>(STORAGE_KEYS.NOTIFICATIONS);
  },

  saveNotification(notification: AppNotification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notification);
    saveList(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.read = true;
      saveList(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },

  markAllNotificationsRead(recipientUid: string): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => {
      if (n.recipientUid === recipientUid) {
        n.read = true;
      }
    });
    saveList(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
};
