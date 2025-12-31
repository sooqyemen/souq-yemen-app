import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

function formatPrice(price, currency) {
  if (price == null) return 'بدون سعر';

  const intPrice = Number(price) || 0;

  if (currency === 'SAR') {
    return `${intPrice} ريال سعودي`;
  }
  if (currency === 'USD') {
    return `$${intPrice} دولار`;
  }
  // الافتراضي ريال يمني
  return `${intPrice} ريال يمني`;
}

const HomeScreen = () => {
  const navigation = useNavigation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setListings(data);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching listings:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // onSnapshot سيحدث القائمة تلقائياً
  };

  const renderItem = ({ item }) => {
    const imageUrl =
      item.images && Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]
        : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ListingDetails', { listing: item })}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.cardImagePlaceholderText}>بدون صورة</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || 'إعلان بدون عنوان'}
          </Text>

          <Text style={styles.cardSubTitle} numberOfLines={1}>
            {item.category || 'غير محدد'} • {item.city || 'كل المدن'}
          </Text>

          <Text style={styles.priceText}>
            {formatPrice(item.price, item.currency)}
          </Text>

          {item.isAuction ? (
            <View style={styles.auctionBadge}>
              <Text style={styles.auctionBadgeText}>مزاد</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

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

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  listContent: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#ddd',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    color: '#666',
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 4,
  },
  auctionBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#ff9800',
  },
  auctionBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
