import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForLocalTesting1234567890',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'shogun-projects.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'shogun-projects-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'shogun-projects-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:demo1234567890abcdef',
};

// Initialize Firebase App instance
export const app: FirebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize and export Firebase Authentication, Firestore, and Functions instances
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

// Connect to Local Firebase Emulators when running in development mode
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.info('[Firebase Emulators] Connected: Auth @ http://localhost:9099, Firestore @ localhost:8080, Functions @ localhost:5001');
  } catch (error) {
    // Catch duplicate emulator attachment errors in Vite HMR cycles
    console.debug('[Firebase Emulators] Emulator connection already established:', error);
  }
}

export default app;
