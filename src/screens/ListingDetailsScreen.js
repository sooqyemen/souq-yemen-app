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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const ADMIN_EMAIL = "mansouralbarout@gmail.com";

function formatPrice(price, currency) {
  if (price == null) return "بدون سعر";
  const intPrice = Number(price) || 0;

  if (currency === "SAR") return `${intPrice} ريال سعودي`;
  if (currency === "USD") return `$${intPrice} دولار`;
  return `${intPrice} ريال يمني`;
}

export default function ListingDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();

  // نحاول نقرأ البيانات بأكثر من شكل احتياطاً
  const listing =
    route.params?.listing ||
    route.params?.item ||
    route.params ||
    {};

  const {
    id,
    title,
    description,
    price,
    currency,
    city,
    category,
    images = [],
    phone,
    whatsapp,
    locationLabel,
    createdAt,
    isAuction,
    auctionEndsAt,
    ownerId,
    lat,
    lng,
  } = listing;

  const isOwner = user && ownerId && user.uid === ownerId;
  const isAdmin = user && user.email === ADMIN_EMAIL;

  const handleCall = () => {
    if (!phone) {
      Alert.alert("تنبيه", "لا يوجد رقم جوال في هذا الإعلان.");
      return;
    }
    const tel = `tel:${phone}`;
    Linking.openURL(tel).catch(() =>
      Alert.alert("خطأ", "تعذر فتح تطبيق الاتصال.")
    );
  };

  const handleWhatsApp = () => {
    if (whatsapp) {
      Linking.openURL(whatsapp).catch(() =>
        Alert.alert("خطأ", "تعذر فتح واتساب بالرابط المحدد.")
      );
      return;
    }

    if (!phone) {
      Alert.alert(
        "تنبيه",
        "لا يوجد رقم جوال أو رابط واتساب لهذا الإعلان."
      );
      return;
    }

    const wa = `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
    Linking.openURL(wa).catch(() =>
      Alert.alert("خطأ", "تعذر فتح واتساب.")
    );
  };

  const handleOpenMap = () => {
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("خطأ", "تعذر فتح الخريطة.")
      );
      return;
    }

    if (city || locationLabel) {
      const query = encodeURIComponent(
        `${locationLabel || ""} ${city || ""}`.trim()
      );
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("خطأ", "تعذر فتح الخريطة.")
      );
      return;
    }

    Alert.alert(
      "تنبيه",
      "لا توجد معلومات كافية عن موقع هذا الإعلان."
    );
  };

  const handleDelete = async () => {
    if (!id) {
      Alert.alert("خطأ", "لا يمكن تحديد هذا الإعلان للحذف.");
      return;
    }

    if (!isOwner && !isAdmin) {
      Alert.alert(
        "صلاحيات",
        "فقط صاحب الإعلان أو المدير يمكنه حذف الإعلان."
      );
      return;
    }

    Alert.alert(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "listings", id));
              Alert.alert("تم", "تم حذف الإعلان بنجاح.");
              navigation.goBack();
            } catch (error) {
              console.error("delete listing error", error);
              Alert.alert("خطأ", "حدث خطأ أثناء حذف الإعلان.");
            }
          },
        },
      ]
    );
  };

  const createdDateText = (() => {
    if (!createdAt) return "";
    try {
      const date =
        typeof createdAt.toDate === "function"
          ? createdAt.toDate()
          : new Date(createdAt);
      return date.toLocaleString("ar-EG");
    } catch {
      return "";
    }
  })();

  const auctionText = (() => {
    if (!isAuction) return "هذا الإعلان بدون مزاد.";
    if (!auctionEndsAt) return "المزاد مفعّل (وقت الانتهاء غير محدد).";
    try {
      const end = new Date(auctionEndsAt);
      return `المزاد ينتهي في: ${end.toLocaleString("ar-EG")}`;
    } catch {
      return "المزاد مفعّل.";
    }
  })();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* الصور */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesRow}
        >
          {images.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.image}
            />
          ))}
        </ScrollView>
      )}

      {/* العنوان + السعر */}
      <Text style={styles.title}>{title || "إعلان بدون عنوان"}</Text>

      <Text style={styles.price}>
        {formatPrice(price, currency)}{" "}
        {currency === "YER"
          ? "(ريال يمني)"
          : currency === "SAR"
          ? "(ريال سعودي)"
          : "(دولار)"}
      </Text>

      {/* معلومات أساسية */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
        {city ? (
          <Text style={styles.rowText}>المدينة: {city}</Text>
        ) : null}
        {category ? (
          <Text style={styles.rowText}>القسم: {category}</Text>
        ) : null}
        {locationLabel ? (
          <Text style={styles.rowText}>
            الموقع التفصيلي: {locationLabel}
          </Text>
        ) : null}
        {createdDateText ? (
          <Text style={styles.rowText}>
            تاريخ الإضافة: {createdDateText}
          </Text>
        ) : null}
        <Text style={styles.rowText}>{auctionText}</Text>
      </View>

      {/* الوصف */}
      {description ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>الوصف</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      ) : null}

      {/* الاتصال */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>طرق التواصل</Text>

        {phone ? (
          <Text style={styles.rowText}>رقم الجوال: {phone}</Text>
        ) : (
          <Text style={styles.rowText}>رقم الجوال غير مذكور</Text>
        )}

        {whatsapp ? (
          <Text style={styles.rowText}>
            رابط واتساب مخصص مضاف للإعلان
          </Text>
        ) : (
          <Text style={styles.rowText}>
            سيتم استخدام رقم الجوال للاتصال عبر واتساب
          </Text>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Text style={styles.actionButtonText}>اتصال</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
          >
            <Text style={styles.actionButtonText}>واتساب</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={handleOpenMap}
          >
            <Text style={styles.actionButtonText}>الموقع على الخريطة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* زر الحذف لصاحب الإعلان أو المدير */}
      {(isOwner || isAdmin) && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>حذف الإعلان</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  imagesRow: {
    marginBottom: 12,
  },
  image: {
    width: 220,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#ddd",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1976d2",
    textAlign: "center",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  rowText: {
    fontSize: 13,
    marginBottom: 3,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 3,
    alignItems: "center",
  },
  callButton: {
    backgroundColor: "#1976d2",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  mapButton: {
    backgroundColor: "#455a64",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
