import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../themes';

export const FavoritesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorites</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: FONTS.bold,
  },
});