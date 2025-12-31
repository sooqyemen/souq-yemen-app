import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { convertPrice } from '../utils/currency';

export default function PriceWithCurrencies({ price, currency, rates }) {
  const converted = useMemo(
    () => convertPrice(price, currency, rates),
    [price, currency, rates]
  );

  if (!converted) {
    return <Text style={styles.main}>السعر: {price} {currency}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.main}>
        {converted.base.value.toLocaleString()} {converted.base.code}
      </Text>
      <Text style={styles.sub}>
        {converted.yer.value.toLocaleString()} {converted.yer.code} • {converted.sar.value.toLocaleString()} {converted.sar.code} • {converted.usd.value.toLocaleString()} {converted.usd.code}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 6 },
  main: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 }
});
