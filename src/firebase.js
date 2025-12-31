// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// الإعدادات اللي رسلتها لي:
const firebaseConfig = {
  apiKey: "AIzaSyD_LRQdmb3Kyo6NVroUMvHGnx-Ciz9OIcU",
  authDomain: "aqarabhour-c8a9f.firebaseapp.com",
  databaseURL: "https://aqarabhour-c8a9f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aqarabhour-c8a9f",
  storageBucket: "aqarabhour-c8a9f.firebasestorage.app",
  messagingSenderId: "709287383516",
  appId: "1:709287383516:web:008ccd7371f88c8c8f3f19"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// الخدمات اللي نستخدمها في التطبيق
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
