// src/store/playerStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, RepeatMode } from '../types';

// ── Shape of the entire store ─────────────────────────────────────────────────
interface PlayerStore {
  // Playback state
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;      // current playback position in seconds
  duration: number;      // total song duration in seconds

  // Modes
  repeatMode: RepeatMode;
  isShuffled: boolean;
  shuffledQueue: Song[];

  // Downloads
  downloadedSongs: Song[];
  downloadingIds: string[];

  // ── Actions ──────────────────────────────────────────────────────────────
  playSong: (song: Song, queue?: Song[]) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  jumpToIndex: (index: number) => void;
  addDownload: (song: Song) => void;
  removeDownload: (id: string) => void;
  addDownloadingId: (id: string) => void;
  removeDownloadingId: (id: string) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────────────────────
      currentSong: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      position: 0,
      duration: 0,
      repeatMode: 'none',
      isShuffled: false,
      shuffledQueue: [],
      downloadedSongs: [],
      downloadingIds: [],

      // ── Play a song ─────────────────────────────────────────────────────
      // Optionally pass a queue — the list of songs this song belongs to
      // so the user can skip forward/back through the list
      playSong: (song, queue) => {
        const newQueue = queue || [song];
        const idx = newQueue.findIndex((s) => s.id === song.id);
        set({
          currentSong: song,
          queue: newQueue,
          currentIndex: idx >= 0 ? idx : 0,
          isPlaying: true,
          position: 0,
        });
      },

      // ── Skip to next song ───────────────────────────────────────────────
      playNext: () => {
        const {
          queue,
          currentIndex,
          repeatMode,
          isShuffled,
          shuffledQueue,
        } = get();

        // use shuffled order if shuffle is on
        const activeQueue =
          isShuffled && shuffledQueue.length > 0 ? shuffledQueue : queue;

        if (activeQueue.length === 0) return;

        // repeat one — restart the same song
        if (repeatMode === 'one') {
          set({ position: 0, isPlaying: true });
          return;
        }

        let nextIndex = currentIndex + 1;

        // past the end of queue
        if (nextIndex >= activeQueue.length) {
          if (repeatMode === 'all') {
            nextIndex = 0; // loop back to start
          } else {
            set({ isPlaying: false }); // stop playing
            return;
          }
        }

        set({
          currentSong: activeQueue[nextIndex],
          currentIndex: nextIndex,
          position: 0,
          isPlaying: true,
        });
      },

      // ── Skip to previous song ───────────────────────────────────────────
      playPrev: () => {
        const { queue, currentIndex, position, isShuffled, shuffledQueue } =
          get();
        const activeQueue =
          isShuffled && shuffledQueue.length > 0 ? shuffledQueue : queue;

        if (activeQueue.length === 0) return;

        // if more than 3 seconds in — restart current song
        // if less than 3 seconds in — go to previous song
        // this matches Spotify's behaviour
        if (position > 3) {
          set({ position: 0 });
          return;
        }

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = activeQueue.length - 1;

        set({
          currentSong: activeQueue[prevIndex],
          currentIndex: prevIndex,
          position: 0,
          isPlaying: true,
        });
      },

      // ── Toggle play/pause ───────────────────────────────────────────────
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

      // ── Setters called by the audio hook ────────────────────────────────
      setPosition: (position) => set({ position }),
      setDuration: (duration) => set({ duration }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),

      // ── Repeat mode ─────────────────────────────────────────────────────
      setRepeatMode: (repeatMode) => set({ repeatMode }),

      // ── Shuffle ─────────────────────────────────────────────────────────
      toggleShuffle: () => {
        const { isShuffled, queue, currentIndex } = get();

        if (!isShuffled) {
          // Fisher-Yates shuffle — guaranteed uniform distribution
          const indices = Array.from({ length: queue.length }, (_, i) => i);
          indices.splice(currentIndex, 1); // remove current song's index

          // shuffle the remaining indices
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }

          // put current song first so it keeps playing
          indices.unshift(currentIndex);
          const shuffledQueue = indices.map((i) => queue[i]);

          set({ isShuffled: true, shuffledQueue, currentIndex: 0 });
        } else {
          // turn shuffle off — go back to original order
          set({ isShuffled: false, shuffledQueue: [] });
        }
      },

      // ── Queue management ─────────────────────────────────────────────────
      addToQueue: (song) =>
        set((s) => {
          // don't add duplicates
          if (s.queue.find((q) => q.id === song.id)) return s;
          return { queue: [...s.queue, song] };
        }),

      removeFromQueue: (index) =>
        set((s) => {
          const newQueue = s.queue.filter((_, i) => i !== index);
          let newIndex = s.currentIndex;
          if (index < s.currentIndex) newIndex = s.currentIndex - 1;
          if (index === s.currentIndex) {
            newIndex = Math.min(s.currentIndex, newQueue.length - 1);
          }
          return {
            queue: newQueue,
            currentIndex: newIndex,
            currentSong: newQueue[newIndex] || null,
          };
        }),

      clearQueue: () =>
        set({ queue: [], currentIndex: -1, currentSong: null, isPlaying: false }),

      jumpToIndex: (index) => {
        const { queue, isShuffled, shuffledQueue } = get();
        const activeQueue =
          isShuffled && shuffledQueue.length > 0 ? shuffledQueue : queue;
        if (index < 0 || index >= activeQueue.length) return;
        set({
          currentSong: activeQueue[index],
          currentIndex: index,
          position: 0,
          isPlaying: true,
        });
      },

      // ── Downloads ────────────────────────────────────────────────────────
      addDownload: (song) =>
        set((s) => ({
          downloadedSongs: s.downloadedSongs.find((d) => d.id === song.id)
            ? s.downloadedSongs
            : [...s.downloadedSongs, song],
        })),

      removeDownload: (id) =>
        set((s) => ({
          downloadedSongs: s.downloadedSongs.filter((d) => d.id !== id),
        })),

      addDownloadingId: (id) =>
        set((s) => ({ downloadingIds: [...s.downloadingIds, id] })),

      removeDownloadingId: (id) =>
        set((s) => ({
          downloadingIds: s.downloadingIds.filter((d) => d !== id),
        })),
    }),

    // ── Persist config ──────────────────────────────────────────────────────
    {
      name: 'player-storage',
      storage: createJSONStorage(() => AsyncStorage),

      // Only persist these fields — don't persist isPlaying or position
      // because resuming mid-song automatically on app restart feels wrong
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentSong: state.currentSong,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
        downloadedSongs: state.downloadedSongs,
      }),
    }
  )
);