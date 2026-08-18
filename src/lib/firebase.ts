import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  serverTimestamp, 
  enableIndexedDbPersistence,
  writeBatch
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "inspired-proposal-zq6d2",
  appId: "1:808156498070:web:35ae25210c0d1c90ee9ab7",
  apiKey: "AIzaSyDXOASyPY2iH7ev46Chhmsvx8nzKW2gs64",
  authDomain: "inspired-proposal-zq6d2.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-macropulseprocal-fa7ba336-1b63-41fd-be6d-232e89dafb5b",
  storageBucket: "inspired-proposal-zq6d2.firebasestorage.app",
  messagingSenderId: "808156498070"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth helper functions
export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
};

export const logoutUser = async () => {
  return await fbSignOut(auth);
};

export { 
  onAuthStateChanged
};
export type { User, User as FirebaseUser };
