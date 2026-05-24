import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

// When env vars are absent (local dev without .env.local), export nulls so
// React can mount and show the auth page instead of crashing with a blank screen.
export let auth = null;
export let db = null;

if (apiKey) {
  const firebaseConfig = {
    apiKey,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Offline persistence: serves Firestore data from IndexedDB instantly on
  // repeat visits, then syncs with the server in the background.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
}