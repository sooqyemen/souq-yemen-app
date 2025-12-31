import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Linking } from 'react-native';

const ListingDetailsScreen = ({ route, navigation }) => {
  const { listing: initialListing, listingId } = route.params || {};
  const [listing, setListing] = useState(initialListing || null);
  const [loading, setLoading] = useState(!initialListing);
  const [rates, setRates] = useState(null);

  // جلب بيانات الإعلان من Firestore لو ما وصلت كاملة من الصفحة السابقة
  useEffect(() => {
    const fetchListing = async () => {
      if (initialListing || !listingId) return;

      try {
        setLoading(true);
        const ref = doc(db, 'listings', listingId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setListing({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [initialListing, listingId]);

  // جلب أسعار الصرف من settings/rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const ref = doc(db, 'settings', 'rates');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRates(snap.data());
        }
      } catch (err) {
        console.error('Error fetching rates:', err);
      }
    };

    fetchRates();
  }, []);

  const priceInfo = useMemo(() => {
    if (!listing || listing.price == null || !rates) return null;

    const price = Number(listing.price) || 0;
    const { usdToYer = 1632, sarToYer = 425 } = rates;

    // تحويل إلى ريال يمني أولاً
    let priceYer = 0;

    if (listing.currency === 'SAR') {
      priceYer = price * sarToYer;
    } else if (listing.currency === 'USD') {
      priceYer = price * usdToYer;
    } else {
      // YER
      priceYer = price;
    }

    const priceSar = Math.round(priceYer / sarToYer);
    const priceUsd = Math.round(priceYer / usdToYer);

    return {
      baseCurrency: listing.currency || 'YER',
      basePrice: price,
      yer: priceYer,
      sar: priceSar,
      usd: priceUsd,
    };
  }, [listing, rates]);

  if (loading || !listing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>جاري تحميل تفاصيل الإعلان...</Text>
      </View>
    );
  }

  const mainImage =
    listing.images && Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images[0]
      : null;

  const statusText = listing.status === 'inactive' ? 'مخفي' : 'نشط';

  const openPhone = () => {
    if (!listing.phone) return;
    Linking.openURL(`tel:${listing.phone}`);
  };

  const openWhatsApp = () => {
    if (!listing.whatsApp && !listing.phone) return;
    const number = String(listing.whatsApp || listing.phone).replace(
      /[^\d]/g,
      ''
    );
    const msg = encodeURIComponent('السلام عليكم، بخصوص إعلانك في سوق اليمن');
    const url = `https://wa.me/${number}?text=${msg}`;
    Linking.openURL(url);
  };

  const openMap = () => {
    if (!listing.mapUrl) return;
    Linking.openURL(listing.mapUrl);
  };

  const shareListing = () => {
    try {
      // في الويب نستغل window.location لو متوفر
      if (typeof window !== 'undefined' && window.location) {
        const url = window.location.href;
        const text = `إعلان في سوق اليمن: ${listing.title}\n\n${url}`;

        if (navigator.share) {
          navigator.share({ title: listing.title, text, url });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          alert('تم نسخ رابط الإعلان، يمكنك لصقه وإرساله.');
        } else {
          alert('انسخ رابط الصفحة من شريط العنوان لمشاركته.');
        }
      } else {
        alert('يمكنك مشاركة هذا الإعلان بنسخ رابط الصفحة من المتصفح.');
      }
    } catch (err) {
      console.error('share error', err);
      alert('تعذر مشاركة الإعلان حالياً.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* الصورة الرئيسية */}
      {mainImage ? (
        <Image
          source={{ uri: mainImage }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.mainImage, styles.mainImagePlaceholder]}>
          <Text style={styles.mainImagePlaceholderText}>بدون صورة</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* العنوان */}
        <Text style={styles.title}>{listing.title}</Text>

        <Text style={styles.subTitle}>
          {listing.city || 'غير محدد'} • {listing.category || 'قسم غير محدد'}
        </Text>

        {/* السعر */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>السعر</Text>
          {priceInfo ? (
            <>
              <Text style={styles.priceLine}>
                العملة الأساسية ({priceInfo.baseCurrency}):{' '}
                {priceInfo.basePrice}
              </Text>
              <Text style={styles.priceLine}>
                {Math.round(priceInfo.yer)} ريال يمني
              </Text>
              <Text style={styles.priceLine}>
                {priceInfo.sar} ريال سعودي
              </Text>
              <Text style={styles.priceLine}>${priceInfo.usd} دولار</Text>
            </>
          ) : (
            <Text style={styles.priceLine}>لا توجد معلومات سعر كافية.</Text>
          )}
        </View>

        {/* الوصف */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الوصف</Text>
          <Text style={styles.sectionBody}>
            {listing.description || 'لا يوجد وصف لهذا الإعلان.'}
          </Text>
        </View>

        {/* التواصل */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التواصل</Text>

          {listing.phone ? (
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>رقم الجوال:</Text>
              <Text style={styles.contactValue}>{listing.phone}</Text>
            </View>
          ) : (
            <Text style={styles.sectionBody}>لم يتم إضافة رقم جوال.</Text>
          )}

          {/* أزرار الاتصال وواتساب */}
          <View style={styles.contactActions}>
            {listing.phone ? (
              <TouchableOpacity style={styles.callButton} onPress={openPhone}>
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.callButtonText}>اتصال</Text>
              </TouchableOpacity>
            ) : null}

            {(listing.whatsApp || listing.phone) && (
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={openWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.callButtonText}>واتساب</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* زر عرض على الخريطة */}
        {listing.mapUrl ? (
          <View style={styles.section}>
            <TouchableOpacity style={styles.mapButton} onPress={openMap}>
              <Ionicons name="location-outline" size={18} color="#fff" />
              <Text style={styles.mapButtonText}>عرض الموقع على الخريطة</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* حالة الإعلان */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حالة الإعلان</Text>
          <Text style={styles.sectionBody}>{statusText}</Text>
        </View>

        {/* مشاركة الإعلان */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.shareButton} onPress={shareListing}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={styles.shareButtonText}>مشاركة الإعلان</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  mainImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#ddd',
  },
  mainImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImagePlaceholderText: {
    color: '#666',
  },
  content: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: -10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  priceLine: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contactLabel: {
    fontWeight: '600',
    color: '#555',
  },
  contactValue: {
    color: '#222',
  },
  contactActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  callButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#555',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  mapButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  shareButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default ListingDetailsScreen;
