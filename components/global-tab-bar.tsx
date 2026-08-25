import { usePathname, useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { path: "/", label: "Ana Sayfa", icon: "house.fill" as const },
  { path: "/search", label: "Ara", icon: "search" as const },
  { path: "/saved", label: "Listem", icon: "bookmark" as const },
  { path: "/calendar", label: "Takvim", icon: "calendar" as const },
  { path: "/shopping", label: "Market", icon: "shopping-cart" as const },
  { path: "/timer", label: "Zamanlayıcı", icon: "timer" as const },
];

/**
 * Bazı ekranlar (profil, tarif detayı, gruplar, vb.) Expo Router'da ayrı
 * bir "stack" (yığın) altında olduğu için, sadece 6 ana sekmeye özel olan
 * yerleşik Tabs alt menüsü onlarda görünmüyordu. Bu bileşen, kök layout'ta
 * (Stack'in DIŞINDA) her zaman sabit şekilde render edilerek, hangi
 * ekranda olursa olsun alt menünün görünür kalmasını sağlar.
 */
export function GlobalTabBar() {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPadding }]} pointerEvents="box-none">
      {TABS.map((tab) => {
        const isActive = tab.path === "/" ? pathname === "/" : pathname.startsWith(tab.path);
        return (
          <Pressable key={tab.path} onPress={() => router.push(tab.path as never)} style={styles.tabButton} accessibilityRole="button" accessibilityLabel={tab.label}>
            <IconSymbol size={22} name={tab.icon} color={isActive ? colors.primary : colors.muted} />
            <Text style={[styles.label, { color: isActive ? colors.primary : colors.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const GLOBAL_TAB_BAR_HEIGHT = 58;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    paddingTop: 8,
    borderTopWidth: 0.5,
    zIndex: 40,
  },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontSize: 10, fontWeight: "700" },
});
