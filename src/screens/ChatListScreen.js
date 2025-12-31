import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// يمكن لاحقاً ربطها بمجموعات المحادثات في Firestore
export default function ChatListScreen() {
  return (
    <View style={styles.container}>
      <Text>قائمة المحادثات ستظهر هنا</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
