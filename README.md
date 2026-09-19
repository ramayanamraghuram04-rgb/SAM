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
- **Hosting / Deploy**: Vercel & PWA Service Worker
- **Testing**: Automated 26-scenario verification suite (`npx tsx src/test-scenarios-runner.ts`)

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
