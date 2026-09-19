import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDoQ2kGFgDytfIRnJ3dSuUfikkbayo4oDU",
  authDomain: "smart-ssignment-manager.firebaseapp.com",
  projectId: "smart-ssignment-manager",
  storageBucket: "smart-ssignment-manager.firebasestorage.app",
  messagingSenderId: "404903688506",
  appId: "1:404903688506:web:277e1433850f61ebdb7803",
  measurementId: "G-HCV9ZF50VR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupAdmin() {
  const mobile = "6281803875";
  const password = "raghu9988@";
  const email = `admin_${mobile}@sam.internal`;

  console.log(`Setting up Admin with email: ${email}...`);

  let uid;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`Admin user signed in with UID: ${uid}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log('Admin user not found. Creating user in Firebase Auth...');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`Admin user created with UID: ${uid}`);
    } else {
      console.error('Sign-in error:', err);
      throw err;
    }
  }

  // Now set the profile document in Firestore: users/{uid}
  const adminProfile = {
    uid,
    role: 'admin',
    name: 'Raghuram (Admin)',
    mobile,
    department: 'CSE',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  console.log('Writing admin profile to users/' + uid + '...');
  await setDoc(doc(db, 'users', uid), adminProfile, { merge: true });
  console.log('SUCCESS! Admin profile saved in Firestore users collection.');

  // Verify read
  const snap = await getDoc(doc(db, 'users', uid));
  console.log('Verified Firestore profile:', snap.data());
}

setupAdmin().catch(console.error);
