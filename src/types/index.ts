// Core Domain Types for SAM (Smart Assignment Manager)

export type UserRole = 'admin' | 'staff' | 'student' | 'teacher';

export type UserStatus = 'active' | 'disabled';

export type Semester = '1st' | '3rd' | '4th' | '5th';

export type Department = 'CSE';

export interface BaseUser {
  uid: string;
  role: UserRole;
  name: string;
  department: Department;
  status: UserStatus;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  mobile: string;
}

export interface StaffUser extends BaseUser {
  role: 'staff' | 'teacher';
  mobile: string; // 10-digit Indian mobile number
  assignedSubjects?: string[]; // IDs or names of subjects
  assignedSemesters?: Semester[];
}

// TeacherUser alias for backward compatibility with existing components
export type TeacherUser = StaffUser;

export interface StudentUser extends BaseUser {
  role: 'student';
  pin: string; // Diploma PIN, e.g., "24170-CM-001"
  semester: Semester; // 1st, 3rd, 4th, 5th
  classId?: string;
}

export type AppUser = AdminUser | StaffUser | StudentUser;

// Academic Subject Model
export interface Subject {
  id: string;
  name: string;
  code?: string;
  semester: Semester;
  department: Department;
  status?: 'active' | 'disabled';
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Staff Teaching Assignment (Admin assigns Staff -> Semester + Subject + Class)
export interface TeachingAssignment {
  id: string;
  staffId: string;
  staffName: string;
  staffMobile: string;
  semester: Semester;
  subjectId: string;
  subjectName: string;
  classId?: string;
  department: Department;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassItem {
  id: string;
  name?: string;
  teacherId: string;
  teacherName: string;
  department: Department;
  semester: Semester;
  subject: string;
  academicYear?: string;
  status: 'active' | 'archived' | 'disabled';
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
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

export type AssignmentStatus = 'active' | 'closed' | 'draft' | 'published' | 'archived';

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string; // Authenticated Staff Firebase UID (for backward compatibility)
  staffId?: string;   // Authenticated Staff Firebase UID
  teacherName?: string;
  semester: Semester;
  department?: Department;
  subjectId?: string;
  subject: string;
  title: string;
  description: string; // Notebook question prompt
  instructions?: string; // Additional notebook instructions
  dueDate: string; // YYYY-MM-DD or ISO
  maxMarks: number; // default 10
  status: AssignmentStatus;
  published?: boolean; // true if published to students, false if draft
  createdAt: string;
  updatedAt?: string;
}

export type SubmissionStatus = 'not_submitted' | 'submitted' | 'under_review' | 'checked' | 'returned';

export interface SubmissionImageMetadata {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

export interface VerificationCodeRecord {
  id: string; // `vcode_${assignmentId}_${studentId}`
  assignmentId: string;
  studentId: string;
  studentPIN: string;
  studentName: string;
  code: string;
  createdAt: string;
  updatedAt?: string;
  regeneratedAt?: string;
  regeneratedBy?: string;
  active: boolean;
}

export interface SubmissionHistoryItem {
  driveLink?: string;
  imageUrls?: string[];
  verificationCode?: string;
  submittedAt: string;
  comment?: string;
  marks?: number | null;
  feedback?: string;
  teacherFeedback?: string;
  status?: string;
  gradedAt?: string | null;
  returnedAt?: string | null;
  returnedBy?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  classId: string;
  teacherId: string;
  studentId: string;
  studentUid?: string;
  studentName: string;
  studentPIN: string;
  driveLink?: string; // Google Drive sharing URL (maintained for backward compatibility)
  imageUrls?: string[]; // Array of Cloudinary secure_urls for camera captures
  imagesMetadata?: SubmissionImageMetadata[]; // Cloudinary image metadata
  submissionType?: 'camera' | 'drive';
  verificationCode?: string;
  verificationCodeCreatedAt?: string;
  verificationCodeStatus?: 'active' | 'regenerated';
  comment?: string;
  status: SubmissionStatus;
  marks: number | null; // 0 to maxMarks (10)
  teacherFeedback?: string;
  feedback?: string; // Alias for teacherFeedback
  submittedAt: string;
  checkedAt?: string | null;
  gradedAt?: string | null; // Alias for checkedAt
  gradedBy?: string; // Authenticated Staff UID
  returnedAt?: string | null;
  returnedBy?: string; // Authenticated Staff UID
  updatedAt?: string;
  history?: SubmissionHistoryItem[];
}

export type NotificationType = 
  | 'invitation' 
  | 'invitation_accepted' 
  | 'assignment_new' 
  | 'submission_new' 
  | 'submission_graded' 
  | 'submission_returned'
  | 'account_status'
  | 'system'
  | 'announcement';

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

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  created_at?: string;
  original_filename?: string;
}
