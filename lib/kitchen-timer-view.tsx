import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PanResponder, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatTimer } from "./kitchen-timer-utils";

const TIMER_STORAGE_KEY = "yemek-tarifim.kitchen-timer.v1";
const TIMER_WIDGET_POSITION_KEY = "yemek-tarifim.kitchen-timer.widget-position.v1";
const TIMER_CHANNEL_ID = "kitchen-timer";
const WIDGET_WIDTH = 174;
const WIDGET_HEIGHT = 52;

let completionPlayer: ReturnType<typeof createAudioPlayer> | null = null;

function stopCompletionChime() {
  try {
    completionPlayer?.pause();
    completionPlayer?.seekTo(0);
  } catch {
    // The player may already be released on a platform without audio support.
  }
}

async function playCompletionChime() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
      interruptionModeAndroid: "duckOthers",
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
    completionPlayer ??= createAudioPlayer(require("../assets/audio/timer-complete.wav"));
    completionPlayer.volume = 1.0;
    completionPlayer.seekTo(0);
    completionPlayer.play();
    if (Platform.OS !== "web") {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
  } catch {
    // The visual completed state and haptic feedback remain available if audio is unavailable.
  }
}

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

type TimerStatus = "idle" | "running" | "paused" | "completed";

type TimerState = {
  durationSeconds: number;
  remainingSeconds: number;
  endsAt: number | null;
  notificationId: string | null;
  status: TimerStatus;
};

type KitchenTimerContextValue = TimerState & {
  start: (seconds?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  reset: () => Promise<void>;
  dismiss: () => Promise<void>;
  setPreset: (seconds: number) => Promise<void>;
  addMinutes: (minutes: number) => Promise<void>;
};

const INITIAL_STATE: TimerState = {
  durationSeconds: 0,
  remainingSeconds: 0,
  endsAt: null,
  notificationId: null,
  status: "idle",
};

const TimerContext = createContext<KitchenTimerContextValue | null>(null);

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === "idle" || value === "running" || value === "paused" || value === "completed";
}

