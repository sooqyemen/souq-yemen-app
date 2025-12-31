// src/screens/MapScreen.js
// شاشة "الخريطة" الحالية تعرض الإعلانات حسب المدينة
// بدون خرائط حقيقية الآن، لتعمل بدون أي مكتبات إضافية.
// لاحقاً نقدر نضيف خريطة فعلية (OSM) ونربطها بنفس البيانات.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';

const MapScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));
        setListings(data);
        setLoading(false);
      },
      err => {
        console.log('Error loading listings in MapScreen:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filteredBySearch = useMemo(() => {
    return listings.filter((item) => {
      const city = (item.city || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const cf = cityFilter.trim().toLowerCase();
      const kf = categoryFilter.trim().toLowerCase();

      const matchCity = cf ? city.includes(cf) : true;
      const matchCat = kf ? cat.includes(kf) : true;
      return matchCity && matchCat;
    });
  }, [listings, cityFilter, categoryFilter]);

  // تجميع الإعلانات حسب المدينة
  const groupedByCity = useMemo(() => {
    const map = new Map();
    for (const item of filteredBySearch) {
      const city = item.city || 'مدينة غير معروفة';
      if (!map.has(city)) {
        map.set(city, []);
      }
      map.get(city).push(item);
    }

    return Array.from(map.entries()).map(([city, items]) => ({
      city,
      count: items.length,
      items,
    }));
  }, [filteredBySearch]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>جاري تحميل الإعلانات...</Text>
      </View>
    );
  }

  if (!listings.length) {
    return (
      <View style={styles.center}>
        <Text>لا توجد إعلانات حالياً.</Text>
      </View>
    );
  }

  const renderCityGroup = ({ item }) => {
    return (
      <View style={styles.cityCard}>
        <View style={styles.cityHeader}>
          <Text style={styles.cityName}>{item.city}</Text>
          <Text style={styles.cityCount}>عدد الإعلانات: {item.count}</Text>
        </View>

        {item.items.slice(0, 3).map((ad) => (
          <TouchableOpacity
            key={ad.id}
            style={styles.adRow}
            onPress={() =>
              navigation.navigate('ListingDetails', {
                listingId: ad.id,
                listing: ad,
              })
            }
          >
            <Text style={styles.adTitle} numberOfLines={1}>
              {ad.title || 'إعلان بدون عنوان'}
            </Text>
            <Text style={styles.adPrice}>
              ﷼ يمني: {ad.priceYER ? Math.round(ad.priceYER) : '-'}
            </Text>
            {ad.isAuction && (
              <Text style={styles.badgeAuction}>مزاد</Text>
            )}
          </TouchableOpacity>
        ))}

        {item.items.length > 3 && (
          <Text style={styles.moreText}>
            + {item.items.length - 3} إعلان/إعلانات أخرى في هذه المدينة
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* شريط الفلترة أعلى الشاشة */}
      <View style={styles.filtersRow}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={styles.filterLabel}>بحث بالمدينة</Text>
          <TextInput
            style={styles.input}
            placeholder="مثلاً: جدة / صنعاء"
            value={cityFilter}
            onChangeText={setCityFilter}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.filterLabel}>بحث بالقسم</Text>
          <TextInput
            style={styles.input}
            placeholder="عقارات / سيارات / جوالات..."
            value={categoryFilter}
            onChangeText={setCategoryFilter}
          />
        </View>
      </View>

      {/* تنبيه بسيط أن هذه نسخة بدون خريطة فعلية */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          هذه نسخة مبدئية لعرض الإعلانات حسب المدن.
          لاحقاً يمكن إضافة خريطة فعلية (OpenStreetMap) لعرض المواقع كنقاط (Pins).
        </Text>
      </View>

      <FlatList
        data={groupedByCity}
        keyExtractor={(item) => item.city}
        renderItem={renderCityGroup}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 2,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 13,
  },
  infoBox: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 2,
    backgroundColor: '#eef6ff',
    borderRadius: 8,
    padding: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#444',
  },
  cityCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
  },
  cityCount: {
    fontSize: 12,
    color: '#555',
  },
  adRow: {
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  adPrice: {
    fontSize: 12,
    color: '#333',
  },
  badgeAuction: {
    alignSelf: 'flex-start',
    marginTop: 2,
    backgroundColor: '#e67e22',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
  },
  moreText: {
    marginTop: 4,
    fontSize: 11,
    color: '#777',
  },
});

export default MapScreen;
