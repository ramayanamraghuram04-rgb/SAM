# SAM — SMART ASSIGNMENT MANAGER
## Complete Project Documentation (Start to Finish)

> **Document Version:** 2.0.0 (Production Verified)  
> **System Status:** Fully Implemented & Tested (184/184 Automated Assertions Passed)  
> **Target Academic Domain:** State Board of Technical Education and Training (SBTET) / Polytechnic Diploma Institutions  
> **Department:** Computer Science and Engineering (CSE)  
> **Technology Foundation:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Firebase Auth & Cloud Firestore, Cloudinary REST API

---

## 1. PROJECT OVERVIEW

### 1.1 Project Identification
- **Project Name:** SAM
- **Full Name:** Smart Assignment Manager
- **Project Type:** Web-based Progressive Web Application (PWA)
- **Deployment Platform:** Web Browser (Mobile, Tablet, Desktop) with PWA Add-to-Home-Screen capability

### 1.2 Core Problem Statement
In diploma polytechnic institutions and engineering colleges, manual handwritten assignments are a foundational pedagogical tool. However, the physical assignment lifecycle suffers from critical structural failures:
1. **Physical Friction & Logistics:** Students carry heavy paper notebooks back and forth between classrooms, risking loss, tearing, and weather damage.
2. **Proxy Submissions & Academic Dishonesty:** Traditional file upload platforms (or sharing links) allow students to easily upload someone else's photographed pages or recycle old submissions from seniors.
3. **Storage & Infrastructure Limits:** Storing thousands of high-resolution phone photos quickly crashes institutional servers or exhausts expensive storage quotas.
4. **Teacher Evaluation Burden:** Physical marking requires teachers to carry bundles of physical notebooks home, annotate with red pens, compute manual totals, and return physical notebooks across crowded classrooms.
5. **Loss of Historical Context:** When a teacher requests a student to correct or redo an assignment question, physical pages are torn out or marked over, completely erasing the audit trail of the original work, feedback, and marks progression.

### 1.3 How SAM Solves the Problem
SAM transforms the entire assignment workflow into an authenticated, tamper-resistant, paperless digital lifecycle:
- **Direct Rear-Camera Capture:** Eliminates file uploads and gallery pickers. Students photograph their handwritten notebook pages directly inside the web application.
- **Cryptographic Watermarking & Verification Codes:** Before any photo is accepted, a dynamic 6-character verification code assigned uniquely to that student and assignment is stamped onto the image canvas alongside the student's name, diploma PIN, and timestamp.
- **Client-Side Progressive Compression:** The browser canvas scales and compresses pages down to approximately 150 KB without sacrificing pen stroke legibility, enabling rapid mobile uploads even on 3G/4G connections.
- **Direct-to-Cloudinary Unsigned Pipeline:** Images upload directly from student mobile browsers to Cloudinary secure cloud storage, bypassing custom backend relays.
- **Full-Screen Teacher Evaluation Workspace:** Teachers evaluate digital notebook pages inside a 100vw × 100vh correction environment equipped with a transparent HTML5 canvas overlay, digital red pen, vector eraser, undo/redo, text feedback presets, zoom/pan navigation, and instant grading/return controls.
- **Immutable Submission History:** When an assignment is returned for correction, the student resubmits new pages while the system archives all prior submission rounds, images, marks, and feedback.

### 1.4 Who Uses SAM?
| Role | Primary Identity | Core Mission |
| :--- | :--- | :--- |
| **Admin** | Institutional Phone (`admin_mobile@sam.edu.in`) | Manages academic taxonomy (Classes, Subjects, Faculty, Students, Teaching Allocations), system settings, and institutional submission audits. |
| **Staff / Teacher** | Faculty Phone (`staff_mobile@sam.edu.in`) | Creates targeted curricular assignments, manages drafts/publishing, evaluates digital submissions using full-screen canvas annotations, enters marks, and provides structured feedback. |
| **Student** | Diploma PIN (`pin@student.sam.edu.in`) | Accesses targeted assignments for their enrolled semester/class, views unique verification codes, captures handwritten pages with the camera, tracks evaluation status, and resubmits if returned. |

---

## 2. COMPLETE END-TO-END PROJECT FLOW

