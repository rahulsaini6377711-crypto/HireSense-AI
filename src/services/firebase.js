// Firebase configuration and initialization
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
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Retrieve credentials from Vite environment variables, with fallback to default credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCPViiXkhxQ4KhX_CZHxvpEGGGfY_rqPW8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hiresense-ai-4d791.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hiresense-ai-4d791",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hiresense-ai-4d791.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "738270486650",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:738270486650:web:9deb9fb8eede17129edbc3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-687FBD9W5Y"
};

// Initialize Firebase App
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

// Initialize Firestore with modern persistent local cache settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Storage
export const storage = getStorage(app);

export default app;
