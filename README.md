# SAM — Smart Assignment Manager 🎓📚

[![Live Production](https://img.shields.io/badge/Vercel-Live_App-black?logo=vercel)](https://sam-app-jet.vercel.app)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Department](https://img.shields.io/badge/Department-CSE-blue)](https://sam-app-jet.vercel.app)

**SAM (Smart Assignment Manager)** is a modern, lightweight, mobile-first Progressive Web Application (PWA) designed specifically for **Computer Science and Engineering (CSE)** polytechnic/diploma colleges.

It streamlines assignment workflows between faculty and students without requiring email accounts:
- **Teachers** register and log in with their **10-Digit Mobile Number + Password**.
- **Students** register and log in with their official **College PIN (e.g., `24170-CM-001`) + Password**.
- **Assignments** are written in physical student notebooks. Students photograph their work, upload to **Google Drive**, and submit sharing links with built-in URL validation.
- **Faculty** evaluate notebooks via an **"OPEN GOOGLE DRIVE"** button, assign marks (0–10), and write constructive feedback notes.

---

## 🌟 Key Features

- **No Email Required**: All authentication uses mobile numbers (teachers) and college PINs (students) with secure internal Firebase Auth UID mapping.
- **Strict CSE Scope**: Tailored exclusively for CSE across **1st, 3rd, 4th, and 5th Semesters**.
- **One Faculty, Multiple Classes**: Teachers manage classes and subjects across all semesters from a single dashboard.
- **PIN Search & Invitations**: Faculty search students by PIN and send class invitations; students explicitly click **ACCEPT** or **DECLINE**.
- **Google Drive Submissions**: Zero file bloat in Firebase Storage. Safe Drive URL validation and submission confirmation.
- **Instant Marks & Feedback**: Students track itemized graded assignments with feedback and a simple diploma academic performance summary.
- **Same-Device Multi-User Isolation**: Absolute separation by Firebase Auth UID. Signing out immediately purges session caches so shared phones never leak student data.
- **PWA & Responsive**: Installable on Android, tablets, and desktop with offline UI shell caching and mobile bottom navigation.
- **Firestore Security**: Production-grade `firestore.rules` preventing unauthorized cross-user reads or mark tampering.

---

## 🚀 Live Demo

- **Production App**: [https://sam-app-jet.vercel.app](https://sam-app-jet.vercel.app)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend / DB**: Firebase Authentication & Firestore Database
- **Media Storage**: Cloudinary (Dedicated Folders: `sam/assignments/questions` and `sam/assignments/submissions`)
- **Hosting / Deploy**: Vercel & PWA Service Worker
- **Testing**: Automated verification suites (`node test_question_image.mjs`, `node test_assignment_system.mjs`, `node test_fullscreen_evaluation.mjs`, `node test_submission_grading.mjs`)

---

## 📷 Teacher Camera Capture Feature

### Purpose
Enables faculty to directly capture physical question papers, handwritten questions, circuit diagrams, and blackboard diagrams using their device camera during assignment creation, eliminating the need to type out complex questions, mathematical formulas, or diagrams manually.

### Multi-Page Workflow & User Flow
1. **Creation Interface**: In the Teacher Dashboard (`Create New Assignment`), faculty can type instructions and choose to attach question images via **[📷 Capture with Camera]** or **[📁 Upload Question File]**.
2. **Live Viewfinder**: Faculty access an interactive full-screen camera viewfinder with real-time video preview and front/back (`facingMode`) camera toggle (defaulting to the rear environment camera on mobile).
3. **Multi-Page Capture Strip**:
   - Faculty can capture multiple sequential pages (`Page 1`, `Page 2`, `Page 3`, etc.).
   - Each captured page appears in a thumbnail management strip showing page numbering, source, and quick action buttons:
     - **Zoom / Preview**: Inspect the high-resolution capture in full resolution.
     - **Retake**: Reopen camera directly for that specific page without affecting others.
     - **Delete**: Remove a specific page from the sequence.
     - **Add More Pages**: Append additional pages to the question set.
4. **Assignment Inspection & Preview**: Before final publication, an **Assignment Preview** dialog displays all typed details alongside the multi-page question image gallery with actions: `[ Edit ]`, `[ Add More ]`, and `[ Publish Assignment ]`.
5. **Student View**: Students can view the multi-page question images directly in their Assignment Details with a page carousel/tab switcher and full-screen lightbox zoom inspection.

### Camera Technology & Stream Lifecycle
- **WebRTC `navigator.mediaDevices.getUserMedia`**: Direct hardware camera stream with fallback constraints (`{ ideal: 'environment' }` on mobile, default desktop video device).
- **Stream Lifecycle Management**: Media tracks (`MediaStreamTrack.stop()`) are strictly halted immediately upon modal dismissal, photo capture confirmation, page retake, or component unmount to prevent camera LED indicator persistence or battery drain.
- **Client-Side Compression**: Captured photos are compressed via `compressQuestionImage()` using HTML5 Canvas (`image/jpeg`, max 1600px width/height) to preserve crisp legibility of handwritten ink and diagrams while reducing upload latency and bandwidth.

### Cloudinary Integration
- **Logical Folder Separation**: Teacher question images are stored in Cloudinary under the dedicated folder:
  ```typescript
  CLOUDINARY_QUESTIONS_FOLDER = 'sam/assignments/questions'
  ```
  This cleanly isolates teacher question content from student notebook submissions (`sam/assignments/submissions`).
- **No Watermarks**: Unlike student submission photos (which require student PIN and timestamp security watermarks), teacher question photos are uploaded clean and unwatermarked for maximum diagram legibility.

### Firebase / Firestore Data Schema
Assignment documents in the `assignments` Firestore collection support both single-page legacy compatibility and full multi-page schema:
- `questionImageUrl` (string, optional): URL of the primary/first question page (maintains 100% backward compatibility with legacy consumers).
- `questionImageUrls` (string[], optional): Ordered array of all captured question page Cloudinary URLs.
- `questionImages` (array, optional): Detailed metadata array containing `{ url: string, publicId?: string, createdAt: string }` for every question page.

### Testing & Verification
The feature is validated with automated test suites:
```bash
# Run question image capture and upload tests
node test_question_image.mjs

# Run full assignment creation and publishing test suite
node test_assignment_system.mjs
```

---

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd sam-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run the test suite**:
   ```bash
   npx tsx src/test-scenarios-runner.ts
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License

Developed for Diploma Final-Year Project • Computer Science & Engineering (CSE).