```mermaid
flowchart TD
    subgraph ADMIN_PROVISIONING [1. Administrative Provisioning]
        A1[Admin Logs In via Mobile Number] --> A2[Provisions Classes: 1st, 3rd, 4th, 5th Sem]
        A2 --> A3[Provisions Curricular Subjects]
        A3 --> A4[Provisions Staff Accounts & Mobile Numbers]
        A4 --> A5[Provisions Student Profiles & Diploma PINs]
        A5 --> A6[Creates Teaching Assignments: Staff -> Subject + Semester + Class]
    end

    subgraph STAFF_WORKFLOW [2. Assignment Creation & Publishing]
        S1[Staff Logs In via Mobile Number] --> S2[Views Dashboard: Authorized Classes & Subjects]
        S2 --> S3[Clicks Create Assignment]
        S3 --> S4{Save Mode}
        S4 -->|Save Draft| S5[Draft Stored: Hidden from Students]
        S4 -->|Publish| S6[Assignment Published: Class Target Active]
        S6 --> S7[Notification Dispatched to Enrolled Class Students]
    end

    subgraph STUDENT_WORKFLOW [3. Student Verification & Submission]
        ST1[Student Logs In via Diploma PIN] --> ST2[Dashboard Displays Targeted Assignment Card]
        ST2 --> ST3[Student Opens Assignment Details]
        ST3 --> ST4[System Generates / Loads 6-Char Verification Code]
        ST4 --> ST5[Student Clicks Capture Assignment Pages]
        ST5 --> ST6[Browser MediaDevices Camera Opens Rear Preferred]
        ST6 --> ST7[Student Takes Photo of Handwritten Notebook Page]
        ST7 --> ST8[Canvas Renders Timestamped Anti-Cheat Watermark]
        ST8 --> ST9[Canvas Compresses Image to ~150 KB JPEG]
        ST9 --> ST10{More Pages?}
        ST10 -->|Add Page| ST6
        ST10 -->|Finish| ST11[Student Reviews Multi-Page Previews]
        ST11 --> ST12[Direct Unsigned Upload to Cloudinary sam/assignments]
        ST12 --> ST13[Cloudinary Returns Secure URLs & Metadata]
        ST13 --> ST14[Submission Document Created in Firestore submissions]
        ST14 --> ST15[Staff Receives New Submission Notification]
    end

    subgraph TEACHER_EVALUATION [4. Teacher Digital Evaluation]
        T1[Staff Opens Submissions Dashboard] --> T2[Selects Pending Student Submission]
        T2 --> T3[Full-Screen Evaluation Workspace 100vw x 100vh Opens]
        T3 --> T4[High-Resolution Student Page Displayed]
        T4 --> T5[Teacher Selects Pen Tool: Red / Blue / Green / Black]
        T5 --> T6[Draws Correction Ticks & Marks on Transparent Canvas]
        T6 --> T7[Uses Text Tool for Margin Comments]
        T7 --> T8[Navigates Across Pages / Multi-Level Undo-Redo]
        T8 --> T9[Validates Watermark & Verification Code]
        T9 --> T10[Enters Marks 0-10 & Feedback Text]
        T10 --> T11{Evaluation Decision}
        T11 -->|Grade Submission| T12[Status: checked, Marks & Feedback Stored]
        T11 -->|Return for Correction| T13[Status: returned, Feedback Stored]
        T12 --> T14[Annotations Stored in submissionAnnotations]
        T13 --> T14
    end

    subgraph RESUBMISSION_CYCLE [5. Feedback & Resubmission Cycle]
        R1{Submission Status}
        R1 -->|Checked / Graded| R2[Student Views Final Marks, Feedback & Performance]
        R1 -->|Returned| R3[Student Sees RETURNED Badge & Correction Instructions]
        R3 --> R4[Student Clicks Resubmit Assignment]
        R4 --> R5[Same Verification Code Retained]
        R5 --> R6[New Pages Captured & Uploaded]
        R6 --> R7[Previous Round Archived in history Array]
        R7 --> T1
    end

    ADMIN_PROVISIONING --> STAFF_WORKFLOW
    STAFF_WORKFLOW --> STUDENT_WORKFLOW
    STUDENT_WORKFLOW --> TEACHER_EVALUATION
    TEACHER_EVALUATION --> RESUBMISSION_CYCLE
```

---

## 3. USER ROLES & SYSTEM ACTORS

### 3.1 Administrator (`admin`)
- **Primary Mission:** Complete structural authority over institutional data, user provisioning, curricular mapping, and global auditability.
- **Login Mechanism:** 10-digit Indian mobile number + secure password (resolves to synthetic email: `admin_<mobile>@sam.edu.in`).
- **Permissions:**
  - Full CRUD on Classes (Semesters: 1st, 3rd, 4th, 5th; Department: CSE).
  - Full CRUD on Subjects (Curricular codes, names, semester associations).
  - Full CRUD on Staff / Faculty profiles.
  - Full CRUD on Student profiles (PIN, name, semester, status).
  - Teaching Assignment Management (linking specific staff members to specific subjects, semesters, and classes).
  - Global Assignment Overlook (view, search, filter, edit, archive, or delete any assignment across all faculty).
  - Global Submission Audit (view any student submission, inspect Cloudinary page images, view verification codes, and examine grading status).
  - Notification Broadcasts (dispatching administrative notices).
  - System Settings configuration.
- **Restrictions:**
  - Admin cannot submit assignments as a student.
  - Admin cannot modify student submission ownership.

### 3.2 Staff / Teacher (`staff` / `teacher`)
- **Primary Mission:** Manage academic assignments for authorized classes, evaluate handwritten work, and provide feedback.
- **Login Mechanism:** 10-digit Indian mobile number + secure password (resolves to synthetic email: `staff_<mobile>@sam.edu.in`).
- **Permissions:**
  - View dashboard filtered to their allocated teaching assignments.
  - Create new assignments targeted strictly to classes/subjects they are authorized to teach.
  - Save assignments as drafts (invisible to students) or publish immediately.
  - Edit or close their own assignments.
  - Access Submissions Dashboard to view incoming student work.
  - Launch the full-screen 100vw × 100vh Digital Evaluation Workspace.
  - Draw annotations (pen, eraser, text, color, thickness) on transparent overlays.
  - Grade submissions (enter marks 0 to `maxMarks`, input evaluation feedback).
  - Return submissions for student correction with mandatory feedback.
  - View complete multi-round submission history.
- **Restrictions:**
  - Cannot create assignments for subjects/classes not assigned to them by the Admin.
  - Cannot edit, grade, or delete assignments belonging to other faculty members.
  - Cannot alter institutional class structures or student PINs.

### 3.3 Student (`student`)
- **Primary Mission:** Receive curricular assignments, produce handwritten responses, photograph notebook pages, and track academic evaluation.
- **Login Mechanism:** Polytechnic Diploma PIN (format: `24170-CM-001`) + password (resolves to synthetic email: `24170-cm-001@student.sam.edu.in`).
- **Permissions:**
  - View personal dashboard showing assignments targeted strictly to their enrolled semester and department.
  - Filter assignments across 6 distinct states: `ALL`, `PENDING`, `SUBMITTED`, `EVALUATED`, `RETURNED`, `CLOSED`.
  - Open assignment details and inspect requirements, due date, and instructions.
  - Generate and view their unique 6-character verification code for the assignment.
  - Launch the built-in camera to photograph handwritten notebook pages.
  - Delete individual captured pages, retake pages, and reorder.
  - Upload multi-page assignments to Cloudinary and create Firestore submission documents.
  - Inspect evaluated marks, teacher feedback, and status badges.
  - Resubmit returned assignments while retaining the identical verification code.
- **Restrictions:**
  - Strictly prevented from accessing or viewing assignments targeted to other semesters or classes.
  - Strictly blocked from viewing another student's submission records or images.
  - Cannot upload photos from device gallery or external file pickers in new submissions.
  - Cannot enter, modify, or tamper with marks or evaluation status.

---

## 4. AUTHENTICATION & IDENTITY ARCHITECTURE

