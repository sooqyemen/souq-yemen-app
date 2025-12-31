// src/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

// ننشئ السياق
const AuthContext = createContext();

// هوك جاهز للاستخدام في كل مكان: const { user, login, register, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);

// المزود الرئيسي اللي نلف فيه التطبيق كامل في App.js
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // بيانات المستخدم الحالي
  const [initializing, setInitializing] = useState(true); // هل لسه نتحقق من حالة تسجيل الدخول؟

  useEffect(() => {
    // نسمع أي تغيّر في حالة تسجيل الدخول من Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // تسجيل الدخول
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  // إنشاء حساب جديد
  const register = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // ممكن نضيف اسم لاحقاً
    await updateProfile(cred.user, {
      // displayName: 'User',
    });
    return cred.user;
  };

  // تسجيل الخروج
  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    initializing,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
