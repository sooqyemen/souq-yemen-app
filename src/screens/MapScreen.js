// src/screens/MapScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";

// إحداثيات تقريبية لمدن اليمن + جدة (لقطاعات أبحر مثلاً)
const CITY_COORDS = {
  صنعاء: { lat: 15.3694, lon: 44.1910 },
  عدن: { lat: 12.7855, lon: 45.0187 },
  تعز: { lat: 13.5795, lon: 44.0209 },
  الحديدة: { lat: 14.7978, lon: 42.9530 },
  مأرب: { lat: 15.4629, lon: 45.3253 },
  حضرموت: { lat: 14.5408, lon: 49.1250 },
  "جدة / أبحر": { lat: 21.7480, lon: 39.0900 },
  أخرى: { lat: 15.5, lon: 44.0 },
};

const ALL_LABEL = "الكل";

export default function MapScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(ALL_LABEL);

  // 🟦 تحميل الإعلانات من Firestore
  useEffect(() => {
    const q = query(
      collection(db, "listings"),
      // لو حابب تخفي الإعلانات غير النشطة
      // where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setListings(items);
        setLoading(false);
      },
      (error) => {
        console.error("map listings error", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // عدد الإعلانات في كل مدينة
  const cityCounts = useMemo(() => {
    const counts = {};
    for (const ad of listings) {
      const city = ad.city || "غير محدد";
      counts[city] = (counts[city] || 0) + 1;
    }
    return counts;
  }, [listings]);

  const cities = useMemo(() => {
    const keys = Object.keys(cityCounts);
    // نحافظ على ترتيب ثابت تقريباً
    const ordered = [
      "صنعاء",
      "عدن",
      "تعز",
      "الحديدة",
      "مأرب",
      "حضرموت",
      "جدة / أبحر",
      "أخرى",
    ].filter((c) => keys.includes(c));
    const rest = keys.filter((c) => !ordered.includes(c));
    return [ALL_LABEL, ...ordered, ...rest];
  }, [cityCounts]);

  const filteredListings =
    selectedCity === ALL_LABEL
      ? listings
      : listings.filter((ad) => ad.city === selectedCity);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ marginTop: 8 }}>جاري تحميل الإعلانات على الخريطة...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // 🖥 فرع الويب: خريطة OpenStreetMap داخل iframe + قائمة الإعلانات
  // ---------------------------------------------------------------------------
  if (Platform.OS === "web") {
    const coords =
      selectedCity !== ALL_LABEL ? CITY_COORDS[selectedCity] : null;

    let mapUrl = null;
    if (coords) {
      const { lat, lon } = coords;
      const delta = 0.4;
      const left = lon - delta;
      const right = lon + delta;
      const top = lat + delta;
      const bottom = lat - delta;

      mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${lat},${lon}`;
    }

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>خريطة الإعلانات حسب المدن</Text>
        <Text style={styles.subtitle}>
          اختر مدينة لمشاهدة موقعها التقريبي على الخريطة وقائمة الإعلانات فيها.
        </Text>

        {/* أزرار اختيار المدينة */}
        <View style={styles.chipContainer}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.chip,
                selectedCity === city && styles.chipActive,
              ]}
              onPress={() => setSelectedCity(city)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCity === city && styles.chipTextActive,
                ]}
              >
                {city === ALL_LABEL ? "كل المدن" : city}{" "}
                {city !== ALL_LABEL && cityCounts[city]
                  ? `(${cityCounts[city]})`
                  : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* خريطة الويب */}
        {mapUrl && (
          <View style={styles.mapWrapper}>
            {/* مسموح نستخدم iframe على الويب فقط */}
            <iframe
              title="ads-map"
              src={mapUrl}
              style={{
                border: 0,
                width: "100%",
                height: 380,
                borderRadius: 8,
              }}
              loading="lazy"
            />
            <Text style={styles.mapNote}>
              ملاحظة: الخريطة تقريبية، يتم وضع العلامة في مركز المدينة فقط. لاحقاً
              يمكن إضافة تحديد موقع دقيق لكل إعلان.
            </Text>
          </View>
        )}

        {/* قائمة الإعلانات */}
        <View style={{ marginTop: 16 }}>
          <Text style={styles.listHeader}>
            {selectedCity === ALL_LABEL
              ? `جميع الإعلانات (${filteredListings.length})`
              : `إعلانات مدينة ${selectedCity} (${filteredListings.length})`}
          </Text>

          {filteredListings.length === 0 ? (
            <Text style={{ marginTop: 8 }}>لا توجد إعلانات في هذه المدينة حالياً.</Text>
          ) : (
            filteredListings.map((ad) => (
              <View key={ad.id} style={styles.card}>
                <Text style={styles.cardTitle}>{ad.title || "إعلان بدون عنوان"}</Text>
                <Text style={styles.cardCity}>
                  {ad.city || "مدينة غير محددة"} • {ad.category || "قسم غير محدد"}
                </Text>
                {typeof ad.price === "number" && ad.price > 0 && (
                  <Text style={styles.cardPrice}>
                    {ad.price} {ad.currency || ""}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ---------------------------------------------------------------------------
  // 📱 فرع الجوال (Android / iOS): نستخدم react-native-maps
  // ملاحظة: لما تنتقل للنسخة الحقيقية على الجوال، ثبّت الحزمة:
  //   npx expo install react-native-maps
  // ---------------------------------------------------------------------------
  let MapView, Marker, Callout;
  try {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Callout = RNMaps.Callout;
  } catch (e) {
    MapView = null;
  }

  // لو ما ركّبنا react-native-maps لسه
  if (!MapView) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: "center", paddingHorizontal: 16 }}>
          لعرض الخريطة داخل تطبيق الجوال، تحتاج إلى تثبيت مكتبة{" "}
          <Text style={{ fontWeight: "bold" }}>react-native-maps</Text>{" "}
          في مشروع Expo، ثم تشغيل التطبيق على Android / iOS.
        </Text>
      </View>
    );
  }

  // نحدد مركز افتراضي للخريطة حسب أول إعلان عنده مدينة معروفة
  const firstWithCoords = filteredListings.find(
    (ad) => ad.city && CITY_COORDS[ad.city]
  );
  const defaultCoords =
    (firstWithCoords && CITY_COORDS[firstWithCoords.city]) ||
    CITY_COORDS["صنعاء"];

  const region = {
    latitude: defaultCoords.lat,
    longitude: defaultCoords.lon,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} initialRegion={region}>
        {filteredListings.map((ad) => {
          const coords = ad.city && CITY_COORDS[ad.city];
          if (!coords) return null;

          return (
            <Marker
              key={ad.id}
              coordinate={{
                latitude: coords.lat,
                longitude: coords.lon,
              }}
              title={ad.title || "إعلان"}
              description={ad.city}
            >
              <Callout>
                <View style={{ maxWidth: 200 }}>
                  <Text style={{ fontWeight: "700", marginBottom: 4 }}>
                    {ad.title || "إعلان"}
                  </Text>
                  <Text>{ad.city || "مدينة غير محددة"}</Text>
                  {typeof ad.price === "number" && ad.price > 0 && (
                    <Text style={{ marginTop: 4 }}>
                      السعر: {ad.price} {ad.currency || ""}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#555",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
  },
  chipText: {
    fontSize: 12,
  },
  chipTextActive: {
    color: "#fff",
  },
  mapWrapper: {
    marginTop: 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  mapNote: {
    fontSize: 11,
    color: "#555",
    marginTop: 4,
  },
  listHeader: {
    fontSize: 15,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  cardCity: {
    fontSize: 12,
    color: "#666",
  },
  cardPrice: {
    fontSize: 13,
    color: "#1976d2",
    marginTop: 4,
  },
});
