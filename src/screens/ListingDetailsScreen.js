// src/screens/ListingDetailsScreen.js

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const ListingDetailsScreen = ({ route }) => {
  const { listingId, listing: listingFromParam } = route.params || {};
  const { user } = useAuth();

  const [listing, setListing] = useState(listingFromParam || null);
  const [loadingListing, setLoadingListing] = useState(!listingFromParam);
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // تحميل بيانات الإعلان
  useEffect(() => {
    if (!listingId) return;

    const ref = doc(db, 'listings', listingId);
    const unsub = onSnapshot(
      ref,
      snap => {
        if (snap.exists()) {
          setListing({ id: snap.id, ...snap.data() });
        }
        setLoadingListing(false);
      },
      err => {
        console.log('Error loading listing:', err);
        setLoadingListing(false);
      }
    );

    return () => unsub();
  }, [listingId]);

  // تحميل المزايدات (أعلى 20 مزايدة)
  useEffect(() => {
    if (!listingId) return;

    const bidsRef = collection(db, 'listings', listingId, 'bids');
    const q = query(bidsRef, orderBy('amount', 'desc'), limit(20));

    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBids(list);
        setLoadingBids(false);
      },
      err => {
        console.log('Error loading bids:', err);
        setLoadingBids(false);
      }
    );

    return () => unsub();
  }, [listingId]);

  const highestBid = useMemo(() => {
    if (!bids.length) return null;
    return bids[0];
  }, [bids]);

  if (loadingListing || !listing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>جاري تحميل تفاصيل الإعلان...</Text>
      </View>
    );
  }

  const {
    title,
    description,
    city,
    category,
    phone,
    priceYER,
    priceSAR,
    priceUSD,
    basePrice,
    baseCurrency,
    isAuction,
    auctionEndText,
    ownerEmail,
    status,
  } = listing;

  const handlePlaceBid = async () => {
    if (!user) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول قبل تقديم مزايدة.');
      return;
    }

    if (!isAuction) {
      Alert.alert('تنبيه', 'هذا الإعلان غير مفعّل كمزاد.');
      return;
    }

    const amountNum = parseFloat(bidAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح.');
      return;
    }

    // يجب أن تكون المزايدة أعلى من أعلى مزايدة أو من السعر الأساسي
    const minAllowed = highestBid ? highestBid.amount : basePrice || 0;
    if (amountNum <= minAllowed) {
      Alert.alert(
        'مبلغ غير كافٍ',
        `يجب أن تكون المزايدة أعلى من ${minAllowed}.`
      );
      return;
    }

    try {
      setSubmittingBid(true);
      const bidsRef = collection(db, 'listings', listingId, 'bids');
      await addDoc(bidsRef, {
        amount: amountNum,
        userId: user.uid,
        userEmail: user.email || '',
        createdAt: serverTimestamp(),
      });

      setBidAmount('');
      Alert.alert('تم', 'تم تسجيل المزايدة بنجاح.');
    } catch (err) {
      console.log('Error placing bid:', err);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ المزايدة، حاول مرة أخرى.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const hidden =
      name.length <= 2 ? name[0] + '*' : name[0] + '***' + name[name.length - 1];
    return `${hidden}@${domain}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subText}>
        {city || 'بدون مدينة'} • {category || 'قسم عام'}
      </Text>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>السعر</Text>
        <Text style={styles.priceLine}>
          العملة الأساسية ({baseCurrency || 'YER'}): {basePrice || '-'}
        </Text>
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

      {description ? (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>الوصف</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      ) : null}

      <View style={styles.box}>
        <Text style={styles.boxTitle}>التواصل</Text>
        <Text style={styles.infoLine}>
          البريد: {ownerEmail || 'غير متوفر'}
        </Text>
        <Text style={styles.infoLine}>
          الجوال: {phone || 'غير متوفر (يمكنك استخدام الدردشة)'}
        </Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>حالة الإعلان</Text>
        <Text style={styles.infoLine}>
          {status === 'active' ? 'نشط' : status || 'غير محدد'}
        </Text>
      </View>

      {isAuction && (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>المزاد</Text>
          <Text style={styles.infoLine}>
            وقت انتهاء المزاد: {auctionEndText || 'لم يتم تحديده نصياً'}
          </Text>
          {loadingBids ? (
            <ActivityIndicator size="small" />
          ) : (
            <>
              <Text style={[styles.infoLine, { marginTop: 6 }]}>
                أعلى مزايدة حالياً:{' '}
                {highestBid ? highestBid.amount : 'لا توجد مزايدات بعد'}
              </Text>
              {highestBid && (
                <Text style={styles.infoLine}>
                  مقدمة من: {maskEmail(highestBid.userEmail)}
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {isAuction && (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>تقديم مزايدة جديدة</Text>
          <TextInput
            style={styles.input}
            placeholder="مبلغ المزايدة"
            keyboardType="numeric"
            value={bidAmount}
            onChangeText={setBidAmount}
          />
          <TouchableOpacity
            style={[
              styles.button,
              submittingBid && { opacity: 0.6 },
            ]}
            onPress={handlePlaceBid}
            disabled={submittingBid}
          >
            {submittingBid ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>تأكيد المزايدة</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isAuction && !loadingBids && bids.length > 1 && (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>آخر المزايدات</Text>
          {bids.slice(0, 5).map((b) => (
            <Text key={b.id} style={styles.infoLine}>
              {b.amount} – {maskEmail(b.userEmail)}
            </Text>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  boxTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  priceLine: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoLine: {
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default ListingDetailsScreen;
