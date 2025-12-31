// src/screens/ProfileScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

// نفس إيميل المدير اللي حطيناه في RootNavigator
const ADMIN_EMAIL = 'mansouralbarout@gmail.com';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [myListingsCount, setMyListingsCount] = useState(0);
  const [loadingListings, setLoadingListings] = useState(true);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!user) {
      setLoadingListings(false);
      return;
    }

    const q = query(
      collection(db, 'listings'),
      where('ownerId', '==', user.uid)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        setMyListingsCount(snap.docs.length);
        setLoadingListings(false);
      },
      err => {
        console.log('Error loading my listings in ProfileScreen:', err);
        setLoadingListings(false);
      }
    );

    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.log('Error logging out:', err);
      Alert.alert('خطأ', 'تعذر تسجيل الخروج حالياً.');
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>أنت غير مسجل دخول</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* معلومات الحساب */}
      <View style={styles.box}>
        <Text style={styles.title}>حسابي</Text>
        <Text style={styles.label}>البريد الإلكتروني:</Text>
        <Text style={styles.value}>{user.email}</Text>

        {isAdmin && (
          <Text style={[styles.value, { color: '#e67e22', marginTop: 4 }]}>
            (مدير النظام)
          </Text>
        )}
      </View>

      {/* إحصائيات بسيطة */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>إحصائيات</Text>
        {loadingListings ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator size="small" />
            <Text style={{ marginLeft: 6 }}>جاري تحميل إعلاناتك...</Text>
          </View>
        ) : (
          <Text style={styles.statText}>
            عدد الإعلانات التي نشرتها: {myListingsCount}
          </Text>
        )}
      </View>

      {/* أزرار الإجراءات */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Text style={styles.buttonText}>لوحة الإدارة</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  value: {
    fontSize: 14,
    marginTop: 2,
  },
  boxTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  adminButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ProfileScreen;