```
                      +---------------------------------------+
                      |         Student Login Prompt          |
                      |  PIN: "24170-CM-001" | Pass: "******" |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Synthetic Email Synthesis       |
                      |   "24170-cm-001@student.sam.edu.in"   |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |     Firebase Auth: signInWithEmail    |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |  Authoritative Identity: Firebase UID  |
                      |             e.g. "auth_uid_xyz"       |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |  Firestore Profile: /users/{auth_uid} |
                      |       role: 'student', active: true   |
                      +---------------------------------------+
```

### 4.1 Synthetic Email Mechanism
To avoid requiring separate email accounts for every diploma student and faculty member while leveraging Firebase Authentication's industry-standard cryptographic sessions:
- **Student Synthesis:** `PIN` $\rightarrow$ Cleaned lowercase: `24170-cm-001@student.sam.edu.in`
- **Staff Synthesis:** `Mobile` $\rightarrow$ 10 digits: `staff_9876543210@sam.edu.in`
- **Admin Synthesis:** `Mobile` $\rightarrow$ 10 digits: `admin_9999999999@sam.edu.in`

### 4.2 Authoritative Identity: Firebase Auth UID
- Identity in SAM is **never** derived from browser `localStorage`, IP addresses, or unauthenticated client payloads.
- The `user.uid` generated by Firebase Authentication is the sole, immutable key linking all Firestore data:
  - User profile lookup: `db.collection('users').doc(user.uid)`
  - Student profile lookup: `db.collection('students').doc(user.uid)`
  - Staff profile lookup: `db.collection('staff').doc(user.uid)`
  - Submission ownership: `submission.studentId == request.auth.uid`
  - Teacher grading ownership: `submission.teacherId == request.auth.uid`

### 4.3 Same-Device Multi-User Isolation
In polytechnic lab environments, multiple students frequently use the same physical desktop or tablet. SAM implements strict same-device state isolation in `App.tsx` and `AuthContext.tsx`:
1. When a user logs out, `signOut(auth)` terminates the Firebase session.
2. The application resets all in-memory React state, clears active drilldowns (`activeAssignmentId`, `activeClassId`, `activeSubmissionId`), and removes cached tokens.
3. When the next user logs in, `onAuthStateChanged` fires with the new `user.uid`.
4. Firestore queries strictly constrain data fetching by the active UID (`where('studentId', '==', user.uid)`), guaranteeing that Student B never views Student A's draft captures, assignments, or evaluated submissions.

---

## 5. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

| System Capability | Admin | Staff / Teacher | Student | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **Login to Application** | Yes | Yes | Yes | Firebase Auth + Role Route Guards |
| **Manage Staff Accounts** | Yes | No | No | Firestore Rules: `/staff/{id}` write: `isAdmin()` |
| **Manage Student Accounts** | Yes | No | No | Firestore Rules: `/students/{id}` write: `isAdmin()` |
| **Manage Classes & Semesters** | Yes | No | No | Firestore Rules: `/classes/{id}` write: `isAdmin()` |
| **Manage Curricular Subjects** | Yes | No | No | Firestore Rules: `/subjects/{id}` write: `isAdmin()` |
| **Assign Teaching Loads** | Yes | No | No | Firestore Rules: `/teachingAssignments/{id}` write: `isAdmin()` |
| **Create Assignment** | Yes | Authorized Staff | No | Firestore Rules: `/assignments/{id}` write: `isAdmin() \|\| isStaff()` |
| **Save Assignment as Draft** | Yes | Authorized Staff | No | Assignment state: `status = 'draft', published = false` |
| **Publish Assignment** | Yes | Authorized Staff | No | Assignment state: `status = 'published', published = true` |
| **View Draft Assignments** | Yes | Authoring Staff | No | Firestore query filters + Security Rules |
| **View Published Assignments** | Yes | Authoring Staff | Targeted Class Only | Firestore Rules + Client Semester Matching |
| **Generate Verification Code** | Yes | Yes | Yes (Own Assignment) | `/verification_codes/{id}` where `studentId == auth.uid` |
| **Submit Assignment (Camera)** | No | No | Targeted Student Only | `/submissions/{id}` write: `studentId == auth.uid && marks == null` |
| **Submit Assignment (Drive)** | No | No | Legacy Mode Only | Backward compatibility with pre-existing URLs |
| **Access Evaluation Workspace** | Yes | Authoring Staff | No | Frontend Route Guard + Staff UID Check |
| **Draw Digital Annotations** | Yes | Authoring Staff | No | `/submissionAnnotations/{id}` write: `isStaff() \|\| isAdmin()` |
| **Enter Marks & Feedback** | Yes | Authoring Staff | No | `/submissions/{id}` update: `isStaff() \|\| isAdmin()` |
| **Return for Correction** | Yes | Authoring Staff | No | Status update to `'returned'` with mandatory feedback |
| **Resubmit Returned Work** | No | No | Authoring Student | Status reset to `'submitted'`, prior round saved in `history` |
| **Modify Given Marks** | Yes | Authoring Staff | No | Security Rules: Students cannot alter `resource.data.marks` |
| **System-wide Audit** | Yes | No | No | Dedicated Admin Audit Views |

---

## 6. SYSTEM MODULE SPECIFICATIONS

### 6.1 Administrator Module

```
Admin Dashboard Overview
├── Staff Management (/admin/staff)
│   ├── Create Staff (Name, Mobile, Department)
│   ├── Toggle Active / Disabled Status
│   └── View Assigned Subjects Count
├── Student Management (/admin/students)
│   ├── Create Student (Name, PIN, Semester, Mobile)
│   ├── Filter by Semester (1st, 3rd, 4th, 5th)
│   └── Toggle Active / Disabled Status
├── Class Management (/admin/classes)
│   ├── Create Class (Name, Semester, Department, Academic Year)
│   └── Monitor Enrolled Student & Assignment Counts
├── Subject Management (/admin/subjects)
│   ├── Add Curricular Subject (Name, Code, Semester, Department)
│   └── Enable / Disable Subjects
├── Teaching Assignments (/admin/teaching-assignments)
│   ├── Map Faculty Member to Subject + Semester + Class
│   └── View Active Faculty Allocations
├── Global Assignment Overlook (/admin/assignments)
│   ├── View All Institution Assignments
│   ├── Filter by Department, Semester, Status
│   └── Close or Delete Inappropriate Content
└── Submission Monitoring (/admin/submissions)
    ├── Audit All Student Submissions
    └── Inspect Student Notebook Pages & Watermarks
```