function readSavedState(value: string | null): TimerState {
  if (!value) return INITIAL_STATE;
  try {
    const parsed = JSON.parse(value) as Partial<TimerState>;
    const durationSeconds = typeof parsed.durationSeconds === "number" && parsed.durationSeconds > 0 ? Math.round(parsed.durationSeconds) : 0;
    const remainingSeconds = typeof parsed.remainingSeconds === "number" && parsed.remainingSeconds >= 0 ? Math.round(parsed.remainingSeconds) : 0;
    const endsAt = typeof parsed.endsAt === "number" && parsed.endsAt > 0 ? parsed.endsAt : null;
    const status = isTimerStatus(parsed.status) ? parsed.status : "idle";
    if (status === "running" && endsAt && endsAt <= Date.now()) {
      return { durationSeconds, remainingSeconds: 0, endsAt: null, notificationId: null, status: "completed" };
    }
    return {
      durationSeconds,
      remainingSeconds,
      endsAt: status === "running" ? endsAt : null,
      notificationId: typeof parsed.notificationId === "string" ? parsed.notificationId : null,
      status,
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function KitchenTimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const completionHandled = useRef(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(TIMER_STORAGE_KEY).then((saved) => {
      if (!active) return;
      setState(readSavedState(saved));
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (state.status !== "running" || !state.endsAt) return;
    const endsAt = state.endsAt;
    const syncRemaining = () => {
      const nextRemaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setState((current) => {
        if (current.status !== "running" || current.endsAt !== endsAt) return current;
        if (nextRemaining === 0) {
          return { ...current, remainingSeconds: 0, endsAt: null, notificationId: null, status: "completed" };
        }
        if (current.remainingSeconds === nextRemaining) return current;
        return { ...current, remainingSeconds: nextRemaining };
      });
    };
    syncRemaining();
    const interval = setInterval(syncRemaining, 500);
    return () => clearInterval(interval);
  }, [state.status, state.endsAt]);

  useEffect(() => {
    if (state.status === "running") completionHandled.current = false;
    if (state.status !== "completed" || completionHandled.current) return;
    completionHandled.current = true;
    void playCompletionChime();
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  }, [state.status]);

  const cancelNotification = useCallback(async (notificationId: string | null) => {
    if (!notificationId || Platform.OS === "web") return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // The notification may already have been delivered or removed by the OS.
    }
  }, []);

  const scheduleNotification = useCallback(async (endsAt: number) => {
    if (Platform.OS === "web") return null;
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
          name: "Mutfak zamanlayıcıları",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
        });
      }
      const permission = await Notifications.getPermissionsAsync();
      const finalPermission = permission.status === "granted" ? permission : await Notifications.requestPermissionsAsync();
      if (finalPermission.status !== "granted") return null;
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: "Süre tamamlandı",
          body: "Mutfak zamanlayıcın bitti.",
          sound: "default",
          data: { type: "kitchen-timer" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(endsAt),
          ...(Platform.OS === "android" ? { channelId: TIMER_CHANNEL_ID } : {}),
        },
      });
    } catch {
      return null;
    }
  }, []);

  const start = useCallback(async (seconds?: number) => {
    stopCompletionChime();
    const requestedSeconds = seconds !== undefined ? seconds : (state.remainingSeconds > 0 ? state.remainingSeconds : state.durationSeconds);
    const totalSeconds = Math.max(1, Math.round(requestedSeconds));
    await cancelNotification(state.notificationId);
    const endsAt = Date.now() + totalSeconds * 1000;
    const notificationId = await scheduleNotification(endsAt);
    setState({ durationSeconds: totalSeconds, remainingSeconds: totalSeconds, endsAt, notificationId, status: "running" });
  }, [cancelNotification, scheduleNotification, state.durationSeconds, state.notificationId, state.remainingSeconds]);

  const pause = useCallback(async () => {
    if (state.status !== "running" || !state.endsAt) return;
    const remainingSeconds = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
    await cancelNotification(state.notificationId);
    setState((current) => ({ ...current, remainingSeconds, endsAt: null, notificationId: null, status: remainingSeconds > 0 ? "paused" : "completed" }));
  }, [cancelNotification, state.endsAt, state.notificationId, state.status]);

  const resume = useCallback(async () => {
    if (state.remainingSeconds <= 0) return;
    await start(state.remainingSeconds);
  }, [start, state.remainingSeconds]);

  const reset = useCallback(async () => {
    stopCompletionChime();
    await cancelNotification(state.notificationId);
    setState(INITIAL_STATE);
  }, [cancelNotification, state.notificationId]);

  const dismiss = useCallback(async () => {
    stopCompletionChime();
    await cancelNotification(state.notificationId);
    setState(INITIAL_STATE);
  }, [cancelNotification, state.notificationId]);

  const setPreset = useCallback(async (seconds: number) => {
    stopCompletionChime();
    await cancelNotification(state.notificationId);
    const safeSeconds = Math.max(1, Math.round(seconds));
    setState({ durationSeconds: safeSeconds, remainingSeconds: safeSeconds, endsAt: null, notificationId: null, status: "idle" });
  }, [cancelNotification, state.notificationId]);

  const addMinutes = useCallback(async (minutes: number) => {
    const extraSeconds = Math.max(1, Math.round(minutes * 60));
    const currentRemaining = state.status === "running" && state.endsAt ? Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000)) : state.remainingSeconds;
    const nextRemaining = currentRemaining + extraSeconds;
    const shouldReschedule = state.status === "running";
    const nextEndsAt = shouldReschedule ? Date.now() + nextRemaining * 1000 : null;
    if (shouldReschedule) await cancelNotification(state.notificationId);
    const notificationId = shouldReschedule && nextEndsAt ? await scheduleNotification(nextEndsAt) : null;
    setState((current) => ({
      ...current,
      durationSeconds: Math.max(current.durationSeconds, nextRemaining),
      remainingSeconds: nextRemaining,
      endsAt: nextEndsAt,
      notificationId,
      status: shouldReschedule ? "running" : current.status,
    }));
  }, [cancelNotification, scheduleNotification, state.endsAt, state.notificationId, state.remainingSeconds, state.status]);

  const value = useMemo<KitchenTimerContextValue>(() => ({ ...state, start, pause, resume, reset, dismiss, setPreset, addMinutes }), [addMinutes, dismiss, pause, reset, resume, setPreset, start, state]);

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useKitchenTimer() {
  const value = useContext(TimerContext);
  if (!value) throw new Error("useKitchenTimer must be used within KitchenTimerProvider");
  return value;
}

type WidgetPosition = { x: number; y: number };

function clampWidgetPosition(position: WidgetPosition, width: number, height: number, topInset: number, bottomInset: number): WidgetPosition {
  const maxX = Math.max(12, width - WIDGET_WIDTH - 12);
  const maxY = Math.max(topInset + 8, height - bottomInset - WIDGET_HEIGHT - 8);
  return {
    x: Math.min(Math.max(12, position.x), maxX),
    y: Math.min(Math.max(topInset + 8, position.y), maxY),
  };
}

