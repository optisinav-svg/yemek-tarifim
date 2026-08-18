import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { recipes } from "@/lib/recipe-data";

const DAYS = [
  { key: "Pazartesi", label: "Pazartesi" },
  { key: "Salı", label: "Salı" },
  { key: "Çarşamba", label: "Çarşamba" },
  { key: "Perşembe", label: "Perşembe" },
  { key: "Cuma", label: "Cuma" },
  { key: "Cumartesi", label: "Cumartesi" },
  { key: "Pazar", label: "Pazar" },
];

const MEALS = [
  { key: "breakfast", label: "Kahvaltı", icon: "local-cafe" },
  { key: "lunch", label: "Öğle Yemeği", icon: "restaurant" },
  { key: "dinner", label: "Akşam Yemeği", icon: "dinner-dining" },
  { key: "snack", label: "Ara Öğün", icon: "cookie" },
];

export default function MealPlanScreen() {
  const colors = useColors();
  const [selectedDay, setSelectedDay] = useState("Pazartesi");
  const [plan, setPlan] = useState<Record<string, Record<string, string>>>({
    Pazartesi: { dinner: "Kayseri Mantısı" },
    Salı: { dinner: "Zeytinyağlı Sebze Tabağı" },
    Çarşamba: { dinner: "Mercimek Köftesi" },
  });

  const handleAssignMeal = (mealKey: string) => {
    Alert.alert(
      "Yemek Planla",
      `${selectedDay} günü için bir tarif seçin:`,
      [
        ...recipes.map((r) => ({
          text: r.title,
          onPress: () => {
            setPlan((prev) => ({
              ...prev,
              [selectedDay]: {
                ...(prev[selectedDay] || {}),
                [mealKey]: r.title,
              },
            }));
          },
        })),
        { text: "İptal", onPress: () => {} },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Haftalık Yemek Takvimi</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Hangi gün ne pişireceğini planla, sofranı kolayca hazırla</Text>
        </View>

        {/* Days Horizontal Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAYS.map((day) => {
            const active = selectedDay === day.key;
            return (
              <Pressable
                key={day.key}
                onPress={() => setSelectedDay(day.key)}
                style={[styles.dayButton, { backgroundColor: active ? colors.primary : colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.dayButtonText, { color: active ? "#FFFFFF" : colors.foreground }]}>{day.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Meals for Selected Day */}
        <View style={styles.mealCardsContainer}>
          <Text style={[styles.sectionHeader, { color: colors.foreground }]}>{selectedDay} Menüsü</Text>
          {MEALS.map((meal) => {
            const assignedRecipe = plan[selectedDay]?.[meal.key];
            return (
              <View key={meal.key} style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.mealInfo}>
                  <View style={[styles.mealIconBox, { backgroundColor: colors.primary + "20" }]}>
                    <IconSymbol name={meal.icon as never} size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.mealLabel, { color: colors.muted }]}>{meal.label}</Text>
                    <Text style={[styles.mealValue, { color: assignedRecipe ? colors.foreground : colors.muted }]}>
                      {assignedRecipe || "Henüz planlanmadı"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleAssignMeal(meal.key)}
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.addButtonText}>{assignedRecipe ? "Değiştir" + "" : "+ Ekle"}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  daysRow: {
    gap: 8,
    marginBottom: 24,
    paddingVertical: 4,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  mealCardsContainer: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  mealInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  mealIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mealLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  mealValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