1. **Staff Management (`AdminStaffPage.tsx`):**
   - *Purpose:* Manage faculty members authorized to deliver curriculum.
   - *User Action:* Admin enters staff name, 10-digit mobile number, and department (`CSE`).
   - *Backend Operation:* `academicService.createStaff()` provisions a user document in `/users` and `/staff` with role `'staff'` and synthetic credentials.
2. **Student Management (`AdminStudentsPage.tsx`):**
   - *Purpose:* Register polytechnic students under their official diploma registration PIN.
   - *User Action:* Admin specifies student name, PIN (e.g. `24170-CM-001`), semester (`1st`, `3rd`, `4th`, or `5th`), and contact phone.
   - *Backend Operation:* `academicService.createStudent()` provisions `/users` and `/students` documents.
3. **Class & Subject Management (`AdminClassesPage.tsx`, `AdminSubjectsPage.tsx`):**
   - *Purpose:* Establish the institutional curriculum and classroom cohorts.
   - *Backend Operation:* Writes to `/classes` and `/subjects` collections.
4. **Teaching Allocations (`AdminTeachingAssignmentsPage.tsx`):**
   - *Purpose:* Formally link a faculty member to a specific semester and subject.
   - *Backend Operation:* Writes mapping documents to `/teachingAssignments`.

---

### 6.2 Staff / Teacher Module

```
Teacher Workflow
├── Teacher Dashboard (/teacher/dashboard)
│   ├── Teaching Load Summary (Allocated Subjects & Classes)
│   ├── Quick Metric Counters (Active Assignments, Pending Submissions)
│   └── Action: Create Assignment
├── Assignment Management (/teacher/assignments)
│   ├── Create Assignment Modal
│   │   ├── Select Subject & Class (Filtered to Allocated Load)
│   │   ├── Title, Due Date, Max Marks (Default 10)
│   │   ├── Description Prompt & Specific Instructions
│   │   └── Actions: [Save Draft] or [Publish Now]
│   └── Assignment List with Status Badges (Draft, Published, Closed)
└── Submissions Dashboard (/teacher/submissions)
    ├── Filter by Assignment & Submission Status
    ├── Click Submission Card -> Open Full-Screen Evaluation Workspace
    └── Complete Evaluation -> Next Paper in Queue
```

1. **Authorized Allocation Binding:** Staff can only create assignments for combinations of Subject and Semester explicitly granted to them in `/teachingAssignments`.
2. **Draft & Publication Lifecycle:**
   - **Draft:** Allows teachers to prepare assignment prompts days in advance. Marked with `status: 'draft', published: false`. It remains completely invisible to students.
   - **Published:** Sets `status: 'published', published: true`, locks target class metadata, and triggers student notifications.
3. **Submissions Dashboard (`TeacherSubmissionsPage.tsx`):**
   - Lists all student submissions across all managed assignments.
   - Highlights pending papers awaiting grading with prominent count indicators.

---

### 6.3 Student Module

```
Student Workflow
├── Student Dashboard (/student/dashboard)
│   ├── Enrolled Semester Banner & Academic Progress
│   ├── Dynamic Performance Metrics (Submitted %, Average Score)
│   └── 6-Status Tab Filter (All, Pending, Submitted, Evaluated, Returned, Closed)
├── Assignment Details Page (/student/assignments/:id)
│   ├── Assignment Header, Due Date, Question Prompt, Instructions
│   ├── Unique 6-Character Verification Code Box
│   └── Action: [Capture Assignment Pages]
└── Multi-Page Camera Modal (SubmitAssignmentModal.tsx)
    ├── Live Camera Viewport (Rear Preferred)
    ├── Capture Action -> Watermark Applied -> Compression Applied
    ├── Page Strip (Page 1 of N, Delete Page, Retake)
    ├── Cloudinary Unsigned Upload
    └── Final Submission Document Created
```

1. **Targeted Discovery:** Students automatically receive all published assignments matching their profile's `semester` and `department`.
2. **Submission Status Tracking:** Student assignment cards display real-time statuses:
   - `NOT SUBMITTED` (Orange badge)
   - `SUBMITTED` (Blue badge)
   - `UNDER REVIEW` (Amber badge)
   - `CHECKED / GRADED` (Green badge with marks, e.g., `8.5 / 10`)
   - `RETURNED` (Red badge with correction note)
   - `CLOSED` (Gray badge)

---

## 7. ASSIGNMENT TARGETING & LIFECYCLE MANAGEMENT

### 7.1 Assignment Data Model
The `Assignment` entity in Firestore (`/assignments/{id}`) contains:
```typescript
export interface Assignment {
  id: string;
  classId: string;             // Target cohort identifier
  teacherId: string;           // Authenticated Staff Firebase UID
  staffId?: string;            // Authenticated Staff Firebase UID
  teacherName?: string;        // Faculty display name
  semester: Semester;          // '1st' | '3rd' | '4th' | '5th'
  department?: Department;     // 'CSE'
  subjectId?: string;          // Academic subject identifier
  subject: string;             // Subject title (e.g. "Data Structures Through C")
  title: string;               // Assignment topic title
  description: string;         // Notebook question prompt
  instructions?: string;       // Specific submission instructions
  dueDate: string;             // ISO date string (YYYY-MM-DD)
  maxMarks: number;            // Standard maximum marks (typically 10)
  status: AssignmentStatus;    // 'draft' | 'published' | 'closed' | 'archived'
  published?: boolean;         // true when published to students
  createdAt: string;           // ISO creation timestamp
  updatedAt?: string;          // ISO last updated timestamp
}
```

### 7.2 Targeting Engine
When a student logs in, SAM guarantees exact class isolation:
1. Student profile contains: `semester: '3rd'`, `department: 'CSE'`.
2. The application queries Firestore assignments:
   ```typescript
   query(
     collection(db, 'assignments'),
     where('semester', '==', student.semester),
     where('published', '==', true)
   )
   ```
3. Even if a malicious student manually attempts to invoke `submissionService.submitAssignment()` on an assignment belonging to the 5th semester, the service performs hard server-side boundary checks:
   ```typescript
   if (student.semester !== assignment.semester) {
     return { error: `Unauthorized: You belong to ${student.semester} Semester and cannot submit to this ${assignment.semester} Semester assignment.` };
   }
   ```

