import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// شاشة محادثة بين مستخدمين (لاحقاً)
export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text>المحادثة بين المستخدمين</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
