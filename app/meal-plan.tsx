import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealItem {
  id: string;
  day: string;
  type: MealType;
  title: string;
  time?: string;
}

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function MealPlanScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState("Pazartesi");
  const [meals, setMeals] = useState<MealItem[]>([
    { id: "1", day: "Pazartesi", type: "breakfast", title: "Menemen ve Zeytin" },
    { id: "2", day: "Pazartesi", type: "lunch", title: "Mercimek Çorbası" },
    { id: "3", day: "Pazartesi", type: "dinner", title: "Izgara Tavuk ve Pilav" },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<MealType>("snack");
  const [newTime, setNewTime] = useState("15:30");

  const handleAddMeal = () => {
    if (!newTitle.trim()) {
      Alert.alert("Hata", "Lütfen yemek veya ara öğün adı girin.");
      return;
    }

    if (newType === "snack") {
      const snackCount = meals.filter((m) => m.day === selectedDay && m.type === "snack").length;
      if (snackCount >= 2) {
        Alert.alert("Sınır Aşıldı", "Bir güne en fazla 2 ara öğün eklenebilir.");
        return;
      }
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const item: MealItem = {
      id: Date.now().toString(),
      day: selectedDay,
      type: newType,
      title: newTitle.trim(),
      time: newType === "snack" ? newTime : undefined,
    };

    setMeals([...meals, item]);
    setNewTitle("");
  };

  const handleRemove = (id: string) => {
    setMeals(meals.filter((m) => m.id !== id));
  };

  const dayMeals = meals.filter((m) => m.day === selectedDay);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <IconSymbol size={24} name="chevron.left.forwardslash.chevron.right" color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Haftalık Yemek Planı</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Days Horizontal Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {DAYS.map((d) => {
            const isSelected = d === selectedDay;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDay(d);
                }}
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: colors.border,
                }}
                className="px-4 py-2 rounded-xl mr-2 border"
              >
                <Text style={{ color: isSelected ? "#ffffff" : colors.foreground }} className="font-semibold text-sm">
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Meals List for Selected Day */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-base font-bold text-foreground mb-3">{selectedDay} Öğünleri</Text>

          {dayMeals.length === 0 ? (
            <Text className="text-muted text-sm py-4 text-center">Bu gün için henüz öğün eklenmedi.</Text>
          ) : (
            dayMeals.map((m) => (
              <View key={m.id} className="flex-row items-center justify-between py-2 border-b border-border">
                <View>
                  <View className="flex-row items-center">
                    <Text className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary mr-2">
                      {m.type === "breakfast" ? "Sabah" : m.type === "lunch" ? "Öğle" : m.type === "dinner" ? "Akşam" : `Ara Öğün (${m.time})`}
                    </Text>
                    <Text className="text-sm font-medium text-foreground">{m.title}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemove(m.id)}>
                  <Text className="text-error text-xs font-bold">Sil</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Add Meal Form */}
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-base font-bold text-foreground mb-3">Yeni Öğün / Ara Öğün Ekle</Text>

          <View className="flex-row mb-3 flex-wrap gap-2">
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setNewType(t)}
                style={{ backgroundColor: newType === t ? colors.primary : colors.background, borderColor: colors.border }}
                className="px-3 py-1.5 rounded-lg border"
              >
                <Text style={{ color: newType === t ? "#ffffff" : colors.foreground }} className="text-xs font-semibold">
                  {t === "breakfast" ? "Sabah" : t === "lunch" ? "Öğle" : t === "dinner" ? "Akşam" : "Ara Öğün"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {newType === "snack" && (
            <TextInput
              placeholder="Saat (Örn: 15:30)"
              placeholderTextColor={colors.muted}
              value={newTime}
              onChangeText={setNewTime}
              className="bg-background border border-border rounded-xl px-4 py-2.5 text-foreground mb-3 text-sm"
            />
          )}

          <TextInput
            placeholder="Yemek veya tarif adı..."
            placeholderTextColor={colors.muted}
            value={newTitle}
            onChangeText={setNewTitle}
            className="bg-background border border-border rounded-xl px-4 py-2.5 text-foreground mb-4 text-sm"
          />

          <TouchableOpacity
            onPress={handleAddMeal}
            style={{ backgroundColor: colors.primary }}
            className="py-3 rounded-xl items-center active:opacity-80 shadow-sm"
          >
            <Text className="text-white font-semibold">Öğünü Listeye Ekle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
