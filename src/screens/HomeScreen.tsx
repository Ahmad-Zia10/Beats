// import React from "react";
// import { View, Text, StyleSheet } from "react-native";
// import { COLORS, FONTS} from "../themes";

// export const HomeScreen = () => {
//     return (
//         <View style={styles.container}>
//             <Text style={styles.text}>HomeScreen</Text>
//         </View>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         flex : 1,
//         backgroundColor: COLORS.background,
//         paddingTop: 50,
//         paddingHorizontal: 20,
//     },
//     text: {
//         color: COLORS.textPrimary,
//         fontSize: 24,
//         fontWeight: FONTS.bold,
//     }
// })

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { searchSongs } from '../services/api';
import { COLORS, FONTS, SPACING } from '../themes';

export const HomeScreen = () => {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();

  const testPlay = async () => {
    try {
      const result = await searchSongs('arijit singh', 1, 1);
      const song = result?.results?.[0];
      if (song) {
        playSong(song, [song]);
        Alert.alert('Playing', song.name);
      } else {
        Alert.alert('Error', 'No songs returned');
      }
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phase 2 Test</Text>

      <TouchableOpacity style={styles.btn} onPress={testPlay}>
        <Text style={styles.btnText}>▶ Tap to fetch + play a song</Text>
      </TouchableOpacity>

      {currentSong && (
        <>
          <Text style={styles.songName}>{currentSong.name}</Text>
          <TouchableOpacity style={styles.btn} onPress={togglePlay}>
            <Text style={styles.btnText}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    padding: SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 30,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: FONTS.semiBold,
  },
  songName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});