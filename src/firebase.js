// Redirect to single centralized Firebase service initialization to prevent multiple '[DEFAULT]' app creation conflicts.
export * from './services/firebase';
import firebaseApp from './services/firebase';
export default firebaseApp;