# Mume — Music Player App

A music streaming app built with React Native and Expo, powered by the JioSaavn API.

📱 **APK:** [Download](https://your-eas-link)
🎥 **Demo:** [Screen Recording](https://your-video-link)
🔗 **Repo:** [GitHub](https://github.com/YOUR_USERNAME/mume-music-player)

---

## Setup

### Prerequisites
- Node.js 18+
- Expo account at https://expo.dev
- EAS CLI: `npm install -g eas-cli`

### Run Locally
```bash
git clone https://github.com/YOUR_USERNAME/mume-music-player.git
cd mume-music-player
npx expo install
npx expo start
```

### Development Build (required for background audio)
```bash
eas login
eas build --profile development --platform android
npx expo start --dev-client
```

### Production APK
```bash
eas build --profile preview --platform android
```

---

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 52 + TypeScript |
| Navigation | React Navigation v6 |
| State | Zustand + persist middleware |
| Audio | expo-av |
| Storage | AsyncStorage |
| HTTP | Axios |
| Build | EAS |

---

## Project Structure

```
src/
├── components/       # MiniPlayer
├── hooks/            # useAudioPlayer
├── navigation/       # AppNavigator
├── screens/          # Home, Player, Search, Queue, Favorites, Settings
├── services/         # JioSaavn API
├── store/            # Zustand player store
├── theme/            # Colors, spacing, fonts
└── types/            # TypeScript interfaces
```

---

## Architecture

### Navigation
Tab navigator nested inside Stack navigator. Player and Search are Stack screens so they overlay the entire tab system — required for global music playback across all tabs.

### State
Single Zustand store holds all playback state. Both MiniPlayer and PlayerScreen read from the same store, making sync structural rather than manual.

### Audio
`useAudioPlayer` is instantiated once inside `AudioInit` at the navigation root — never unmounts, always one `Audio.Sound` object. The `seek` function is registered into the store so any screen can call it without creating a second hook instance.

### Background Playback
Requires both `staysActiveInBackground: true` in `Audio.setAudioModeAsync` and the corresponding `UIBackgroundModes` / `FOREGROUND_SERVICE` declarations in `app.json`. The code flag alone is ignored by the OS without the config declaration.

### Seek Bar
A `isSeekingRef` in `useAudioPlayer` blocks the 500ms status callback from overwriting position while a seek is in progress, preventing the back-and-forth stutter.

---

## Trade-offs

| Decision | Gained | Sacrificed |
|---|---|---|
| expo-av | Managed workflow, no ejecting | No lock screen controls or media notifications |
| Zustand | Minimal boilerplate, easy persistence | Less tooling than Redux DevTools |
| JioSaavn unofficial API | Free, no auth | No SLA, may break without notice |
| AsyncStorage | Built into Expo | Slower than MMKV for large datasets |
| 500ms position polling | Simple implementation | Slight battery drain vs event-driven updates |
