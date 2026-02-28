// src/hooks/useAudioPlayer.ts
import { useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { usePlayerStore } from '../store/playerStore';
import { getBestAudioUrl } from '../services/api';

export const useAudioPlayer = () => {
  // Store a reference to the Sound object
  // useRef because we don't want changes to trigger re-renders
  const soundRef = useRef<Audio.Sound | null>(null);

  // Pull what we need from the store
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const playNext = usePlayerStore((s) => s.playNext);
  const isSeekingRef = useRef(false);

  // ── Unload the current sound ──────────────────────────────────────────────
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync(); 
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  // ── Load and play a new song 
  const loadAndPlay = useCallback(
    async (song: typeof currentSong) => {
      if (!song) return;

      // always unload previous song first
      await unloadSound();

      const url = getBestAudioUrl(song);
      if (!url) return;

      try {
        // ── This is what enables background playback 
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,  // keep playing when app minimised
          playsInSilentModeIOS: true,      // play even when iPhone is on silent
          shouldDuckAndroid: true,         // lower volume for notifications
          playThroughEarpieceAndroid: false,
        });

        // ── Create the Sound object and start playing
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: usePlayerStore.getState().isPlaying, progressUpdateIntervalMillis: 500 },
          // This callback fires every 500ms with playback status
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;

            // update position in store every 500ms
            if (!isSeekingRef.current) {
              setPosition(status.positionMillis / 1000);
            }

            // update duration when we know it
            if (status.durationMillis) {
              setDuration(status.durationMillis / 1000);
            }

            // song finished — play next
            if (status.didJustFinish) {
              if (repeatMode === 'one') {
                sound.replayAsync();
              } else {
                playNext();
              }
            }
          }
        );

        soundRef.current = sound;
      } catch (error) {
        console.error('Audio load error:', error);
      }
    },
    [unloadSound, setPosition, setDuration, setIsPlaying, playNext, repeatMode]
  );

  // ── When currentSong changes — load the new song 
  // Watch currentSong?.id not currentSong object
  // because object reference changes on every render
  // but id only changes when it's actually a different song
  useEffect(() => {
    if (currentSong) {
      loadAndPlay(currentSong);
    }
  }, [currentSong?.id]);

  // ── When isPlaying changes — pause or resume 
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;

    if (isPlaying) {
      sound.playAsync().catch(console.error);
    } else {
      sound.pauseAsync().catch(console.error);
    }
  }, [isPlaying]);

  // ── Seek to a specific position 
  const seek = useCallback(
    async (seconds: number) => {
      if (soundRef.current) {
        isSeekingRef.current = true;
        await soundRef.current.setPositionAsync(seconds * 1000);
        setPosition(seconds);
        isSeekingRef.current = false;
      }
    },
    [setPosition]
  );

  return { seek };
};