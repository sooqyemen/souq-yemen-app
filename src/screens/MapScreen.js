import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ملاحظة: يمكن لاحقاً تركيب مكتبة الخرائط مثل react-native-maps مع OpenStreetMap
export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text>هنا ستكون الخريطة (OpenStreetMap / MapLibre)</Text>
      <Text>سنربطها لاحقاً بالإعلانات وعرض الأقرب للمستخدم.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
