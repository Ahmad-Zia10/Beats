// src/screens/QueueScreen.tsx
import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/playerStore';
import { getBestImageUrl, getSongArtists, getSongDuration } from '../services/api';
import { Song } from '../types';
import { COLORS, SPACING, RADIUS, FONTS } from '../themes';

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const QueueScreen = () => {
  const {
    queue, currentSong, currentIndex,
    jumpToIndex, removeFromQueue, clearQueue,
  } = usePlayerStore();

  if (queue.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Queue</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyTitle}>Queue is empty</Text>
          <Text style={styles.emptySub}>
            Tap the menu on any song and choose "Add to Queue"
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: { item: Song; index: number }) => {
    const isActive = currentSong?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.row, isActive && styles.rowActive]}
        onPress={() => jumpToIndex(index)}
        activeOpacity={0.7}
      >
        {/* Drag handle — visual only for now */}
        <Text style={styles.dragHandle}>☰</Text>
        <Image
          source={{ uri: getBestImageUrl(item, '150x150') }}
          style={styles.thumb}
        />
        <View style={styles.info}>
          <Text
            style={[styles.name, isActive && { color: COLORS.primary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {getSongArtists(item)}  ·  {fmt(getSongDuration(item))}
          </Text>
        </View>
        {isActive && (
          <Text style={styles.nowPlayingDot}>▶</Text>
        )}
        <TouchableOpacity
          onPress={() => removeFromQueue(index)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.removeBtn}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Queue</Text>
        <TouchableOpacity onPress={clearQueue}>
          <Text style={styles.clearBtn}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>
        {queue.length} songs  ·  Playing #{(currentIndex + 1)}
      </Text>
      <FlatList
        data={queue}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: FONTS.semiBold,
    color: COLORS.primary,
  },
  subHeader: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    gap: SPACING.md,
  },
  rowActive: { backgroundColor: COLORS.primaryLight },
  dragHandle: {
    fontSize: 16,
    color: COLORS.textMuted,
    width: 20,
    textAlign: 'center',
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontSize: 14,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  nowPlayingDot: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: FONTS.bold,
  },
  removeBtn: { padding: 4 },
  removeIcon: { fontSize: 14, color: COLORS.textMuted },
  separator: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginHorizontal: SPACING.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});