import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import ListingCard from '../components/ListingCard';

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [rates, setRates] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setListings(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const loadRates = async () => {
      const ref = doc(db, 'settings', 'rates');
      const snap = await getDoc(ref);
      if (snap.exists()) setRates(snap.data());
    };
    loadRates();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={listings.map((l) => ({ ...l, rates }))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() =>
              navigation.navigate('ListingDetails', { listingId: item.id })
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
