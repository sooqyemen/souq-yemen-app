// src/screens/AdminDashboardScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_OPTIONS = ['active', 'hidden', 'endedAuction', 'sold'];

const AdminDashboardScreen = () => {
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const [usdToYer, setUsdToYer] = useState('');
  const [sarToYer, setSarToYer] = useState('');
  const [loadingRates, setLoadingRates] = useState(true);
  const [savingRates, setSavingRates] = useState(false);

  useEffect(() => {
    // تحميل آخر الإعلانات
    const q = query(
      collection(db, 'listings'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setListings(data);
        setLoadingListings(false);
      },
      err => {
        console.log('Error loading listings for admin: ', err);
        setLoadingListings(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    // تحميل أسعار الصرف
    const loadRates = async () => {
      try {
        const ref = doc(db, 'settings', 'rates');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUsdToYer(String(data.usdToYer || ''));
          setSarToYer(String(data.sarToYer || ''));
        }
      } catch (err) {
        console.log('Error loading rates in admin: ', err);
      } finally {
        setLoadingRates(false);
      }
    };

    loadRates();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'listings', id), {
        status: newStatus,
      });
    } catch (err) {
      console.log('Error updating listing status:', err);
      Alert.alert('خطأ', 'تعذر تحديث حالة الإعلان.');
    }
  };

  const handleDeleteListing = (id) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الإعلان نهائياً؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'listings', id));
            } catch (err) {
              console.log('Error deleting listing:', err);
              Alert.alert('خطأ', 'تعذر حذف الإعلان.');
            }
          },
        },
      ]
    );
  };

  const handleSaveRates = async () => {
    const usd = parseFloat(usdToYer);
    const sar = parseFloat(sarToYer);

    if (isNaN(usd) || usd <= 0 || isNaN(sar) || sar <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال قيم صحيحة لأسعار الصرف.');
      return;
    }

    try {
      setSavingRates(true);
      const ref = doc(db, 'settings', 'rates');
      await setDoc(ref, {
        usdToYer: usd,
        sarToYer: sar,
      }, { merge: true });
      Alert.alert('تم', 'تم حفظ أسعار الصرف بنجاح.');
    } catch (err) {
      console.log('Error saving rates:', err);
      Alert.alert('خطأ', 'تعذر حفظ أسعار الصرف.');
    } finally {
      setSavingRates(false);
    }
  };

  const renderListingItem = ({ item }) => {
    const {
      id,
      title,
      city,
      category,
      priceYER,
      priceSAR,
      priceUSD,
      isAuction,
      status,
      ownerEmail,
      createdAt,
    } = item;

    let createdText = '';
    try {
      if (createdAt && createdAt.toDate) {
        const d = createdAt.toDate();
        createdText = d.toLocaleString();
      }
    } catch (e) {
      createdText = '';
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title || 'بدون عنوان'}
        </Text>
        <Text style={styles.cardSub}>
          {city || 'بدون مدينة'} • {category || 'قسم عام'}
        </Text>
        <Text style={styles.cardSub}>
          المالك: {ownerEmail || 'غير معروف'}
        </Text>
        {createdText ? (
          <Text style={styles.cardSub}>تاريخ الإضافة: {createdText}</Text>
        ) : null}

        <View style={{ marginTop: 6 }}>
          <Text style={styles.priceLine}>
            ﷼ يمني: {priceYER ? Math.round(priceYER) : '-'}
          </Text>
          <Text style={styles.priceLine}>
            ﷼ سعودي: {priceSAR ? Math.round(priceSAR) : '-'}
          </Text>
          <Text style={styles.priceLine}>
            $ دولار: {priceUSD ? Math.round(priceUSD) : '-'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.statusLabel}>الحالة الحالية: {status || 'غير محددة'}</Text>
          {isAuction && <Text style={styles.badgeAuction}>مزاد</Text>}
        </View>

        <View style={styles.statusButtonsRow}>
          {STATUS_OPTIONS.map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.statusButton,
                status === st && styles.statusButtonActive,
              ]}
              onPress={() => handleUpdateStatus(id, st)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === st && styles.statusButtonTextActive,
                ]}
              >
                {st === 'active'
                  ? 'نشط'
                  : st === 'hidden'
                  ? 'مخفي'
                  : st === 'endedAuction'
                  ? 'انتهى المزاد'
                  : 'مباع'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteListing(id)}
        >
          <Text style={styles.deleteButtonText}>حذف الإعلان</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>لوحة الإدارة</Text>

      {/* قسم أسعار الصرف */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>أسعار الصرف</Text>
        {loadingRates ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" />
            <Text style={{ marginTop: 4 }}>جاري تحميل الأسعار...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>1 دولار = كم ريال يمني؟</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={usdToYer}
              onChangeText={setUsdToYer}
            />

            <Text style={styles.label}>1 ريال سعودي = كم ريال يمني؟</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={sarToYer}
              onChangeText={setSarToYer}
            />

            <TouchableOpacity
              style={[styles.saveButton, savingRates && { opacity: 0.6 }]}
              onPress={handleSaveRates}
              disabled={savingRates}
            >
              {savingRates ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>حفظ أسعار الصرف</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* قسم الإعلانات */}
      <Text style={[styles.boxTitle, { marginTop: 12 }]}>إدارة الإعلانات</Text>

      {loadingListings ? (
        <View style={[styles.center, { marginTop: 12 }]}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 4 }}>جاري تحميل الإعلانات...</Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={[styles.center, { marginTop: 12 }]}>
          <Text>لا توجد إعلانات حالياً.</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          scrollEnabled={false} // لأننا داخل ScrollView
        />
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#0077cc',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  priceLine: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: '#444',
  },
  badgeAuction: {
    backgroundColor: '#e67e22',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 6,
    marginTop: 4,
  },
  statusButtonActive: {
    backgroundColor: '#0077cc',
    borderColor: '#0077cc',
  },
  statusButtonText: {
    fontSize: 11,
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#cc0000',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default AdminDashboardScreen;