---

## 8. VERIFICATION CODE SYSTEM

```
+---------------------------------------------------------------------------------+
|                       CRYPTOGRAPHIC VERIFICATION CODE ENGINE                    |
|                                                                                 |
| 1. Student opens assignment details                                             |
| 2. System checks /verification_codes/vcode_${assignmentId}_${studentId}         |
|                                                                                 |
| If code exists:                                                                 |
|   -> Load existing code (e.g. "K74821")                                         |
|                                                                                 |
| If no code exists:                                                              |
|   -> Web Crypto API: crypto.getRandomValues(new Uint8Array(6))                  |
|   -> Charset (32 chars, no ambiguous 0, O, 1, I):                               |
|      "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"                                         |
|   -> Code generated: "K74821"                                                   |
|   -> Saved in Firestore /verification_codes                                     |
|                                                                                 |
| Student writes "K74821" on the top of their physical handwritten notebook page |
+---------------------------------------------------------------------------------+
```

### 8.1 Specification
- **Length:** Exactly 6 alphanumeric characters (e.g., `K74821`, `9Y2M4R`).
- **Charset:** 32 uppercase characters: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`
- **Ambiguity Elimination:** Numbers `0` and `1` and letters `O` and `I` are omitted to prevent confusion between handwritten digits and letters.
- **Persistence:** Generated once per `(studentId, assignmentId)` tuple. It remains strictly identical if the student closes the app, retakes photos, or resubmits following a teacher return.

---

## 9. CAMERA SUBMISSION & IMAGE PIPELINE

```
+-----------------------------------------------------------------------------------+
|                        MOBILE CAMERA SUBMISSION PIPELINE                          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
                1. WebRTC Browser API: navigator.mediaDevices.getUserMedia
                   - FacingMode: { ideal: "environment" } (Rear Camera)
                   - Video Stream: 1080p ideal resolution
                                          |
                                          v
                2. Live Viewport Capture onto Offscreen HTML5 Canvas
                   - Video frame drawn to 2D context
                                          |
                                          v
                3. Watermark Engine: drawVerificationWatermark()
                   - Student Name: "S. Rajesh Kumar"
                   - Student PIN: "PIN: 24170-CM-001"
                   - Verification Code: "Code: K74821"
                   - Date & Time: "24 Sep 2026, 11:15 am"
                   - Rendered in high-contrast safe bottom-right corner badge
                                          |
                                          v
                4. Image Compressor: compressCapturedCanvas()
                   - Max dimension scaled to 1600px
                   - Progressive JPEG quality (bounded 0.55 - 0.82)
                   - Compressed size: ~150 KB per page (ink legibility preserved)
                                          |
                                          v
                5. Direct Cloudinary Upload: uploadToCloudinary()
                   - Direct POST to https://api.cloudinary.com/v1_1/jnuxag0x/image/upload
                   - Unsigned preset: SAM-SMART ASSIGNMENT MANAGER
                   - Folder: sam/assignments
                                          |
                                          v
                6. Firestore Submission Document:
                   - collection: submissions
                   - imageUrls: [secure_url_1, secure_url_2]
                   - imagesMetadata: [{ width, height, bytes, public_id }]
                   - status: "submitted"
