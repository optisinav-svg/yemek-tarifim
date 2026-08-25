import { Platform, View, type ViewProps } from "react-native";
import { SafeAreaView, useSafeAreaInsets, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { GLOBAL_TAB_BAR_HEIGHT } from "@/components/global-tab-bar";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
  /**
   * Whether to reserve space at the bottom for the persistent GlobalTabBar
   * (rendered globally, outside this screen). Set to false for screens
   * that intentionally cover the whole viewport (e.g. cooking mode).
   */
  reserveTabBarSpace?: boolean;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  reserveTabBarSpace = true,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const tabBarSpace = reserveTabBarSpace
    ? GLOBAL_TAB_BAR_HEIGHT + (Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8))
    : 0;

  return (
    <View
      className={cn(
        "flex-1",
        "bg-background",
        containerClassName
      )}
      {...props}
    >
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <View className={cn("flex-1", className)} style={tabBarSpace ? { paddingBottom: tabBarSpace } : undefined}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
