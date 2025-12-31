import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import PriceWithCurrencies from '../components/PriceWithCurrencies';
import { useAuth } from '../context/AuthContext';

export default function ListingDetailsScreen({ route }) {
  const { listingId } = route.params;
  const [listing, setListing] = useState(null);
  const [rates, setRates] = useState(null);
  const [bids, setBids] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, 'listings', listingId);
      const snap = await getDoc(ref);
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() });
    };
    load();
  }, [listingId]);

  useEffect(() => {
    const loadRates = async () => {
      const ref = doc(db, 'settings', 'rates');
      const snap = await getDoc(ref);
      if (snap.exists()) setRates(snap.data());
    };
    loadRates();
  }, []);

  useEffect(() => {
    if (!listingId) return;
    const q = query(
      collection(db, 'listings', listingId, 'bids'),
      orderBy('amount', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setBids(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [listingId]);

  const handleBid = async () => {
    if (!user) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول للمزايدة');
      return;
    }
    if (!listing?.isAuction) {
      Alert.alert('تنبيه', 'هذا الإعلان ليس مزاداً');
      return;
    }
    // نسخة بسيطة: مزايدة ثابتة أعلى بـ 1000 YER مثلاً
    const current = bids[0]?.amount || listing.price;
    const newAmount = current + 1000;

    try {
      await addDoc(collection(db, 'listings', listingId, 'bids'), {
        userId: user.uid,
        amount: newAmount,
        createdAt: serverTimestamp()
      });
      Alert.alert('تم', `تمت المزايدة بمبلغ ${newAmount}`);
    } catch (e) {
      console.log(e);
      Alert.alert('خطأ', 'تعذر تسجيل المزايدة');
    }
  };

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text>جارِ التحميل...</Text>
      </View>
    );
  }

  const highestBid = bids[0]?.amount || null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.city}>{listing.city} • {listing.category}</Text>
      <PriceWithCurrencies
        price={listing.price}
        currency={listing.currency}
        rates={rates}
      />
      {listing.isAuction && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionTitle}>نظام المزاد</Text>
          <Text>أعلى مزايدة حالياً: {highestBid || listing.price}</Text>
          <Button title="مزايدة أعلى بمقدار 1000" onPress={handleBid} />
        </View>
      )}
      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>الوصف</Text>
        <Text>{listing.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  city: { color: '#555', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }
});