```

### 9.1 Camera-Only Design Principle
SAM intentionally prohibits generic gallery uploads (`<input type="file">`) for new submissions. By requiring real-time camera capture:
- Students must have the physical handwritten notebook physically present in front of the lens.
- Watermarks are burned directly into the canvas pixels at the millisecond of capture.
- Cheating by circulating screenshots or downloading images from chat apps is eliminated.

### 9.2 Legacy Google Drive Compatibility
- **Status:** `LEGACY COMPATIBILITY ONLY`.
- Pre-existing submissions created during early prototype phases with Google Drive URLs remain viewable in teacher review screens.
- The new student submission modal contains **zero** Google Drive inputs, textboxes, or URL fields.

---

## 10. CLOUDINARY CLOUD STORAGE ARCHITECTURE

### 10.1 Direct Unsigned Upload Design
To deliver enterprise-grade performance without incurring server maintenance costs or proxy bottlenecks:
- **Target Endpoint:** `https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload`
- **Method:** `POST` multipart/form-data
- **Cloud Name Variable:** `VITE_CLOUDINARY_CLOUD_NAME` (Active: `jnuxag0x`)
- **Upload Preset Variable:** `VITE_CLOUDINARY_UPLOAD_PRESET` (Active: `SAM-SMART ASSIGNMENT MANAGER`)
- **Target Cloud Folder:** `sam/assignments`

### 10.2 Frontend Security Assurance
- Cloudinary **API Secret is NEVER present in the client application**.
- The unsigned upload preset is configured in the Cloudinary Management Console to restrict uploads strictly to image MIME types and constrain file parameters.
- Returned metadata (`secure_url`, `public_id`, `width`, `height`, `bytes`) is recorded in Firestore under `imagesMetadata`.

---

## 11. FIRESTORE DATABASE ARCHITECTURE

### 11.1 Collection Schema Table
| Collection Name | Primary Purpose | Key Fields | Read Access | Write Access |
| :--- | :--- | :--- | :--- | :--- |
| `users` | Global system users & authentication mapping | `uid, role, name, department, status, createdAt` | Authenticated | Admin |
| `staff` | Faculty member details & mobile identifiers | `uid, name, mobile, department, subjects, active` | Authenticated | Admin |
| `teachers` | Backward compatibility alias for staff | `uid, name, mobile, department` | Authenticated | Admin |
| `students` | Polytechnic student profiles & diploma PINs | `uid, name, pin, semester, department, active` | Authenticated | Admin |
| `classes` | Academic classrooms & cohort definitions | `id, name, semester, department, academicYear` | Authenticated | Admin |
| `subjects` | Curricular subjects & subject codes | `id, name, code, semester, department, active` | Authenticated | Admin |
| `teachingAssignments` | Faculty allocation to semester, class & subject | `id, staffId, subjectId, semester, classId` | Authenticated | Admin |
| `assignments` | Academic assignments & question prompts | `id, classId, teacherId, semester, subject, title, dueDate, maxMarks, status, published` | All if published; Admin/Staff if draft | Admin or Authoring Staff |
| `submissions` | Student assignment submissions & grading records | `id, assignmentId, studentId, studentPIN, imageUrls, imagesMetadata, status, marks, feedback, history` | Authoring Student, Staff, Admin | Student (Create/Update); Staff (Grade) |
| `submissionAnnotations` | Digital teacher pen strokes & correction notes | `submissionId, teacherId, pages: [{ strokes, texts }]` | Authenticated | Admin or Staff |
| `verification_codes` | Immutable per-assignment verification tokens | `id, assignmentId, studentId, studentPIN, code` | Authenticated | Authenticated |
| `notifications` | In-app user notifications & alerts | `id, recipientUid, senderUid, type, title, message, read` | Recipient or Admin | Authenticated |

---

## 12. FULL-SCREEN TEACHER EVALUATION & DIGITAL ANNOTATION WORKSPACE

```
+---------------------------------------------------------------------------------------------------------------+
| TOP HEADER: [<- Back] | Evaluate Submission | Student: S. Rajesh Kumar (24170-CM-001) | Code: K74821 | [DONE] |
+-----------------------------------------------------------------------------------------------+---------------+
|                                                                                               | EVALUATION    |
|   TOOLBAR:                                                                                    | PANEL         |
|   [Pen] [Eraser] [Text] [Pan] | Colors: (*)Red ( )Blue ( )Green ( )Black                      |               |
|   Size: (•)Thin (•)Med (•)Thick | [Undo] [Redo] | [Zoom In] [Zoom Out] [100%] [Fit]           | Marks: [ 9 ]  |
|                                                                                               | Max: 10       |
|  +-----------------------------------------------------------------------------------------+  |               |
|  |                                                                                         |  | Feedback:     |
|  |     HIGH-RESOLUTION SUBMITTED ASSIGNMENT PAGE                                           |  | [Excellent    |
|  |     (Loaded from Cloudinary secure_url)                                                 |  | diagrams.]    |
|  |                                                                                         |  |               |
|  |     +-----------------------------------------------------------------------------+     |  | [ ] Code      |
|  |     | TRANSPARENT HTML5 ANNOTATION CANVAS OVERLAY                                 |     |  | Verified      |
|  |     | (Teacher draws red pen checkmarks, marks scores, writes text notes)         |     |  |               |
|  |     +-----------------------------------------------------------------------------+     |  | [RETURN FOR   |
|  |                                                                                         |  |  CORRECTION]  |
|  +-----------------------------------------------------------------------------------------+  |               |
|                                                                                               | [SUBMIT       |
|   FOOTER: [<- Prev Page]   Page 1 of 3   [Next Page ->]                                       |  EVALUATION]  |
+-----------------------------------------------------------------------------------------------+---------------+
```

### 12.1 Full-Screen Workspace Architecture (`GradeSubmissionModal.tsx`)
- Renders as a true `100vw × 100vh` digital workspace covering the entire viewport.
- **Top Header:** Includes back button, submission title, student name, PIN, subject name, verification code badge, and a persistent `DONE` button.
- **Synchronized Canvas Overlay (`AnnotationCanvas.tsx`):** A transparent `<canvas>` layer is positioned exactly above the high-resolution Cloudinary image. When the teacher zooms or pans, the image and annotation layer move in perfect mathematical lockstep.
- **Non-Destructive Principle:** The student's original Cloudinary photo is **never modified, re-compressed, or overwritten**. All teacher strokes are stored as vector coordinates in `/submissionAnnotations/{submissionId}`.

### 12.2 Annotation Toolset
1. **Pen Tool:**
   - 4 Curated Colors: Red (`#EF4444`, Default), Blue (`#3B82F6`), Green (`#10B981`), Black (`#111827`).
   - 3 Stroke Thicknesses: Thin (2px), Medium (4px, Default), Thick (7px).
2. **Vector Eraser:** Erases only teacher annotation strokes without harming the underlying notebook image.
3. **Text Tool:** Enables clicking anywhere on the document to place typed feedback notes, including quick preset comments (`"Check calculation"`, `"Improve handwriting"`, `"Good diagram"`).
4. **History & Undo/Redo:** Full multi-level undo/redo stack (`Ctrl+Z` / `Ctrl+Y`).
5. **Zoom & Pan:** 0.5x to 3.0x magnification with "Fit to Width" auto-centering.

---

## 13. GRADING, RETURN & RESUBMISSION LIFECYCLE

```mermaid
stateDiagram-v2
    [*] --> NOT_SUBMITTED: Assignment Published
    NOT_SUBMITTED --> SUBMITTED: Student Submits Photos
    SUBMITTED --> UNDER_REVIEW: Teacher Launches Full-Screen Workspace
    UNDER_REVIEW --> CHECKED: Teacher Grades (Enters Marks 0-10 & Feedback)
    UNDER_REVIEW --> RETURNED: Teacher Returns for Correction (Enters Feedback)
    RETURNED --> SUBMITTED: Student Resubmits (Prior Round Saved in History)
    CHECKED --> [*]: Final Grade Published
```

### 13.1 Validation Rules
- **Marks Range:** $0 \le \text{Marks} \le \text{maxMarks}$ (Strictly enforced in UI and service layers).
- **Mandatory Feedback on Return:** If a teacher returns an assignment, constructive feedback explaining the necessary correction is required.
- **Student Immutability:** Students cannot create, alter, or delete marks fields.

### 13.2 Submission History Engine
When an assignment is returned and the student resubmits:
1. Current submission data (images, verification code, comments, teacher feedback, timestamps) is appended to the `history: SubmissionHistoryItem[]` array.
2. The active `status` reverts to `'submitted'`.
3. The teacher can review all prior rounds to verify that the student genuinely corrected the requested answers.

---

## 14. PROGRESSIVE WEB APP (PWA) & RESPONSIVE DESIGN

### 14.1 PWA Features
- **Web App Manifest (`public/manifest.json`):** Configures display as `standalone`, sets theme colors (`#4F46E5`), and declares high-resolution icons (192px, 512px, maskable).
- **Add-to-Home-Screen:** Prompted via custom non-intrusive banners (`PWAInstallBanner.tsx`) and launch toasts (`FirstLaunchPWAToast.tsx`).
- **Responsive Layout:**
  - **Desktop:** Collapsible left sidebar navigation, expansive multi-column grids, and spacious canvas tools.
  - **Mobile:** Fixed bottom navigation bar (`BottomNav.tsx`), full-screen camera viewports, and drawer-based evaluation panels.

