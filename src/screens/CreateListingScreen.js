// src/screens/CreateListingScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import * as Location from "expo-location"; // للموقع

// رفع الصور من الجوال (Expo)
let ImagePicker;
if (Platform.OS !== "web") {
  ImagePicker = require("expo-image-picker");
}

const CURRENCIES = [
  { value: "YER", label: "ريال يمني" },
  { value: "SAR", label: "ريال سعودي" },
  { value: "USD", label: "دولار" },
];

const CITIES = ["صنعاء", "عدن", "تعز", "الحديدة", "مأرب", "حضرموت", "أخرى"];

const CATEGORIES = [
  "العقارات",
  "السيارات",
  "الجوالات",
  "الطاقة الشمسية",
  "أجهزة كهربائية",
  "أخرى",
];

export default function CreateListingScreen() {
  const navigation = useNavigation();

  // بيانات أساسية
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("YER");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // الموقع
  const [locationLabel, setLocationLabel] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // المزاد
  const [isAuction, setIsAuction] = useState(false);
  const [auctionDays, setAuctionDays] = useState("1");
  const [auctionHours, setAuctionHours] = useState("0");

  // الصور
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  // حالة الحفظ (عشان ما يتكرر)
  const [saving, setSaving] = useState(false);

  const webFileInputRef = useRef(null);

  // === رفع الصور على الويب ===
  const handlePickImagesWeb = () => {
    if (webFileInputRef.current) {
      webFileInputRef.current.click();
    }
  };

  const handleWebFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      setUploading(true);

      const userId = auth.currentUser?.uid || "guest";
      const uploadedUrls = [];

      for (const file of files) {
        const storageRef = ref(
          storage,
          `listing-images/${userId}/${Date.now()}-${file.name}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      Alert.alert("تم", "تم رفع الصور بنجاح ✅");
    } catch (error) {
      console.error("upload error", error);
      Alert.alert("خطأ", "حدث خطأ أثناء رفع الصور");
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // === رفع الصور على الجوال (Expo Go) ===
  const handlePickImagesNative = async () => {
    try {
      if (!ImagePicker) {
        Alert.alert("تنبيه", "رفع الصور من الجوال سيتم تفعيله لاحقاً.");
        return;
      }

      const { status } =
        await ImagePicker.ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("صلاحيات مفقودة", "يجب السماح للتطبيق بالوصول للصور.");
        return;
      }

      const result =
        await ImagePicker.ImagePicker.launchImageLibraryAsync({
          allowsEditing: false,
          allowsMultipleSelection: true,
          quality: 0.8,
        });

      if (result.canceled) return;

      setUploading(true);
      const userId = auth.currentUser?.uid || "guest";
      const uploadedUrls = [];

      const selectedAssets = result.assets || [];
      for (const asset of selectedAssets) {
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const fileName = asset.fileName || `image-${Date.now()}.jpg`;
        const storageRef = ref(
          storage,
          `listing-images/${userId}/${Date.now()}-${fileName}`
        );
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      Alert.alert("تم", "تم رفع الصور بنجاح ✅");
    } catch (error) {
      console.error("upload error", error);
      Alert.alert("خطأ", "حدث خطأ أثناء رفع الصور");
    } finally {
      setUploading(false);
    }
  };

  const handlePickImages = () => {
    if (Platform.OS === "web") {
      handlePickImagesWeb();
    } else {
      handlePickImagesNative();
    }
  };

  // === استخدام موقعي الحالي ===
  const handleUseMyLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "صلاحيات الموقع مطلوبة",
          "الرجاء السماح للتطبيق بالوصول إلى موقعك لاستخدام هذه الميزة."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;
      setLat(latitude);
      setLng(longitude);

      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (places && places[0]) {
        const p = places[0];
        const labelParts = [
          p.name,
          p.subregion,
          p.city,
          p.region,
          p.country,
        ].filter(Boolean);
        const label = labelParts.join(" - ");
        setLocationLabel(label);

        if (!city && p.city) {
          setCity(p.city);
        }
      }

      Alert.alert("تم", "تم تحديد موقعك الحالي ✅");
    } catch (error) {
      console.error("location error", error);
      Alert.alert("خطأ", "حدث خطأ أثناء جلب موقعك");
    } finally {
      setGettingLocation(false);
    }
  };

  // === فتح شاشة اختيار الموقع من الخريطة ===
  const handleOpenLocationPicker = () => {
    navigation.navigate("LocationPicker", {
      initialLat: lat,
      initialLng: lng,
      initialLabel: locationLabel,
      onLocationPicked: (data) => {
        setLat(data.lat);
        setLng(data.lng);
        setLocationLabel(data.locationLabel || "");
      },
    });
  };

  // === حفظ الإعلان ===
  const handleSave = async () => {
    if (saving) return; // منع التكرار لو الزر مضغوط أكثر من مرّة

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("تسجيل الدخول", "يجب تسجيل الدخول قبل إضافة إعلان.");
      return;
    }

    if (!title || !price || !city || !category) {
      Alert.alert(
        "تنبيه",
        "الرجاء تعبئة الحقول الأساسية (العنوان، السعر، المدينة، القسم)."
      );
      return;
    }

    const priceNumber = Number(price) || 0;

    let auctionEndsAt = null;
    if (isAuction) {
      const now = new Date();
      const totalHours =
        (Number(auctionDays) || 0) * 24 + (Number(auctionHours) || 0);
      const end = new Date(now.getTime() + totalHours * 60 * 60 * 1000);
      auctionEndsAt = end.toISOString();
    }

    try {
      setSaving(true);

      const docRef = await addDoc(collection(db, "listings"), {
        title: title.trim(),
        description: description.trim(),
        price: priceNumber,
        currency,
        city,
        category,
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        images: imageUrls,
        isAuction,
        auctionEndsAt,
        status: "active",
        locationLabel: locationLabel.trim(),
        lat,
        lng,
      });

      console.log("listing saved with id:", docRef.id);

      // ننظف الحقول عشان لو رجع للشاشة تكون فاضية
      setTitle("");
      setDescription("");
      setPrice("");
      setCity("");
      setCategory("");
      setPhone("");
      setWhatsapp("");
      setIsAuction(false);
      setAuctionDays("1");
      setAuctionHours("0");
      setImageUrls([]);
      setLocationLabel("");
      setLat(null);
      setLng(null);

      // رسالة تأكيد + رجوع للرئيسية
      Alert.alert("تم", "تم حفظ الإعلان بنجاح ✅", [
        {
          text: "حسناً",
          onPress: () => {
            // نوديه لواجهة الرئيسية داخل التبويبات
            navigation.navigate("Home");
          },
        },
      ]);
    } catch (error) {
      console.error("save listing error", error);
      Alert.alert("خطأ", "حدث خطأ أثناء حفظ الإعلان");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>إضافة إعلان جديد</Text>

      {/* العنوان */}
      <Text style={styles.label}>عنوان الإعلان</Text>
      <TextInput
        style={styles.input}
        placeholder="مثال: شقة للإيجار في عدن..."
        value={title}
        onChangeText={setTitle}
      />

      {/* الوصف */}
      <Text style={styles.label}>الوصف</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="اكتب تفاصيل الإعلان..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* السعر + العملة */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>السعر الأساسي</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: 150000"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>العملة</Text>
          <View style={styles.chipContainer}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.chip,
                  currency === c.value && styles.chipActive,
                ]}
                onPress={() => setCurrency(c.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    currency === c.value && styles.chipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* المدينة */}
      <Text style={styles.label}>المدينة</Text>
      <View style={styles.chipContainer}>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, city === c && styles.chipActive]}
            onPress={() => setCity(c)}
          >
            <Text
              style={[
                styles.chipText,
                city === c && styles.chipTextActive,
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* القسم */}
      <Text style={styles.label}>القسم</Text>
      <View style={styles.chipContainer}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text
              style={[
                styles.chipText,
                category === c && styles.chipTextActive],
              }
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* الموقع */}
      <Text style={styles.label}>الموقع (اختياري)</Text>
      <TextInput
        style={styles.input}
        placeholder="مثال: تعز – الحوبان – قرب جولة القصر"
        value={locationLabel}
        onChangeText={setLocationLabel}
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <TouchableOpacity
            style={[
              styles.button,
              gettingLocation && { opacity: 0.6 },
            ]}
            onPress={handleUseMyLocation}
            disabled={gettingLocation}
          >
            <Text style={styles.buttonText}>
              {gettingLocation
                ? "جاري تحديد موقعك..."
                : "استخدام موقعي الحالي"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={handleOpenLocationPicker}
          >
            <Text style={styles.buttonSecondaryText}>
              اختيار موقع من الخريطة
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {lat && lng ? (
        <Text style={styles.locationCoords}>
          الإحداثيات: {lat.toFixed(5)}, {lng.toFixed(5)}
        </Text>
      ) : null}

      {/* التواصل */}
      <Text style={styles.label}>رقم الجوال</Text>
      <TextInput
        style={styles.input}
        placeholder="مثال: 770000000"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>رابط واتساب (اختياري)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://wa.me/770000000"
        value={whatsapp}
        onChangeText={setWhatsapp}
      />

      {/* المزاد */}
      <View style={styles.sectionHeader}>
        <Text style={styles.label}>تفعيل نظام المزاد؟</Text>
        <TouchableOpacity
          style={[styles.switchButton, isAuction && styles.switchOn]}
          onPress={() => setIsAuction(!isAuction)}
        >
          <Text style={styles.switchText}>
            {isAuction ? "مفعل" : "غير مفعل"}
          </Text>
        </TouchableOpacity>
      </View>

      {isAuction && (
        <View style={styles.row}>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>مدة المزاد (أيام)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={auctionDays}
              onChangeText={setAuctionDays}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ساعات إضافية</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={auctionHours}
              onChangeText={setAuctionHours}
            />
          </View>
        </View>
      )}

      {/* رفع الصور */}
      <Text style={styles.label}>الصور (حتى 10 صور)</Text>

      {Platform.OS === "web" && (
        <input
          ref={webFileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleWebFilesSelected}
        />
      )}

      <TouchableOpacity
        style={[styles.button, uploading && { opacity: 0.6 }]}
        onPress={handlePickImages}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? "جاري رفع الصور..." : "اختيار / رفع صور"}
        </Text>
      </TouchableOpacity>

      {imageUrls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
        >
          {imageUrls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.thumbnail}
            />
          ))}
        </ScrollView>
      )}

      {/* زر الحفظ */}
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "جاري حفظ الإعلان..." : "حفظ الإعلان"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
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
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  switchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  switchOn: {
    backgroundColor: "#43a047",
    borderColor: "#43a047",
  },
  switchText: {
    color: "#000",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#0288d1",
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonSecondary: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0288d1",
  },
  buttonSecondaryText: {
    color: "#0288d1",
    fontWeight: "600",
    fontSize: 13,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#eee",
  },
  saveButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 24,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  locationCoords: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
});
