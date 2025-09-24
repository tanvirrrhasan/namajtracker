import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoO_bYttGCbXCRPU8m-EGvmZwFa8MOSKA",
  authDomain: "siratulsabiqun.firebaseapp.com",
  projectId: "siratulsabiqun",
  storageBucket: "siratulsabiqun.firebasestorage.app",
  messagingSenderId: "486046963009",
  appId: "1:486046963009:web:e73405fc950d592616fdc0",
  measurementId: "G-XGCK09HD71",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);