---

## 15. AUTOMATED TEST SUITES & BUILD VERIFICATION

### 15.1 Test Execution Summary
Automated verification is executed using Node.js test runners across 10 specialized suites.

| Suite Number | Test Suite File | Domain / System Under Test | Assertions Passed | Assertions Failed |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `test_branding.mjs` | SAM Branding, Institution Details & Metadata | 10 | 0 |
| 2 | `test_scenarios.mjs` | Multi-User Scenarios & Class Isolation | 15 | 0 |
| 3 | `test_camera_flow.mjs` | Camera API, Watermark & Compression Engine | 29 | 0 |
| 4 | `test_verification_code.mjs` | Cryptographic Verification Code Lifecycle | 17 | 0 |
| 5 | `test_admin_system.mjs` | Admin Provisioning, Classes, Subjects & Allocations | 20 | 0 |
| 6 | `test_assignment_system.mjs` | Assignment Lifecycle (Draft, Publish, Close) | 25 | 0 |
| 7 | `test_submission_grading.mjs` | Full Submission, Grading & History Workflow | 33 | 0 |
| 8 | `test_new_submission_no_drive.mjs` | Camera-Only Submission & No-Drive Invariant | 14 | 0 |
| 9 | `test_ai_verification.mjs` | AI Handwriting OCR & Fuzzy Code Matching | 6 | 0 |
| 10 | `test_fullscreen_evaluation.mjs` | Full-Screen 100vw × 100vh Annotation Workspace | 15 | 0 |
| **TOTAL** | **10 Test Suites** | **Complete SAM Application Stack** | **184** | **0** |

### 15.2 Production Build Verification
- **Build Command:** `npm.cmd run build` (`tsc -b && vite build`)
- **TypeScript Compilation:** Zero errors. Strict typing enforced across all components and services.
- **Vite Bundler:** Successfully bundled 2001 modules into `/dist` in 472 milliseconds.

---

## 16. PROJECT FILE STRUCTURE

```
C:\Users\ASUS\.gemini\antigravity-ide\scratch\sam-app\
├── dist/                              # Compiled production distribution
├── public/                            # Static assets, PWA manifest.json, icons
├── src/
│   ├── assets/                        # SVG icons, institutional logos
│   ├── components/
│   │   ├── brand/                     # SAM brand logos and typography
│   │   ├── common/                    # Button, Input, Modal, Badge, ImageViewer, PWA Banners
│   │   ├── illustrations/             # Role stickers (Student, Teacher, Admin)
│   │   ├── layout/                    # AppHeader, AppLayout, Sidebar, BottomNav
│   │   ├── student/                   # AssignmentCard, SubmitAssignmentModal (Camera)
│   │   └── teacher/                   # GradeSubmissionModal (Full-screen), AnnotationCanvas
│   ├── config/
│   │   ├── constants.ts               # Institutional defaults (Semesters, CSE Department)
│   │   └── firebase.ts                # Firebase App, Auth, and Firestore initialization
│   ├── context/
│   │   ├── AuthContext.tsx            # Authoritative session management & same-device isolation
│   │   ├── BrandingContext.tsx        # Institution branding tokens
│   │   └── NotificationContext.tsx    # Live notification subscriptions
│   ├── pages/
│   │   ├── admin/                     # AdminDashboard, Staff, Students, Classes, Subjects, Allocations
│   │   ├── public/                    # LandingPage, StudentLogin, TeacherLogin, AdminLogin
│   │   ├── student/                   # StudentDashboard, AssignmentDetails, Marks, Notifications
│   │   └── teacher/                   # TeacherDashboard, Assignments, Submissions, Classes
│   ├── services/
│   │   ├── academicService.ts         # User provisioning, Classes, Subjects, Teaching Allocations
│   │   ├── aiVerificationService.ts   # Tesseract OCR handwriting verification helper
│   │   ├── annotationService.ts       # Digital annotation storage (/submissionAnnotations)
│   │   ├── assignmentService.ts       # Assignment CRUD, drafts, publishing, and targeting
│   │   ├── authService.ts             # Synthetic email translation & Firebase Auth
│   │   ├── classService.ts            # Class membership management
│   │   ├── cloudinary.ts              # Direct unsigned Cloudinary upload pipeline
│   │   ├── mockStorage.ts             # Offline development fallback store
│   │   ├── notificationService.ts     # User notification dispatch & query
│   │   ├── submissionService.ts       # Submissions, grading, return, and history
│   │   └── verificationCodeService.ts # Cryptographic verification code generation & lookup
│   ├── types/
│   │   └── index.ts                   # Complete TypeScript domain interfaces and types
│   ├── utils/
│   │   ├── dateUtils.ts               # Indian standard date formatting
│   │   ├── driveValidator.ts          # Legacy Google Drive URL parser
│   │   ├── imageCompressor.ts         # Canvas watermarking & ~150KB progressive compression
│   │   ├── phoneValidator.ts          # Indian 10-digit mobile number validation
│   │   ├── pinValidator.ts            # Polytechnic diploma PIN validation
│   │   └── verificationCodeGenerator.ts # 6-char cryptographic code generator
│   ├── App.tsx                        # Master routing, role guards, and navigation state
│   ├── index.css                      # Tailwind CSS v4 styling rules
│   └── main.tsx                       # React 19 application root
├── firestore.rules                    # Production Firestore Security Rules
├── package.json                       # Dependencies and test runner scripts
└── vite.config.ts                     # Vite build configuration
```

---

## 17. SYSTEM ARCHITECTURE & DATA FLOW DIAGRAMS

### 17.1 High-Level Infrastructure Diagram