export function ActiveTimerWidget() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { status, remainingSeconds, pause, resume, dismiss } = useKitchenTimer();
  const defaultPosition = clampWidgetPosition({ x: width - WIDGET_WIDTH - 14, y: insets.top + 8 }, width, height, insets.top, insets.bottom);
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const positionRef = useRef<WidgetPosition | null>(null);
  const didDragRef = useRef(false);
  const dragStartRef = useRef<WidgetPosition | null>(null);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(TIMER_WIDGET_POSITION_KEY).then((saved) => {
      if (!active || !saved) return;
      try {
        const parsed = JSON.parse(saved) as Partial<WidgetPosition>;
        if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return;
        const next = clampWidgetPosition(parsed as WidgetPosition, width, height, insets.top, insets.bottom);
        positionRef.current = next;
        setPosition(next);
      } catch {
        // Ignore an invalid saved position and use the default location.
      }
    });
    return () => {
      active = false;
    };
  }, [height, insets.bottom, insets.top, width]);

  useEffect(() => {
    const current = positionRef.current;
    if (!current) return;
    const next = clampWidgetPosition(current, width, height, insets.top, insets.bottom);
    if (next.x === current.x && next.y === current.y) return;
    positionRef.current = next;
    setPosition(next);
    void AsyncStorage.setItem(TIMER_WIDGET_POSITION_KEY, JSON.stringify(next));
  }, [height, insets.bottom, insets.top, width]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          didDragRef.current = false;
          dragStartRef.current = positionRef.current ?? defaultPosition;
        },
        onPanResponderMove: (_event, gestureState) => {
          if (Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1) {
            didDragRef.current = true;
          }
          const start = dragStartRef.current ?? defaultPosition;
          const next = clampWidgetPosition(
            { x: start.x + gestureState.dx, y: start.y + gestureState.dy },
            width,
            height,
            insets.top,
            insets.bottom,
          );
          positionRef.current = next;
          setPosition(next);
        },
        onPanResponderRelease: () => {
          const current = positionRef.current;
          if (current) void AsyncStorage.setItem(TIMER_WIDGET_POSITION_KEY, JSON.stringify(current));
          dragStartRef.current = null;
        },
        onPanResponderTerminate: () => {
          dragStartRef.current = null;
        },
      }),
    [defaultPosition, height, insets.bottom, insets.top, width],
  );
  const visible = status === "running" || status === "paused" || status === "completed";
  if (!visible) return null;

  const completed = status === "completed";
  const paused = status === "paused";
  const label = completed ? "Süre doldu" : formatTimer(remainingSeconds);
  const sublabel = completed ? "Uyarı devam ediyor" : paused ? "Duraklatıldı" : "Mutfak sayacı";
  const widgetPosition = position ?? defaultPosition;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        accessibilityRole="button"
        accessibilityLabel={completed ? "Süre tamamlandı, uyarıyı kapatmak için kapat düğmesine dokunun" : "Aktif mutfak zamanlayıcısı; gövdeden tutup taşımak için sürükleyin"}
        accessibilityHint="Sayaç gövdesini parmağınızla tutup ekran içinde taşıyabilirsiniz. Kısa dokunuş zamanlayıcı ekranını açar."
        style={[
          styles.widget,
          { left: widgetPosition.x, top: widgetPosition.y, backgroundColor: completed ? colors.success : colors.foreground, borderColor: completed ? colors.success : colors.foreground },
        ]}
      >
        <Pressable
          {...panResponder.panHandlers}
          onPress={() => {
            if (didDragRef.current) {
              didDragRef.current = false;
              return;
            }
            if (!completed) router.push("/timer");
          }}
          style={styles.widgetDragArea}
        >
          <IconSymbol name={completed ? "check" : "timer"} size={16} color={completed ? "#FFFFFF" : colors.background} />
          <View style={styles.widgetCopy}>
            <Text style={styles.widgetTime}>{label}</Text>
            <Text style={styles.widgetSubtitle}>{sublabel}</Text>
          </View>
        </Pressable>
        {completed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Süre uyarısını kapat"
            onPress={() => void dismiss()}
            hitSlop={8}
            style={styles.widgetControl}
          >
            <IconSymbol name="close" size={15} color={colors.background} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paused ? "Zamanlayıcıyı devam ettir" : "Zamanlayıcıyı duraklat"}
            onPress={() => (paused ? void resume() : void pause())}
            hitSlop={8}
            style={styles.widgetControl}
          >
            <IconSymbol name={paused ? "play" : "pause"} size={15} color={colors.background} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: { position: "absolute", zIndex: 20, elevation: 10, width: WIDGET_WIDTH, height: WIDGET_HEIGHT, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 17, paddingHorizontal: 7, shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 9, shadowOffset: { width: 0, height: 4 } },
  widgetDragArea: { flex: 1, minWidth: 0, height: "100%", flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  widgetCopy: { flex: 1, marginHorizontal: 8 },
  widgetTime: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 0.2 },
  widgetSubtitle: { color: "#FFF3E6", marginTop: 2, fontSize: 9, fontWeight: "700" },
  widgetControl: { alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)" },
});
