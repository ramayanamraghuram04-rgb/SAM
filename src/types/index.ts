// Core Domain Types for SAM (Smart Assignment Manager)

export type UserRole = 'teacher' | 'student';

export type Semester = '1st' | '3rd' | '4th' | '5th';

export type Department = 'CSE';

export interface BaseUser {
  uid: string;
  role: UserRole;
  name: string;
  department: Department;
  createdAt: string;
}

export interface TeacherUser extends BaseUser {
  role: 'teacher';
  mobile: string; // 10-digit Indian mobile number
}

export interface StudentUser extends BaseUser {
  role: 'student';
  pin: string; // Diploma PIN, e.g., "24170-CM-001"
}

export type AppUser = TeacherUser | StudentUser;

export interface ClassItem {
  id: string;
  teacherId: string;
  teacherName: string;
  department: Department;
  semester: Semester;
  subject: string;
  status: 'active' | 'archived';
  createdAt: string;
  studentCount?: number;
  assignmentCount?: number;
}

export interface ClassMember {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentPIN: string;
  teacherId: string;
  subject: string;
  semester: Semester;
  status: 'active';
  joinedAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Invitation {
  id: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  semester: Semester;
  studentId: string;
  studentName: string;
  studentPIN: string;
  status: InvitationStatus;
  createdAt: string;
}

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  teacherName?: string;
  semester: Semester;
  subject: string;
  title: string;
  description: string; // Notebook question prompt
  dueDate: string; // YYYY-MM-DD or ISO
  maxMarks: number; // default 10
  status: 'active' | 'closed';
  createdAt: string;
}

export type SubmissionStatus = 'not_submitted' | 'submitted' | 'under_review' | 'checked' | 'returned';

export interface SubmissionHistoryItem {
  driveLink: string;
  submittedAt: string;
  comment?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  classId: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  studentPIN: string;
  driveLink: string; // Google Drive sharing URL
  comment?: string;
  status: SubmissionStatus;
  marks: number | null; // 0 to maxMarks (10)
  teacherFeedback?: string;
  submittedAt: string;
  checkedAt?: string | null;
  history?: SubmissionHistoryItem[];
}

export type NotificationType = 
  | 'invitation' 
  | 'invitation_accepted' 
  | 'assignment_new' 
  | 'submission_new' 
  | 'submission_graded' 
  | 'submission_returned';

export interface AppNotification {
  id: string;
  recipientUid: string;
  senderUid: string;
  senderName?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface PerformanceStats {
  totalAssignments: number;
  submittedAssignments: number;
  checkedAssignments: number;
  pendingAssignments: number;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
}
