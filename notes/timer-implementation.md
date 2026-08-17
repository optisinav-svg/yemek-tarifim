# Timer implementation notes

Sources reviewed:
- `/home/ubuntu/yemek-tarifim_helper/docs/media/audio/DOCS.md`
- `/home/ubuntu/yemek-tarifim_helper/docs/system/haptics/DOCS.md`
- `/home/ubuntu/yemek-tarifim_helper/docs/background/notifications/DOCS.md`

Key constraints:
- `expo-audio` supports Android, iOS, and web. Use `useAudioPlayer` for bundled short sound effects; set audio mode with `setAudioModeAsync({ playsInSilentMode: true })` before playback. Reset with `seekTo(0)` before replaying; hook-managed players clean up automatically.
- Haptics must be wrapped with `Platform.OS !== "web"`; pair haptics with visual feedback because iOS settings can suppress them.
- `expo-notifications` local notifications can be scheduled in Expo Go, while remote push notifications on Android require a development build. Foreground notification display requires a notification handler. Android needs a high-importance channel with vibration pattern.
- Existing timer screen is local state only (`app/(tabs)/timer.tsx`); persistent widget requires shared provider state mounted in `app/_layout.tsx`.
