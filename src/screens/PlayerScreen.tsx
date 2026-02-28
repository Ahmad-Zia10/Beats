// src/screens/PlayerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import {
  getBestImageUrl, getSongArtists,
  getSongDuration, getSongSuggestions,
} from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONTS } from '../themes';

const { width } = Dimensions.get('window');
const ART_SIZE = width - SPACING.xl * 2;

const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export const PlayerScreen: React.FC = () => {
  const navigation = useNavigation();
  const seekFn = usePlayerStore((s) => s.seekFn);
  const {
    currentSong, isPlaying, position, duration,
    repeatMode, isShuffled, togglePlay, playNext,
    playPrev, setRepeatMode, toggleShuffle, addToQueue,setPosition
  } = usePlayerStore();

  // Local seeking state
  // While the user is dragging the slider, freeze the displayed position
  // Only update the real position when they release
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  // Auto-load suggestions into queue when song changes
  useEffect(() => {
    if (currentSong?.id) {
      getSongSuggestions(currentSong.id)
        .then((songs) => songs.slice(0, 5).forEach((s) => addToQueue(s)))
        .catch(() => { });
    }
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const totalDur = duration || getSongDuration(currentSong);
  const currentPos = isSeeking ? seekVal : position;

  const cycleRepeat = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          <Text style={styles.headerAlbum} numberOfLines={1}>
            {currentSong.album?.name || 'Unknown Album'}
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* Album art */}
      <View style={styles.artContainer}>
        <Image
          source={{ uri: getBestImageUrl(currentSong, '500x500') }}
          style={styles.artImage}
        />
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.songName} numberOfLines={1}>
          {currentSong.name}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {getSongArtists(currentSong)}
        </Text>
      </View>

      {/* Seek bar */}
      <View style={styles.seekContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={totalDur || 1}
          value={currentPos}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor="#E8E8E8"
          thumbTintColor={COLORS.primary}
          onSlidingStart={(v) => {
            setIsSeeking(true);
            setSeekVal(v);
          }}
          onValueChange={(v) => setSeekVal(v)}
          onSlidingComplete={(v) => {
            seekFn?.(v);
            setTimeout(() => setIsSeeking(false), 300);
          }}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{fmt(currentPos)}</Text>
          <Text style={styles.time}>{fmt(totalDur)}</Text>
        </View>
      </View>

      {/* Main controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleShuffle} style={styles.secondaryBtn}>
          <Text
            style={[
              styles.secondaryIcon,
              isShuffled && { color: COLORS.primary },
            ]}
          >
            ⇄
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          if (position > 3) {
            seekFn?.(0);
            setPosition(0);
          } else {
            playPrev();
          }
        }} 
        style={styles.controlBtn}>
          <Text style={styles.controlIcon}>{'<<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <Text style={styles.playIcon}>{isPlaying ? '▐▐' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext} style={styles.controlBtn}>
          <Text style={styles.controlIcon}>{'>>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={cycleRepeat} style={styles.secondaryBtn}>
          <Text
            style={[
              styles.secondaryIcon,
              repeatMode !== 'none' && { color: COLORS.primary },
            ]}
          >
            ↻
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerBtn: { width: 40, padding: 8 },
  backArrow: { fontSize: 24, color: COLORS.textPrimary },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  headerAlbum: {
    fontSize: 13,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  artContainer: {
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.lg,
  },
  artImage: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  songInfo: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: 6,
  },
  songName: {
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  songArtist: { fontSize: 15, color: COLORS.textSecondary },
  seekContainer: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  slider: { width: '100%', height: 40 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  time: { fontSize: 12, color: COLORS.textSecondary },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  secondaryBtn: { padding: 8 },
  secondaryIcon: { fontSize: 22, color: COLORS.textMuted },
  controlBtn: { padding: 8 },
  controlIcon: { fontSize: 32, color: COLORS.textPrimary },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playIcon: { fontSize: 22, color: COLORS.white, textAlign: 'center' },
});