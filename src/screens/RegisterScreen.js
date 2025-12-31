// src/screens/RegisterScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('خطأ', 'الرجاء تعبئة جميع الحقول.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password);
      // بعد إنشاء الحساب، AuthContext + RootNavigator بينقلونه تلقائياً للداخل
    } catch (err) {
      console.log('Register error:', err);
      let msg = 'تعذر إنشاء الحساب. حاول مرة أخرى.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'هذا البريد مستخدم مسبقاً.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'صيغة البريد الإلكتروني غير صحيحة.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'كلمة المرور ضعيفة، استخدم كلمة أقوى.';
      }
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>إنشاء حساب جديد</Text>

      <Text style={styles.label}>البريد الإلكتروني</Text>
      <TextInput
        style={styles.input}
        placeholder="example@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>كلمة المرور</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>تأكيد كلمة المرور</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>إنشاء الحساب</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={goToLogin} style={styles.linkButton}>
        <Text style={styles.linkText}>
          لديك حساب بالفعل؟ <Text style={{ fontWeight: '700' }}>تسجيل الدخول</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#2ecc71',
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    color: '#333',
  },
});

export default RegisterScreen;
