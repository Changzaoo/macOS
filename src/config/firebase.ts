import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

// Use fallback strings so Firebase doesn't throw during module init when vars are missing.
// The actual auth/firestore calls will fail gracefully and be caught in AuthContext.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'not-configured',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'not-configured',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'not-configured',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'not-configured',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'not-configured',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'not-configured',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
