import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface VoiceInputButtonProps {
  onPress?: () => void;
  label?: string;
}

export function VoiceInputButton({ onPress, label = "Sesle Yaz" }: VoiceInputButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center bg-surface border border-border px-3 py-1.5 rounded-full self-start my-1"
      activeOpacity={0.7}
    >
      <IconSymbol size={16} name="paperplane.fill" color={colors.primary} />
      <Text className="text-xs font-medium text-foreground ml-1.5">{label}</Text>
    </TouchableOpacity>
  );
}
