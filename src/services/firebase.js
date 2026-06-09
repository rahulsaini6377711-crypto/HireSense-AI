// Firebase configuration and initialization
// Replace the placeholder values with your Firebase config in .env.local
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCPViiXkhxQ4KhX_CZHxvpEGGGfY_rqPW8",
  authDomain: "hiresense-ai-4d791.firebaseapp.com",
  projectId: "hiresense-ai-4d791",
  storageBucket: "hiresense-ai-4d791.firebasestorage.app",
  messagingSenderId: "738270486650",
  appId: "1:738270486650:web:9deb9fb8eede17129edbc3",
  measurementId: "G-687FBD9W5Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Persist user session across browser refreshes
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Firebase persistence error:', error);
});

// Re-export auth helpers for convenient imports
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
};

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
