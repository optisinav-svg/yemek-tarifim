import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useKeepAwake } from "expo-keep-awake";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getRecipe } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";
import { formatTimer, useKitchenTimer } from "@/lib/kitchen-timer";

export default function CookingModeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const recipe = getRecipe(id || "");
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceListening, setVoiceListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");

  const { remainingSeconds, status: timerStatus, addMinutes, start } = useKitchenTimer();
  const currentStep = recipe?.steps[stepIndex] ?? "";
  const progress = useMemo(() => recipe ? (stepIndex + 1) / recipe.steps.length : 0, [recipe, stepIndex]);

  // Hands-free Voice Command listening on Web
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "tr-TR";
          recognition.continuous = true;
          recognition.interimResults = false;
          // @ts-ignore
          recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            setLastCommand(`Algılanan: "${transcript}"`);
            if (transcript.includes("sonraki") || transcript.includes("ileri")) {
              setStepIndex((current) => recipe ? Math.min(recipe.steps.length - 1, current + 1) : current);
            } else if (transcript.includes("önceki") || transcript.includes("geri")) {
              setStepIndex((current) => Math.max(0, current - 1));
            } else if (transcript.includes("dakika ekle") || transcript.includes("süre")) {
              void addMinutes(5);
            }
          };
          recognition.onstart = () => setVoiceListening(true);
          recognition.onerror = () => setVoiceListening(false);
          recognition.onend = () => {
            try {
              recognition.start();
            } catch (e) {}
          };
          recognition.start();
          return () => {
            try { recognition.stop(); } catch (e) {}
          };
        } catch (e) {
          console.log("Voice command initialization error:", e);
        }
      }
    }
  }, [recipe]);

  if (!recipe) return <ScreenContainer className="items-center justify-center"><Text style={[styles.title, { color: colors.foreground }]}>Tarif bulunamadı.</Text></ScreenContainer>;

  const addTimer = async (minutes: number) => {
    const nextSeconds = remainingSeconds + minutes * 60;
    await addMinutes(minutes);
    if (timerStatus !== "running" && timerStatus !== "paused") await start(nextSeconds);
  };
  const timerLabel = remainingSeconds > 0 ? formatTimer(remainingSeconds) : "Zamanlayıcı";

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right", "bottom"]}>
      {Platform.OS !== "web" ? <NativeKeepAwake /> : null}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="close" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.topTitle}>
          <Text style={[styles.kicker, { color: colors.primary }]}>PİŞİRME MODu • ELLER SERBEST</Text>
          <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{recipe.title}</Text>
        </View>
        <Text style={[styles.stepCount, { color: colors.muted }]}>{stepIndex + 1}/{recipe.steps.length}</Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.main}>
        <View style={styles.stepHeader}>
          <View className="flex-row items-center justify-between">
            <Text style={[styles.stepLabel, { color: colors.primary }]}>ADIM {stepIndex + 1}</Text>
            {voiceListening ? (
              <View className="flex-row items-center bg-surface border border-border px-2.5 py-1 rounded-full">
                <IconSymbol name="mic.fill" size={12} color={colors.success} />
                <Text className="text-[10px] font-bold text-success ml-1">Sesli Kontrol Aktif</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.helper, { color: colors.muted }]}>{lastCommand || "\"Sonraki\" veya \"Önceki\" diyerek adım ilerletebilirsin"}</Text>
        </View>

        <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepBadgeText}>{stepIndex + 1}</Text>
          </View>
          <Text style={[styles.stepText, { color: colors.foreground }]}>{currentStep}</Text>
        </View>

        <View style={styles.navigation}>
          <Pressable disabled={stepIndex === 0} onPress={() => setStepIndex((current) => Math.max(0, current - 1))} style={[styles.navButton, { borderColor: colors.border, opacity: stepIndex === 0 ? 0.35 : 1 }]}>
            <IconSymbol name="arrow-left" size={19} color={colors.foreground} />
            <Text style={[styles.navText, { color: colors.foreground }]}>Önceki Adım</Text>
          </Pressable>
          <Pressable onPress={() => setStepIndex((current) => Math.min(recipe.steps.length - 1, current + 1))} style={[styles.navButton, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: stepIndex === recipe.steps.length - 1 ? 0.6 : 1 }]}>
            <Text style={styles.nextText}>{stepIndex === recipe.steps.length - 1 ? "Tarifi Bitir" : "Sonraki Adım"}</Text>
            <IconSymbol name="chevron.right" size={19} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.timerSection}>
          <View>
            <Text style={[styles.timerTitle, { color: colors.foreground }]}>Mutfak zamanlayıcısı</Text>
            <Text style={[styles.timerHint, { color: colors.muted }]}>Süre yönetimini buradan yap</Text>
          </View>
          <View style={[styles.timerPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <IconSymbol name="timer" size={17} color={colors.primary} />
            <Text style={[styles.timerLabel, { color: colors.foreground }]}>{timerLabel}</Text>
          </View>
        </View>
        <View style={styles.timerButtons}>
          {[5, 10, 20].map((minutes) => (
            <Pressable key={minutes} onPress={() => void addTimer(minutes)} style={[styles.timerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.timerButtonText, { color: colors.foreground }]}>+{minutes} dk</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.footerNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="check" size={17} color={colors.success} />
        <Text style={[styles.footerText, { color: colors.muted }]}>Ekran açık kalır; "Sonraki" diyerek eller serbest ilerle.</Text>
      </View>
    </ScreenContainer>
  );
}

function NativeKeepAwake() {
  useKeepAwake();
  return null;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 15 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  topTitle: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.3, fontWeight: "800" },
  title: { marginTop: 3, fontSize: 17, fontWeight: "900" },
  stepCount: { fontSize: 13, fontWeight: "800" },
  progressTrack: { height: 6, overflow: "hidden", borderRadius: 3 },
  progressFill: { height: "100%", borderRadius: 3 },
  main: { flex: 1, justifyContent: "center" },
  stepHeader: { marginBottom: 14 },
  stepLabel: { fontSize: 12, letterSpacing: 1.3, fontWeight: "900" },
  helper: { marginTop: 5, fontSize: 12, fontWeight: "600" },
  stepCard: { minHeight: 220, justifyContent: "center", borderWidth: 1, borderRadius: 25, padding: 25 },
  stepBadge: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, marginBottom: 20 },
  stepBadgeText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  stepText: { fontSize: 26, lineHeight: 35, fontWeight: "900", letterSpacing: -0.5 },
  navigation: { flexDirection: "row", gap: 10, marginTop: 16 },
  navButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 50, borderWidth: 1, borderRadius: 15 },
  navText: { fontSize: 13, fontWeight: "800" },
  nextText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  timerSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24 },
  timerTitle: { fontSize: 15, fontWeight: "900" },
  timerHint: { marginTop: 2, fontSize: 11, fontWeight: "600" },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8 },
  timerLabel: { fontSize: 12, fontWeight: "800" },
  timerButtons: { flexDirection: "row", gap: 8, marginTop: 10 },
  timerButton: { flex: 1, alignItems: "center", borderWidth: 1, borderRadius: 12, paddingVertical: 9 },
  timerButtonText: { fontSize: 12, fontWeight: "800" },
  footerNote: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 14, marginBottom: 9, padding: 12 },
  footerText: { fontSize: 11, fontWeight: "700" },
});
