import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatTimer, useKitchenTimer } from "@/lib/kitchen-timer";

export default function TimerScreen() {
  const colors = useColors();
  const { remainingSeconds, status, start, pause, resume, reset, setPreset } = useKitchenTimer();
  const running = status === "running";
  const paused = status === "paused";
  const completed = status === "completed";
  const timeLabel = formatTimer(remainingSeconds);
  const statusLabel = running ? "Çalışıyor" : completed ? "Süre tamamlandı" : paused ? "Duraklatıldı" : remainingSeconds ? "Hazır" : "Hazır";

  const handleMainAction = () => {
    if (running) return void pause();
    if (paused) return void resume();
    return void start();
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.primary }]}>MUTFAK YARDIMCISI</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Zamanlayıcı</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Pişirme süreni kaçırma.</Text>
      </View>
      <View style={[styles.timerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.ring, { borderColor: completed ? colors.success : colors.primary }]}>
          <Text style={[styles.time, { color: colors.foreground }]}>{timeLabel}</Text>
          <Text style={[styles.remaining, { color: completed ? colors.success : colors.muted }]}>{statusLabel}</Text>
        </View>
        <View style={styles.presets}>
          {[5, 10, 20].map((value) => (
            <Pressable key={value} onPress={() => void setPreset(value * 60)} style={[styles.preset, { backgroundColor: colors.background, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel={`${value} dakika hazır süre`}>
              <Text style={[styles.presetText, { color: colors.foreground }]}>+{value} dk</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={handleMainAction} disabled={!remainingSeconds && !completed} style={[styles.mainAction, { backgroundColor: colors.primary, opacity: remainingSeconds ? 1 : 0.5 }]} accessibilityRole="button" accessibilityLabel={running ? "Zamanlayıcıyı duraklat" : paused ? "Zamanlayıcıyı devam ettir" : "Zamanlayıcıyı başlat"}>
            <IconSymbol name={running ? "pause" : "play"} size={20} color="#FFFFFF" />
            <Text style={styles.mainActionText}>{running ? "Duraklat" : paused ? "Devam et" : completed ? "Yeniden başlat" : "Başlat"}</Text>
          </Pressable>
          <Pressable onPress={() => void reset()} style={[styles.resetAction, { borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Zamanlayıcıyı sıfırla">
            <Text style={[styles.resetText, { color: colors.foreground }]}>Sıfırla</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="check" size={17} color={colors.success} />
        <Text style={[styles.noteText, { color: colors.muted }]}>Sayaç diğer ekranlarda da sağ üstte görünür. Süre bitince bildirim sesi ve titreşimle haber verir.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 22 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800" },
  title: { marginTop: 4, fontSize: 29, fontWeight: "900" },
  subtitle: { marginTop: 5, fontSize: 13, fontWeight: "600" },
  timerCard: { alignItems: "center", borderWidth: 1, borderRadius: 24, marginTop: 26, padding: 22 },
  ring: { width: 220, height: 220, alignItems: "center", justifyContent: "center", borderWidth: 8, borderRadius: 110 },
  time: { fontSize: 42, fontWeight: "900", letterSpacing: -1 },
  remaining: { marginTop: 5, fontSize: 12, fontWeight: "700" },
  presets: { flexDirection: "row", gap: 9, marginTop: 22 },
  preset: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10 },
  presetText: { fontSize: 12, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 9, width: "100%", marginTop: 17 },
  mainAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14, paddingVertical: 14 },
  mainActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  resetAction: { alignItems: "center", justifyContent: "center", minWidth: 88, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13 },
  resetText: { fontSize: 13, fontWeight: "800" },
  note: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 15, marginTop: 18, padding: 13 },
  noteText: { flex: 1, fontSize: 11, fontWeight: "700" },
});
