// ضع هنا إعدادات مشروع Firebase الخاص بك
// من لوحة التحكم: Project settings -> General -> Your apps -> SDK setup and configuration

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_LRQdmb3Kyo6NVroUMvHGnx-Ciz9OIcU",
  authDomain: "aqarabhour-c8a9f.firebaseapp.com",
  databaseURL: "https://aqarabhour-c8a9f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aqarabhour-c8a9f",
  storageBucket: "aqarabhour-c8a9f.firebasestorage.app",
  messagingSenderId: "709287383516",
  appId: "1:709287383516:web:008ccd7371f88c8c8f3f19"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
