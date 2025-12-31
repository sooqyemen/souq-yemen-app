import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, TextInput } from 'react-native';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboardScreen() {
  const [listings, setListings] = useState([]);
  const [usdToYer, setUsdToYer] = useState('1632');
  const [sarToYer, setSarToYer] = useState('425');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'listings'), (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const loadRates = async () => {
      const ref = doc(db, 'settings', 'rates');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUsdToYer(String(data.usdToYer));
        setSarToYer(String(data.sarToYer));
      }
    };
    loadRates();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'listings', id));
      Alert.alert('تم', 'تم حذف الإعلان');
    } catch (e) {
      console.log(e);
      Alert.alert('خطأ', 'تعذر حذف الإعلان');
    }
  };

  const handleSaveRates = async () => {
    try {
      await setDoc(doc(db, 'settings', 'rates'), {
        usdToYer: Number(usdToYer),
        sarToYer: Number(sarToYer)
      });
      Alert.alert('تم', 'تم حفظ أسعار الصرف');
    } catch (e) {
      console.log(e);
      Alert.alert('خطأ', 'تعذر حفظ أسعار الصرف');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>لوحة الإدارة</Text>

      <Text style={styles.sectionTitle}>أسعار الصرف</Text>
      <TextInput
        style={styles.input}
        placeholder="سعر الدولار مقابل الريال اليمني"
        keyboardType="numeric"
        value={usdToYer}
        onChangeText={setUsdToYer}
      />
      <TextInput
        style={styles.input}
        placeholder="سعر الريال السعودي مقابل الريال اليمني"
        keyboardType="numeric"
        value={sarToYer}
        onChangeText={setSarToYer}
      />
      <Button title="حفظ الأسعار" onPress={handleSaveRates} />

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>كل الإعلانات</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listingRow}>
            <Text style={{ flex: 1 }} numberOfLines={1}>{item.title}</Text>
            <Button title="حذف" onPress={() => handleDelete(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#eee'
  }
});
