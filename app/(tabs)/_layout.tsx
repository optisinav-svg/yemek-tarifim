import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerShown: false, tabBarButton: HapticTab, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" }, tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 } }}>
      <Tabs.Screen name="index" options={{ title: "Ana Sayfa", tabBarIcon: ({ color }) => <IconSymbol size={22} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: "Ara", tabBarIcon: ({ color }) => <IconSymbol size={22} name="search" color={color} /> }} />
      <Tabs.Screen name="saved" options={{ title: "Listem", tabBarIcon: ({ color }) => <IconSymbol size={22} name="bookmark" color={color} /> }} />
      <Tabs.Screen name="shopping" options={{ title: "Market", tabBarIcon: ({ color }) => <IconSymbol size={22} name="shopping-cart" color={color} /> }} />
      <Tabs.Screen name="timer" options={{ title: "Zamanlayıcı", tabBarIcon: ({ color }) => <IconSymbol size={22} name="timer" color={color} /> }} />
      <Tabs.Screen name="meal-plan" options={{ title: "Takvim", tabBarIcon: ({ color }) => <IconSymbol size={22} name="calendar" color={color} /> }} />
    </Tabs>
  );
}
