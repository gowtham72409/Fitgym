import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoDummyKeyForFitQuestLocalDev",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fitquest-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fitquest-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fitquest-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

let app = null;
let auth = null;
let googleProvider = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.warn("Firebase client initialization error (expected in sandbox or incomplete public config):", e);
}

export { app, auth, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, onAuthStateChanged };
