import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

/**
 * Web'de bir butonun üzerine gelince, altında/üstünde küçük bir açıklama
 * balonu gösterir. Doğrudan `title` prop'u vermek react-native-web'de
 * güvenilir çalışmadığı için, fare olaylarına (hover) dayalı kendi
 * balonumuzu çiziyoruz. Native'de (dokunmatik ekranlarda hover kavramı
 * olmadığından) sadece children'ı olduğu gibi gösterir.
 */
export function HoverTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View
      style={styles.wrap}
      // @ts-ignore - web-only mouse events
      onMouseEnter={() => setHovered(true)}
      // @ts-ignore
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <View style={styles.bubble} pointerEvents="none">
          <Text style={styles.bubbleText}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  bubble: {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: [{ translateX: -40 }],
    marginBottom: 6,
    backgroundColor: "rgba(20,16,14,0.92)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    minWidth: 80,
    alignItems: "center",
    zIndex: 100,
  },
  bubbleText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", textAlign: "center" },
});