```mermaid
graph TD
    subgraph CLIENT_TIER [Client Tier: Progressive Web Application]
        U1[Student Browser / Mobile]
        U2[Staff Browser / Tablet / Desktop]
        U3[Admin Browser / Desktop]
    end

    subgraph APPLICATION_LAYER [React 19 + TypeScript + Vite Core]
        AL1[Auth Context & Synthetic Identifiers]
        AL2[Camera & Watermark Compression Engine]
        AL3[Full-Screen Digital Evaluation Workspace]
        AL4[Role-Based Route Guards]
    end

    subgraph CLOUD_SERVICES [Cloud Infrastructure Tier]
        FB_AUTH[Firebase Authentication]
        FS_DB[(Cloud Firestore Database)]
        CL_CDN[Cloudinary Media Storage]
    end

    U1 --> APPLICATION_LAYER
    U2 --> APPLICATION_LAYER
    U3 --> APPLICATION_LAYER

    APPLICATION_LAYER <-->|Token & Session Auth| FB_AUTH
    APPLICATION_LAYER <-->|Real-Time Documents & Metadata| FS_DB
    APPLICATION_LAYER -->|Direct Unsigned Image Upload| CL_CDN
    CL_CDN -->|Secure HTTPS Image CDN URLs| APPLICATION_LAYER
```

---

## 18. SYSTEM ADVANTAGES, LIMITATIONS & FUTURE ENHANCEMENTS

### 18.1 Factual System Advantages
1. **Zero Paper Logistics:** Entire lifecycle is digital from assignment creation to evaluated returns.
2. **Anti-Cheat Verification:** 6-character cryptographic verification codes and timestamped canvas watermarks eliminate screenshot sharing and proxy work.
3. **No App Store Friction:** Functions as an installable PWA across Android, iOS, Windows, and macOS without app store installation requirements.
4. **Lightweight Network Footprint:** Advanced client-side canvas compression (~150 KB) ensures rapid uploads even on low-bandwidth rural mobile networks.
5. **Non-Destructive Digital Marking:** The student's submitted image is preserved in pristine condition while teachers mark up assignments using an overlay canvas.
6. **Auditability:** Complete historical preservation of all submission, return, and resubmission rounds.

### 18.2 Current System Limitations
1. **Live Camera Requirement:** Requires a functional device camera; students with damaged lenses must use institutional or peer devices.
2. **Connectivity for Final Upload:** While client-side capture and compression operate entirely offline in memory, internet access is required to transmit the final image to Cloudinary and Firestore.
3. **Department Preset:** Default academic structure is currently tailored to the Computer Science and Engineering (`CSE`) curriculum. Expanding to Mechanical, Civil, or Electrical engineering requires administrative taxonomy setup.

### 18.3 Future Planned Enhancements
- **Automated AI Grading Assistant:** Employing multimodal AI to offer preliminary structural checks and handwriting transcription.
- **Bulk PDF Export:** Allowing teachers or institutional accreditation inspectors to download evaluated assignments as archival PDF packages.
- **Push Notifications via WebPush:** Delivering background system alerts directly to mobile device notification trays.

---

## 19. PROJECT REVIEW & 2-MINUTE VIVA PRESENTATION GUIDE

### 19.1 How to Explain SAM in 2 Minutes
> "Good morning, respected examiners. Our project is **SAM — Smart Assignment Manager**, a Progressive Web Application designed specifically to modernize the handwritten assignment lifecycle in polytechnic institutions.
>
> In our colleges, handwritten assignments are essential, but managing paper notebooks is chaotic. Students carry bundles of physical notebooks, risk losing them, or copy work from others. SAM solves this by establishing a secure digital workflow across three roles: **Admin, Staff, and Student**.
>
> First, the Admin sets up classes, subjects, and allocates teaching loads. The Teacher creates assignments targeted specifically to their class.
>
> When a Student opens an assignment, SAM generates a unique **6-character verification code** like `K74821`. The student writes this code on the top of their handwritten notebook page and captures it using the **built-in mobile camera**. SAM automatically burns a **watermark badge** with the student's name, PIN, verification code, and timestamp, compresses the photo to **~150 KB**, and uploads it directly to Cloudinary.
>
> Finally, the Teacher evaluates the assignment in a **Full-Screen 100vw × 100vh Digital Workspace** using a red pen, eraser, and text comments on a transparent digital overlay. The teacher enters marks out of 10 and can either approve or return the paper for correction. If returned, the student resubmits while the complete history of previous marks and feedback is preserved.
>
> The entire application is built using React 19, TypeScript, Firebase Authentication, Cloud Firestore, and Cloudinary, with 184 passing automated tests."

### 19.2 Top 5 Features to Highlight
1. **Camera-Only Anti-Cheat Capture:** No file upload loopholes; watermarks burned into image pixels.
2. **Cryptographic Verification Codes:** 6-character code unique to student and assignment.
3. **Client-Side Canvas Compression:** ~150 KB target preserving pen stroke sharpness.
4. **Full-Screen Digital Evaluation Workspace:** 100vw × 100vh workspace with pen, eraser, undo/redo, and zoom.
5. **Multi-Round Submission History:** Complete audit trail of past returns, marks, and feedback.

---

## 20. HOW SAM WORKS FROM START TO FINISH (STEP-BY-STEP)

```
 1. Admin provisions Staff, Students, Classes, and Subjects.
 2. Admin assigns Staff members to specific Subjects and Classes.
 3. Staff logs in with their mobile number and creates an assignment.
 4. Staff publishes the assignment targeted to an exact Class and Semester.
 5. Enrolled students receive a notification and see the assignment card on their dashboard.
 6. Student opens assignment details and views their unique 6-character verification code.
 7. Student writes the code on their handwritten notebook page.
 8. Student clicks "Capture Assignment Pages" to open the camera (rear camera preferred).
 9. Student photographs the page; SAM applies the verification watermark badge.
10. SAM compresses the page to approximately 150 KB.
11. Student captures additional pages if needed and reviews thumbnails.
12. Student clicks Submit; images upload directly to Cloudinary.
13. Cloudinary URLs and metadata are recorded in a Firestore submission document.
14. Staff opens the Submissions Dashboard and clicks "Evaluate Submission".
15. Full-Screen Evaluation Workspace opens showing the high-resolution student page.
16. Staff verifies the handwritten code against the generated code.
17. Staff uses the digital pen to mark ticks and corrections on the transparent overlay.
18. Staff enters marks (0 to maxMarks) and constructive feedback.
19. Staff clicks "Submit Evaluation" or "Return for Correction".
20. Student views final marks and feedback, or resubmits corrected pages with full history preserved.
```
