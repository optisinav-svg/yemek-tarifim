import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatTimer, useKitchenTimer } from "@/lib/kitchen-timer";

export default function TimerScreen() {
  const colors = useColors();
  const { remainingSeconds, status, durationSeconds, start, pause, resume, reset, setPreset } = useKitchenTimer();
  const running = status === "running";
  const paused = status === "paused";
  const completed = status === "completed";
  const isIdle = status === "idle" && remainingSeconds === 0;

  const [customMinutes, setCustomMinutes] = useState(15);
  const [customHours, setCustomHours] = useState(0);

  const totalCustomSeconds = (customHours * 3600) + (customMinutes * 60);
  const activeSeconds = running || paused || completed ? remainingSeconds : totalCustomSeconds;
  const timeLabel = formatTimer(activeSeconds);
  const statusLabel = running ? "Çalışıyor" : completed ? "Süre tamamlandı" : paused ? "Duraklatıldı" : "00:00 — Süre seç ve başlat";

  const handleAdjustMinutes = (delta: number) => {
    if (running || paused) return;
    const rawMinutes = customMinutes + delta;
    if (rawMinutes > 59) {
      // Dakika 59'u geçince saatten bir artır, dakika 0'dan devam etsin.
      setCustomHours((h) => Math.min(12, h + 1));
      setCustomMinutes(rawMinutes - 60);
    } else if (rawMinutes < 0) {
      // Dakika 0'ın altına inince, saat varsa birini "ödünç al" ve dakika 59'dan devam etsin.
      if (customHours > 0) {
        setCustomHours((h) => h - 1);
        setCustomMinutes(rawMinutes + 60);
      } else {
        setCustomMinutes(0);
      }
    } else {
      setCustomMinutes(rawMinutes);
    }
  };

  const handleAdjustHours = (delta: number) => {
    if (running || paused) return;
    setCustomHours((current) => Math.max(0, Math.min(12, current + delta)));
  };

  const handleStartCustom = async () => {
    if (totalCustomSeconds <= 0) return;
    await start(totalCustomSeconds);
  };

  const handleMainAction = () => {
    if (running) return void pause();
    if (paused) return void resume();
    if (isIdle) return void handleStartCustom();
    return void start();
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>MUTFAK YARDIMCISI</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Zamanlayıcı</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Saat ve dakikayı ayarlayarak süreni başlat.</Text>
        </View>

        <View style={[styles.timerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.ring, { borderColor: completed ? colors.success : running ? colors.primary : colors.border }]}>
            <Text style={[styles.time, { color: colors.foreground }]}>{timeLabel}</Text>
            <Text style={[styles.remaining, { color: completed ? colors.success : colors.muted }]}>{statusLabel}</Text>
          </View>

          {isIdle && !running && !paused && !completed && (
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Süre Ayarla</Text>
              <View style={styles.pickerRow}>
                {/* Hours Picker */}
                <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Pressable onPress={() => handleAdjustHours(1)} style={styles.pickerButton} accessibilityRole="button" accessibilityLabel="Saati artır">
                    <IconSymbol name="add" size={18} color={colors.primary} />
                  </Pressable>
                  <Text style={[styles.pickerValue, { color: colors.foreground }]}>{String(customHours).padStart(2, "0")}</Text>
                  <Text style={[styles.pickerUnit, { color: colors.muted }]}>saat</Text>
                  <Pressable onPress={() => handleAdjustHours(-1)} style={styles.pickerButton} accessibilityRole="button" accessibilityLabel="Saati azalt">
                    <IconSymbol name="remove" size={18} color={colors.muted} />
                  </Pressable>
                </View>

                <Text style={[styles.pickerSeparator, { color: colors.foreground }]}>:</Text>

                {/* Minutes Picker */}
                <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Pressable onPress={() => handleAdjustMinutes(1)} style={styles.pickerButton} accessibilityRole="button" accessibilityLabel="Dakikayı artır">
                    <IconSymbol name="add" size={18} color={colors.primary} />
                  </Pressable>
                  <Text style={[styles.pickerValue, { color: colors.foreground }]}>{String(customMinutes).padStart(2, "0")}</Text>
                  <Text style={[styles.pickerUnit, { color: colors.muted }]}>dakika</Text>
                  <Pressable onPress={() => handleAdjustMinutes(-1)} style={styles.pickerButton} accessibilityRole="button" accessibilityLabel="Dakikayı azalt">
                    <IconSymbol name="remove" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.quickAddRow}>
                {[1, 5, 10, 15, 30].map((mins) => (
                  <Pressable
                    key={mins}
                    onPress={() => setCustomMinutes(mins)}
                    style={[styles.quickChip, { backgroundColor: customMinutes === mins && customHours === 0 ? colors.primary : colors.background, borderColor: colors.border }]}
                  >
                    <Text style={[styles.quickChipText, { color: customMinutes === mins && customHours === 0 ? "#FFFFFF" : colors.foreground }]}>{mins} dk</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={handleMainAction}
              disabled={isIdle && totalCustomSeconds <= 0}
              style={[
                styles.mainAction,
                {
                  backgroundColor: colors.primary,
                  opacity: isIdle && totalCustomSeconds <= 0 ? 0.5 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={running ? "Zamanlayıcıyı duraklat" : paused ? "Zamanlayıcıyı devam ettir" : "Zamanlayıcıyı başlat"}
            >
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
          <Text style={[styles.noteText, { color: colors.muted }]}>Sayaç diğer ekranlarda da sağ üstte yüzen widget olarak görünür. Süre bitince sesli ve titreşimli uyarı verir.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  header: { paddingTop: 22 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800" },
  title: { marginTop: 4, fontSize: 29, fontWeight: "900" },
  subtitle: { marginTop: 5, fontSize: 13, fontWeight: "600" },
  timerCard: { alignItems: "center", borderWidth: 1, borderRadius: 24, marginTop: 22, padding: 22 },
  ring: { width: 210, height: 210, alignItems: "center", justifyContent: "center", borderWidth: 8, borderRadius: 105 },
  time: { fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  remaining: { marginTop: 5, fontSize: 12, fontWeight: "700", textAlign: "center", paddingHorizontal: 12 },
  pickerSection: { width: "100%", marginTop: 20, alignItems: "center" },
  pickerTitle: { fontSize: 13, fontWeight: "800", marginBottom: 10 },
  pickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  pickerBox: { width: 92, alignItems: "center", borderWidth: 1, borderRadius: 14, paddingVertical: 8 },
  pickerButton: { padding: 4 },
  pickerValue: { fontSize: 26, fontWeight: "900", marginVertical: 2 },
  pickerUnit: { fontSize: 11, fontWeight: "700" },
  pickerSeparator: { fontSize: 28, fontWeight: "900", marginTop: -8 },
  quickAddRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 14 },
  quickChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6 },
  quickChipText: { fontSize: 11, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 9, width: "100%", marginTop: 22 },
  mainAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14, paddingVertical: 14 },
  mainActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  resetAction: { alignItems: "center", justifyContent: "center", minWidth: 88, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13 },
  resetText: { fontSize: 13, fontWeight: "800" },
  note: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 15, marginTop: 18, padding: 13 },
  noteText: { flex: 1, fontSize: 11, fontWeight: "700" },
});
