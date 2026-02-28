// src/components/MiniPlayer.tsx
import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayerStore } from '../store/playerStore';
import { getBestImageUrl, getSongArtists } from '../services/api';
import { COLORS, SPACING, RADIUS, FONTS } from '../themes';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { currentSong, isPlaying, togglePlay, playNext } = usePlayerStore();

  // Don't render anything if no song is loaded
  if (!currentSong) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.97}
    >
      <Image
        source={{ uri: getBestImageUrl(currentSong, '150x150') }}
        style={styles.thumb}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {currentSong.name}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {getSongArtists(currentSong)}
        </Text>
      </View>
      {/* Stop propagation so these buttons don't also open the Player */}
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation(); togglePlay(); }}
        style={styles.ctrlBtn}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      >
        <Text style={styles.ctrlIcon}>{isPlaying ? 'II' : '▶'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation(); playNext(); }}
        style={styles.ctrlBtn}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      >
        <Text style={styles.ctrlIcon}>⏭</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
    gap: SPACING.md,
    minHeight: 64,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontSize: 14,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  artist: { fontSize: 12, color: COLORS.textSecondary },
  ctrlBtn: { padding: 6 },
  ctrlIcon: { fontSize: 22, color: COLORS.primary },
});