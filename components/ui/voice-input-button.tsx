import React from "react";
import { TouchableOpacity, Text, Platform } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface VoiceInputButtonProps {
  onVoiceInput: (text: string) => void;
  label?: string;
}

export function VoiceInputButton({ onVoiceInput, label = "Sesle Yaz" }: VoiceInputButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "tr-TR";
          recognition.interimResults = false;
          // @ts-ignore
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
              onVoiceInput(transcript);
            }
          };
          recognition.start();
          return;
        } catch (e) {
          console.log("Speech recognition error:", e);
        }
      }
    }

    alert("Lütfen mobil klavyenizin alt veya üst kısmındaki mikrofon (sesle yazma) simgesine dokunarak konuşun.");
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
