import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const env: Record<string, any> = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env) 
    ? (import.meta as any).env 
    : ((globalThis as any)?.process?.env || {});

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSySAMDemoProjectKeyCSE170Valid2026",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "sam-cse-manager.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "sam-cse-manager",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "sam-cse-manager.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "241700000001",
  appId: env.VITE_FIREBASE_APP_ID || "1:241700000001:web:samcseassignmentmanager"
};

export const isLiveFirebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY && 
  env.VITE_FIREBASE_PROJECT_ID &&
  !String(env.VITE_FIREBASE_API_KEY).includes('Demo')
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.warn('Firebase initialized with fallback configuration:', err);
  app = getApps().length === 0 ? initializeApp(firebaseConfig, 'SAM_APP_FALLBACK') : getApp('SAM_APP_FALLBACK');
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
