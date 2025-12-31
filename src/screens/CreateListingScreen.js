// src/screens/CreateListingScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

const CURRENCIES = ['YER', 'SAR', 'USD'];

const CreateListingScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('YER');
  const [phone, setPhone] = useState('');
  const [isAuction, setIsAuction] = useState(false);
  const [auctionEndText, setAuctionEndText] = useState(''); // نص بسيط لتاريخ الانتهاء (نطوره لاحقًا)

  const [rates, setRates] = useState({ usdToYer: 1632, sarToYer: 425 });
  const [loadingRates, setLoadingRates] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const ref = doc(db, 'settings', 'rates');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setRates({
            usdToYer: data.usdToYer || 1632,
            sarToYer: data.sarToYer || 425,
          });
        }
      } catch (err) {
        console.log('Error loading rates:', err);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  const getPricesInAllCurrencies = () => {
    const basePrice = parseFloat(price || '0');
    if (!basePrice || !rates.usdToYer || !rates.sarToYer) return null;

    let yer, sar, usd;

    if (currency === 'YER') {
      yer = basePrice;
      sar = yer / rates.sarToYer;
      usd = yer / rates.usdToYer;
    } else if (currency === 'SAR') {
      sar = basePrice;
      yer = sar * rates.sarToYer;
      usd = yer / rates.usdToYer;
    } else {
      // USD
      usd = basePrice;
      yer = usd * rates.usdToYer;
      sar = yer / rates.sarToYer;
    }

    // تقريب بسيط
    const round = (n) => Math.round(n * 100) / 100;

    return {
      yer: round(yer),
      sar: round(sar),
      usd: round(usd),
    };
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول قبل إضافة إعلان.');
      return;
    }

    if (!title.trim() || !city.trim() || !category.trim() || !price.trim()) {
      Alert.alert('خطأ', 'الرجاء تعبئة الحقول الأساسية (العنوان، المدينة، القسم، السعر).');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('خطأ', 'السعر غير صحيح.');
      return;
    }

    const prices = getPricesInAllCurrencies();
    if (!prices) {
      Alert.alert('خطأ', 'تعذر حساب أسعار العملات. تأكد من الاتصال بالإنترنت.');
      return;
    }

    setSubmitting(true);

    try {
      const listingData = {
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        category: category.trim(),
        phone: phone.trim(),
        basePrice: numericPrice,
        baseCurrency: currency,
        priceYER: prices.yer,
        priceSAR: prices.sar,
        priceUSD: prices.usd,
        isAuction,
        auctionEndText: isAuction ? auctionEndText.trim() : '',
        ownerId: user.uid,
        ownerEmail: user.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active', // active | hidden | endedAuction | sold
        viewsCount: 0,
        bidsCount: 0,
        highestBid: null,
        highestBidUserId: null,
      };

      await addDoc(collection(db, 'listings'), listingData);

      Alert.alert('تم', 'تم إضافة الإعلان بنجاح.');
      // بعد النجاح نرجع للرئيسية أو صفحة إعلاناتي
      navigation.goBack();
    } catch (err) {
      console.error('Error adding listing:', err);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الإعلان. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const pricesPreview = price ? getPricesInAllCurrencies() : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>إضافة إعلان جديد</Text>

      <Text style={styles.label}>عنوان الإعلان *</Text>
      <TextInput
        style={styles.input}
        placeholder="مثلاً: شقة للإيجار في حي الياقوت"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>الوصف</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="اكتب تفاصيل الإعلان، المميزات، الشروط..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>المدينة *</Text>
      <TextInput
        style={styles.input}
        placeholder="مثلاً: جدة / صنعاء"
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.label}>القسم *</Text>
      <TextInput
        style={styles.input}
        placeholder="مثلاً: عقارات / سيارات / جوالات..."
        value={category}
        onChangeText={setCategory}
      />

      <Text style={styles.label}>السعر الأساسي *</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="مثلاً: 150000"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <View style={[styles.input, styles.currencyBox]}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCurrency(c)}
              style={[
                styles.currencyTag,
                currency === c && styles.currencyTagActive,
              ]}
            >
              <Text
                style={[
                  styles.currencyText,
                  currency === c && styles.currencyTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loadingRates ? (
        <View style={styles.ratesBox}>
          <ActivityIndicator size="small" />
          <Text style={styles.ratesText}>جاري تحميل أسعار الصرف...</Text>
        </View>
      ) : pricesPreview ? (
        <View style={styles.ratesBox}>
          <Text style={styles.ratesTitle}>عرض السعر بجميع العملات:</Text>
          <Text style={styles.ratesText}>﷼ يمني: {pricesPreview.yer}</Text>
          <Text style={styles.ratesText}>﷼ سعودي: {pricesPreview.sar}</Text>
          <Text style={styles.ratesText}>$ دولار: {pricesPreview.usd}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>رقم التواصل (اختياري)</Text>
      <TextInput
        style={styles.input}
        placeholder="مثلاً: 0500000000"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>تفعيل نظام المزاد؟</Text>
        <Switch value={isAuction} onValueChange={setIsAuction} />
      </View>

      {isAuction && (
        <>
          <Text style={styles.label}>وقت انتهاء المزاد (نص بسيط الآن)</Text>
          <TextInput
            style={styles.input}
            placeholder="مثلاً: 2025-01-31 11:00 مساءً"
            value={auctionEndText}
            onChangeText={setAuctionEndText}
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.button, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>حفظ الإعلان</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  currencyTag: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 2,
  },
  currencyTagActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  currencyText: {
    fontSize: 12,
  },
  currencyTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  ratesBox: {
    marginTop: 8,
    backgroundColor: '#eef6ff',
    padding: 10,
    borderRadius: 8,
  },
  ratesTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  ratesText: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#0077cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default CreateListingScreen;
