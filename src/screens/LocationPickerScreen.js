// src/screens/LocationPickerScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function LocationPickerScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const {
    initialLat,
    initialLng,
    initialLabel,
    onLocationPicked,
  } = route.params || {};

  const [label, setLabel] = useState(initialLabel || "");
  const [selectedCoord, setSelectedCoord] = useState(
    typeof initialLat === "number" && typeof initialLng === "number"
      ? { latitude: initialLat, longitude: initialLng }
      : null
  );

  const DEFAULT_REGION = {
    latitude:
      typeof initialLat === "number" ? initialLat : 15.5, // تقريباً وسط اليمن
    longitude:
      typeof initialLng === "number" ? initialLng : 45.0,
    latitudeDelta: 6,
    longitudeDelta: 6,
  };

  const handleMapPress = (event) => {
    const coord = event.nativeEvent.coordinate;
    setSelectedCoord(coord);
  };

  const handleSave = () => {
    if (!selectedCoord) {
      Alert.alert(
        "تنبيه",
        "الرجاء اختيار موقع على الخريطة أولاً (بالضغط على الخريطة)."
      );
      return;
    }

    const data = {
      lat: selectedCoord.latitude,
      lng: selectedCoord.longitude,
      locationLabel: label.trim(),
    };

    if (onLocationPicked && typeof onLocationPicked === "function") {
      onLocationPicked(data);
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>اختيار موقع العقار على الخريطة</Text>

      {/* وصف نصّي للموقع */}
      <Text style={styles.label}>وصف الموقع (مثال: تعز – الحوبان – قرب جولة القصر)</Text>
      <TextInput
        style={styles.input}
        placeholder="اكتب وصفاً واضحاً للموقع..."
        value={label}
        onChangeText={setLabel}
      />

      {/* خريطة */}
      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <View style={styles.mapPlaceholder}>
            <Text style={{ textAlign: "center", color: "#555" }}>
              عرض الخريطة التفاعلية يكون أفضل من خلال تطبيق الجوال.\n
              حالياً يمكنك كتابة وصف الموقع في الأعلى، وعند تشغيل التطبيق على الجوال
              ستتمكن من اختيار الموقع مباشرة من الخريطة.
            </Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={DEFAULT_REGION}
            onPress={handleMapPress}
          >
            {selectedCoord && (
              <Marker coordinate={selectedCoord} />
            )}
          </MapView>
        )}
      </View>

      {selectedCoord && (
        <Text style={styles.coordsText}>
          الإحداثيات:{" "}
          {selectedCoord.latitude.toFixed(5)},{" "}
          {selectedCoord.longitude.toFixed(5)}
        </Text>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>حفظ هذا الموقع</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cancelButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>إلغاء والعودة</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ccc",
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  coordsText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "#bbb",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
});
