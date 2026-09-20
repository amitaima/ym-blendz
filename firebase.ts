
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBWvoaV05Gsev2pd6hkXFXE0oHXLdWGqno",
  authDomain: "ym-blendz.firebaseapp.com",
  projectId: "ym-blendz",
  storageBucket: "ym-blendz.firebasestorage.app",
  messagingSenderId: "422921177788",
  appId: "1:422921177788:web:e4c10ae3ae2c4770001eb9",
  measurementId: "G-ES42DHGWXW"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics: any = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, auth, db, analytics };