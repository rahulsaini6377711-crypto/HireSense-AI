// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Import Auth functions
import { getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";

// Import Firestore functions
import { getFirestore, doc, setDoc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

// Initialize Auth with persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set persistence:", error);
});

// Initialize Firestore
export const db = getFirestore(app);

// Export auth functions
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
};

// Export Firestore functions
export { doc, setDoc, updateDoc, getDoc, onSnapshot };