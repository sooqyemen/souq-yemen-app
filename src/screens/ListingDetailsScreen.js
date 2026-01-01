// src/screens/ListingDetailsScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

function openExternalLink(url) {
  if (!url) return;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        Alert.alert("تنبيه", "لا يمكن فتح هذا الرابط على جهازك.");
      } else {
        Linking.openURL(url);
      }
    })
    .catch(() => {
      Alert.alert("خطأ", "حدث خطأ أثناء محاولة فتح الرابط.");
    });
}

export default function ListingDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listing } = route.params || {};

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text>لا توجد بيانات للإعلان.</Text>
        <TouchableOpacity
          style={[styles.mainButton, { marginTop: 16 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.mainButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    title,
    description,
    price,
    currency,
    city,
    category,
    phone,
    whatsapp,
    images,
    locationLabel,
    lat,
    lng,
    isAuction,
  } = listing;

  // رقم السعر المنسّق
  const priceText =
    typeof price === "number" ? `${price.toLocaleString()} ${currency || ""}` : "";

  // رابط الاتصال
  const handleCall = () => {
    if (!phone) {
      Alert.alert("تنبيه", "رقم الجوال غير متوفر.");
      return;
    }
    const telUrl = `tel:${phone}`;
    openExternalLink(telUrl);
  };

  // رابط واتساب
  const handleWhatsApp = () => {
    if (!whatsapp && !phone) {
      Alert.alert("تنبيه", "لا يوجد رقم واتساب أو جوال للتواصل.");
      return;
    }

    let url = whatsapp;

    if (!url) {
      // نبني رابط من رقم الجوال
      const digits = (phone || "").replace(/[^\d]/g, "");
      if (!digits) {
        Alert.alert("تنبيه", "رقم الجوال غير صالح لإنشاء رابط واتساب.");
        return;
      }
      url = `https://wa.me/${digits}`;
    }

    openExternalLink(url);
  };

  // فتح الموقع في خرائط جوجل
  const handleOpenInMaps = () => {
    if (typeof lat !== "number" || typeof lng !== "number") {
      Alert.alert(
        "تنبيه",
        "لم يتم حفظ موقع هذا الإعلان على الخريطة. الرجاء استخدام زر (استخدام موقعي الحالي) عند إضافة الإعلان."
      );
      return;
    }

    const label = encodeURIComponent(locationLabel || title || "موقع الإعلان");
    let url = "";

    // نفس الرابط يعمل على الجوال والويب
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;

    openExternalLink(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* صور الإعلان */}
      {Array.isArray(images) && images.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScroller}
        >
          {images.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ color: "#777" }}>لا توجد صور لهذا الإعلان</Text>
        </View>
      )}

      {/* العنوان والسعر */}
      <View style={styles.section}>
        <Text style={styles.title}>{title || "إعلان بدون عنوان"}</Text>
        {priceText ? <Text style={styles.price}>{priceText}</Text> : null}

        <Text style={styles.meta}>
          {city ? `المدينة: ${city}` : "المدينة: غير محددة"} •{" "}
          {category ? `القسم: ${category}` : "القسم: غير محدد"}
        </Text>

        {/* حالة المزاد لو مفعّل */}
        {isAuction ? (
          <View style={styles.badgeAuction}>
            <Text style={styles.badgeAuctionText}>إعلان بنظام المزاد</Text>
          </View>
        ) : null}
      </View>

      {/* الموقع */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الموقع</Text>

        {locationLabel ? (
          <Text style={styles.locationText}>📍 {locationLabel}</Text>
        ) : (
          <Text style={styles.locationText}>
            لم يقم المعلن بتحديد وصف للموقع.
          </Text>
        )}

        {typeof lat === "number" && typeof lng === "number" ? (
          <TouchableOpacity
            style={[styles.mainButton, { marginTop: 10 }]}
            onPress={handleOpenInMaps}
          >
            <Text style={styles.mainButtonText}>
              فتح الموقع في خرائط جوجل
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.locationNote}>
            لا توجد إحداثيات محفوظة لهذا الإعلان. عند إضافة إعلان جديد يمكنك
            استخدام زر "استخدام موقعي الحالي" لحفظ الموقع بدقة.
          </Text>
        )}
      </View>

      {/* وصف الإعلان */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>تفاصيل الإعلان</Text>
        <Text style={styles.description}>
          {description && description.trim().length > 0
            ? description
            : "لم يقم المعلن بكتابة وصف تفصيلي."}
        </Text>
      </View>

      {/* طرق التواصل */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>طرق التواصل</Text>

        {phone ? (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: "#388e3c" }]}
            onPress={handleCall}
          >
            <Text style={styles.contactButtonText}>📞 اتصال على {phone}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.locationNote}>
            رقم الجوال غير متوفر في هذا الإعلان.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: "#25D366" }]}
          onPress={handleWhatsApp}
        >
          <Text style={styles.contactButtonText}>💬 تواصل عبر واتساب</Text>
        </TouchableOpacity>

        <Text style={styles.smallHint}>
          لن نعرض بريد المعلن هنا حفاظاً على خصوصيته. الاعتماد على الاتصال أو
          واتساب فقط.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  imagesScroller: {
    height: 260,
    backgroundColor: "#000",
  },
  image: {
    width: Platform.OS === "web" ? 400 : "100%",
    height: 260,
  },
  imagePlaceholder: {
    height: 220,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1976d2",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#555",
  },
  badgeAuction: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#ffeb3b",
  },
  badgeAuctionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#795548",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    color: "#333",
  },
  locationNote: {
    fontSize: 11,
    color: "#777",
    marginTop: 6,
  },
  description: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
  mainButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  mainButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  contactButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  smallHint: {
    fontSize: 11,
    color: "#777",
    marginTop: 8,
  },
});
