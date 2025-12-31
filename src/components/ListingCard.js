import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PriceWithCurrencies from './PriceWithCurrencies';
import AuctionBadge from './AuctionBadge';

export default function ListingCard({ listing, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        {listing.isAuction && <AuctionBadge />}
      </View>
      <Text style={styles.city}>{listing.city} • {listing.category}</Text>
      <PriceWithCurrencies
        price={listing.price}
        currency={listing.currency}
        rates={listing.rates}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    elevation: 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1
  },
  city: {
    marginTop: 4,
    color: '#555'
  }
});
