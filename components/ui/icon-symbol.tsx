// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "bookmark": "bookmark-border",
  "bookmark.fill": "bookmark",
  "search": "search",
  "menu-book": "menu-book",
  "timer": "timer",
  "clock": "schedule",
  "person": "person-outline",
  "settings": "settings",
  "arrow-left": "arrow-back",
  "share": "share",
  "add": "add",
  "remove": "remove",
  "shopping-cart": "shopping-cart",
  "check": "check",
  "play": "play-arrow",
  "pause": "pause",
  "home": "home",
  "restaurant": "restaurant",
  "soup-kitchen": "soup-kitchen",
  "eco": "eco",
  "cake": "cake",
  "bakery-dining": "bakery-dining",
  "local-cafe": "local-cafe",
  "mic": "mic",
  "translate": "translate",
  "tune": "tune",
  "close": "close",
  "more": "more-horiz",
  "delete": "delete-outline",
  "edit": "edit",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
