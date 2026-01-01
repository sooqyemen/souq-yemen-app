// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// نفس الإعدادات اللي استخدمناها من قبل
const firebaseConfig = {
  apiKey: "AIzaSyD_LRQdmb3Kyo6NVroUMvHGnx-Ciz9OIcU",
  authDomain: "aqarabhour-c8a9f.firebaseapp.com",
  databaseURL: "https://aqarabhour-c8a9f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aqarabhour-c8a9f",
  storageBucket: "aqarabhour-c8a9f.firebasestorage.app",
  messagingSenderId: "709287383516",
  appId: "1:709287383516:web:008ccd7371f88c8c8f3f19",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// هذا الجديد عشان رفع الصور
export const storage = getStorage(app);

export default app;
