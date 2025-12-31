import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AuctionBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>مزاد</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  }
});
