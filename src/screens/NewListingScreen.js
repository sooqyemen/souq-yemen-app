import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Switch, Text } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function NewListingScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('YER');
  const [isAuction, setIsAuction] = useState(false);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
      return;
    }
    if (!title || !price) {
      Alert.alert('تنبيه', 'أكمل عنوان الإعلان والسعر');
      return;
    }

    try {
      await addDoc(collection(db, 'listings'), {
        title,
        description,
        city,
        category,
        price: Number(price),
        currency,
        isAuction,
        ownerId: user.uid,
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      setTitle('');
      setDescription('');
      setCity('');
      setCategory('');
      setPrice('');
      setCurrency('YER');
      setIsAuction(false);
      Alert.alert('تم', 'تم نشر إعلانك');
    } catch (e) {
      console.log(e);
      Alert.alert('خطأ', 'تعذر حفظ الإعلان');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="عنوان الإعلان"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="المدينة"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="القسم (سيارات، عقارات، ...)"
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={styles.input}
        placeholder="الوصف"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="السعر"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="العملة (YER / SAR / USD)"
        value={currency}
        onChangeText={setCurrency}
      />
      <View style={styles.row}>
        <Text>تفعيل المزاد</Text>
        <Switch value={isAuction} onValueChange={setIsAuction} />
      </View>
      <Button title="نشر الإعلان" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  }
});
