# 𝄞 Mume

> A full-featured music streaming app for Android, built with React Native and Expo.

&nbsp;

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/Zustand-brown?style=for-the-badge)](https://zustand-demo.pmnd.rs/)

&nbsp;

📱 **[Download APK](https://your-eas-link)**  &nbsp;·&nbsp;  🎥 **[Watch Demo](https://your-video-link)**  &nbsp;·&nbsp;  ⭐ **Star this repo if you found it useful**

---

## What is Mume?

Mume is a Spotify-inspired music player that streams songs from the JioSaavn catalog. Built as an internship assignment in 48 hours, it covers the full spectrum of a production music app — search, playback, queue management, background audio, and persistent state.

---

## Features

| Feature | Details |
|---|---|
| 🔍 Search | Debounced search with recent history, filter pills, not-found state |
| ▶️ Playback | Play, pause, seek, next, previous with accurate seek bar |
| 🎵 Mini Player | Persistent above tab bar, fully synced with full Player screen |
| 📋 Queue | Add, remove, clear — persists across app restarts |
| 🔁 Repeat | Three modes — off, repeat all, repeat one |
| 🔀 Shuffle | Fisher-Yates algorithm, current song preserved |
| 🔇 Background Audio | Continues when app is minimised or screen is off |
| 💾 Persistence | Queue, current song and preferences restored on relaunch |
| 🏠 Home | Five category tabs — Suggested, Songs, Artists, Albums, Folders |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Expo account](https://expo.dev) (free)
- EAS CLI — `npm install -g eas-cli`

### Run on your phone

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/mume-music-player.git
cd mume-music-player
npx expo install

# Start dev server
npx expo start
```

Scan the QR code with Expo Go. Note — background audio requires a development build (see below).

### Development build (background audio support)

```bash
eas login
eas build --profile development --platform android
npx expo start --dev-client
```

### Build APK for distribution

```bash
eas build --profile preview --platform android
```

---

## Tech Stack

```
React Native + Expo SDK 52    →  Cross-platform mobile framework
TypeScript                    →  Type safety across the entire codebase
React Navigation v6           →  Stack + Tab navigation
Zustand                       →  Global state with persistence middleware
expo-av                       →  Audio engine with background playback
AsyncStorage                  →  Queue and preference persistence
Axios                         →  HTTP client with timeout handling
EAS                           →  Cloud builds, no local Android SDK needed
```

---

## Architecture

### Navigation — Tab inside Stack

```
Stack.Navigator (root)
├── MainTabs              ← entire tab system is one Stack screen
│   ├── Home
│   ├── Favorites
│   ├── Playlists (Queue)
│   └── Settings
├── Player                ← slides up over all tabs
└── Search                ← slides in from right
```

Player is a Stack screen above the Tab system — not inside any individual tab. This makes it a global overlay, accessible from any tab, with music state surviving tab switches.

---

### State — Single Source of Truth

All playback state lives in one Zustand store. MiniPlayer and PlayerScreen both read from the same store — sync is structural, not manual. Position updates every 500ms from the audio callback and both components re-render simultaneously.

```
playerStore
├── currentSong, queue, currentIndex
├── isPlaying, position, duration
├── repeatMode, isShuffled, shuffledQueue
├── seekFn                 ← registered by audio hook, called by UI
└── downloadedSongs
```

Persisted fields: `queue`, `currentSong`, `currentIndex`, `repeatMode`, `isShuffled`, `downloadedSongs`.
Not persisted: `isPlaying`, `position`, `seekFn` — resuming mid-song on relaunch would feel wrong.

---

### Audio — Single Hook Instance

`useAudioPlayer` is called exactly once inside `AudioInit`, a component that lives inside `NavigationContainer` and never unmounts. This guarantees one `Audio.Sound` object and one status callback for the lifetime of the app.

The `seek` function is registered into the store on mount. `PlayerScreen` reads `seekFn` from the store instead of calling `useAudioPlayer` itself — calling the hook in two places would create two sound instances playing simultaneously.

Background audio requires both a runtime flag and `app.json` config:

```ts
// useAudioPlayer.ts
await Audio.setAudioModeAsync({ staysActiveInBackground: true });
```
```json
// app.json
"android": {
  "permissions": ["android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"]
}
```

The runtime flag alone is silently ignored by Android without the manifest permission.

---

### Seek Bar — Mutex Pattern

The audio status callback updates `position` every 500ms. Without protection, seeking causes a stutter — the callback fires mid-seek and snaps the slider back to the old position.

Fix: an `isSeekingRef` flag in `useAudioPlayer` blocks position updates while a seek is in progress.

```ts
isSeekingRef.current = true;
await sound.setPositionAsync(seconds * 1000);
setPosition(seconds);
isSeekingRef.current = false;
```

`useRef` instead of `useState` — changing it must not trigger a re-render.

---

## Trade-offs

| Decision | Why | Cost |
|---|---|---|
| `expo-av` over `react-native-track-player` | Stays in managed Expo workflow, no ejecting needed | No lock screen controls, no media notification |
| Zustand over Redux | Co-located state and actions, persist in 3 lines | Less tooling than Redux DevTools |
| JioSaavn unofficial API | Free, no auth, no setup | No SLA — can go down without notice |
| AsyncStorage over MMKV | Built into Expo managed workflow | Slower reads for large datasets |
| 500ms polling for position | Simple, reliable | Marginal battery drain vs event-driven approach |

---

## API

Base URL: `https://saavn.sumit.co`

| Endpoint | Description |
|---|---|
| `GET /api/search/songs?query=&page=&limit=` | Paginated song search |
| `GET /api/songs/:id/suggestions` | Suggested songs for a given track |

Audio URLs come in five qualities — 12kbps through 320kbps. The app always picks the highest available. The API inconsistently uses `url` vs `link` across endpoints — normalised in `src/services/api.ts`.

---

## Project Structure

```
src/
├── components/
│   └── MiniPlayer.tsx
├── hooks/
│   └── useAudioPlayer.ts
├── navigation/
│   └── AppNavigator.tsx
├── screens/
│   ├── HomeScreen.tsx
│   ├── PlayerScreen.tsx
│   ├── SearchScreen.tsx
│   ├── QueueScreen.tsx
│   ├── FavoritesScreen.tsx
│   └── SettingsScreen.tsx
├── services/
│   └── api.ts
├── store/
│   └── playerStore.ts
├── theme/
│   └── index.ts
└── types/
    └── index.ts
```

---

<p align="center"> React Native · Expo · TypeScript</p>
