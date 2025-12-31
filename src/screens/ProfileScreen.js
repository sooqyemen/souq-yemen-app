import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>حسابي</Text>
      <Text>{user?.email}</Text>
      <View style={{ height: 12 }} />
      <Button title="لوحة الإدارة" onPress={() => navigation.navigate('AdminDashboard')} />
      <View style={{ height: 12 }} />
      <Button title="تسجيل الخروج" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 }
});
