import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMemberGate, MemberRequiredView } from "@/components/member-gate";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-store";
import { buildGoogleCalendarLink } from "@/lib/calendar-link";
import { MEAL_SLOTS, MEAL_SLOT_LABELS, MAX_ENTRIES_PER_SLOT, useMealPlan, type MealSlot } from "@/lib/meal-plan-store";
import { getApiBaseUrl } from "@/constants/oauth";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { recipeImages, type Recipe } from "@/lib/recipe-data";

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfWeek(reference: Date) {
  const d = new Date(reference);
  const day = (d.getDay() + 6) % 7; // Pazartesi = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDayHeader(date: Date) {
  return `${date.getDate()} ${date.toLocaleDateString("tr-TR", { month: "long" })}`;
}

function resolveAssetUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return url;
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, loading, requireMember, authModal } = useMemberGate();
  const { getEntries, addEntry, updateServings, removeEntry, getWeekEntries, isReady } = useMealPlan();
  const { addRecipeToShopping } = useAppStore();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const todayIdx = (new Date().getDay() + 6) % 7;
    return todayIdx;
  });
  const selectedDate = weekDates[selectedDayIndex];
  const selectedDateKey = toDateKey(selectedDate);

  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [addingToShopping, setAddingToShopping] = useState(false);

  const recipesQuery = trpc.recipes.list.useQuery(
    pickerSearch.trim() ? { search: pickerSearch.trim() } : undefined,
    { enabled: pickerSlot !== null },
  );

  if (loading || !isReady) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <MemberRequiredView description="Haftalık yemek planınızı görmek ve düzenlemek için üye girişi yapın." onLogin={() => requireMember()} />
        {authModal}
      </ScreenContainer>
    );
  }

  const weekEntries = getWeekEntries(weekDates.map(toDateKey));

  const handleAddWeekToShopping = async () => {
    if (weekEntries.length === 0) {
      Alert.alert("Boş hafta", "Alışveriş listesine eklemek için önce bu haftaya en az bir tarif ekleyin.");
      return;
    }
    setAddingToShopping(true);
    try {
      const client = createTRPCClient();
      for (const entry of weekEntries) {
        const server = await client.recipes.byId.query({ id: Number(entry.recipeId) });
        if (!server) continue;
        let ingredients: Recipe["ingredients"] = [];
        try {
          const raw = server.ingredients as unknown;
          ingredients = Array.isArray(raw)
            ? raw.map((item) => {
                const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
                const amountText = String(record.amount ?? "").replace(",", ".").trim();
                const parsedAmount = Number(amountText);
                return {
                  name: String(record.name ?? "Malzeme"),
                  unit: String(record.unit ?? "adet"),
                  amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
                  scalable: Number.isFinite(parsedAmount),
                };
              })
            : [];
        } catch {
          ingredients = [];
        }
        const recipeForShopping: Recipe = {
          id: String(server.id),
          title: server.title,
          category: server.category,
          country: server.countryCode === "TR" ? "TR" : "ALL",
          countryName: server.countryCode === "TR" ? "Türkiye" : "Dünya mutfağı",
          flag: server.countryCode === "TR" ? "🇹🇷" : "🌍",
          image: server.imageUrl ? { uri: resolveAssetUrl(server.imageUrl) } : recipeImages.mercimek,
          author: "Topluluk üyesi",
          authorAvatar: "TY",
          prepMinutes: server.prepMinutes,
          cookMinutes: server.cookMinutes,
          servings: server.servings,
          summary: server.summary ?? "",
          ingredients,
          steps: [],
          tip: server.tip ?? "",
          createdAt: new Date().toISOString(),
        };
        addRecipeToShopping(recipeForShopping, entry.servings);
      }
      Alert.alert("Eklendi", "Bu haftanın tariflerindeki malzemeler alışveriş listenize eklendi.", [
        { text: "Alışveriş listesine git", onPress: () => router.push("/shopping") },
        { text: "Tamam" },
      ]);
    } catch {
      Alert.alert("Hata", "Malzemeler eklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setAddingToShopping(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Takvim</Text>
        <View style={styles.weekNav}>
          <Pressable onPress={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} style={styles.navBtn}>
            <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })} style={styles.navBtn}>
            <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
        {weekDates.map((date, index) => {
          const isSelected = index === selectedDayIndex;
          const dateKey = toDateKey(date);
          const hasEntries = MEAL_SLOTS.some((slot) => getEntries(dateKey, slot).length > 0);
          return (
            <Pressable key={dateKey} onPress={() => setSelectedDayIndex(index)} style={[styles.dayChip, { backgroundColor: isSelected ? colors.primary : colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.dayChipLabel, { color: isSelected ? "#FFFFFF" : colors.muted }]}>{DAY_LABELS[index]}</Text>
              <Text style={[styles.dayChipNum, { color: isSelected ? "#FFFFFF" : colors.foreground }]}>{date.getDate()}</Text>
              {hasEntries && <View style={[styles.dot, { backgroundColor: isSelected ? "#FFFFFF" : colors.primary }]} />}
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.selectedDateText, { color: colors.muted }]}>{formatDayHeader(selectedDate)}</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.slotList}>
        {MEAL_SLOTS.map((slot) => {
          const slotEntries = getEntries(selectedDateKey, slot);
          return (
            <View key={slot} style={[styles.slotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.slotHeaderRow}>
                <Text style={[styles.slotLabel, { color: colors.muted }]}>{MEAL_SLOT_LABELS[slot]}</Text>
                <Text style={[styles.slotLabel, { color: colors.muted }]}>{slotEntries.length}/{MAX_ENTRIES_PER_SLOT}</Text>
              </View>
              {slotEntries.map((entry) => (
                <View key={entry.id} style={styles.entryBlock}>
                  <Text style={[styles.slotRecipeTitle, { color: colors.foreground }]} numberOfLines={2}>{entry.recipeTitle}</Text>
                  <View style={styles.slotRow}>
                    <View style={[styles.servingStepper, { borderColor: colors.border }]}>
                      <Pressable onPress={() => updateServings(selectedDateKey, slot, entry.id, entry.servings - 1)} style={styles.stepBtn}><Text style={{ color: colors.foreground, fontWeight: "800" }}>−</Text></Pressable>
                      <Text style={{ color: colors.foreground, fontWeight: "700", minWidth: 22, textAlign: "center" }}>{entry.servings}</Text>
                      <Pressable onPress={() => updateServings(selectedDateKey, slot, entry.id, entry.servings + 1)} style={styles.stepBtn}><Text style={{ color: colors.foreground, fontWeight: "800" }}>+</Text></Pressable>
                    </View>
                    <Pressable onPress={() => Linking.openURL(buildGoogleCalendarLink({ date: selectedDateKey, slot, recipeTitle: entry.recipeTitle, servings: entry.servings }))} style={[styles.smallBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <IconSymbol name="calendar" size={14} color={colors.foreground} />
                      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700" }}>Google Takvim</Text>
                    </Pressable>
                    <Pressable onPress={() => removeEntry(selectedDateKey, slot, entry.id)} style={[styles.smallBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <IconSymbol name="close" size={14} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {slotEntries.length < MAX_ENTRIES_PER_SLOT && (
                <Pressable onPress={() => { setPickerSlot(slot); setPickerSearch(""); }} style={[styles.addBtn, { borderColor: colors.primary }]}>
                  <IconSymbol name="add" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Tarif Seç{slotEntries.length > 0 ? ` (${slotEntries.length}/${MAX_ENTRIES_PER_SLOT})` : ""}</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <Pressable onPress={handleAddWeekToShopping} disabled={addingToShopping} style={[styles.weekShoppingBtn, { backgroundColor: colors.success }]}>
          {addingToShopping ? <ActivityIndicator color="#FFFFFF" /> : (
            <>
              <IconSymbol name="shopping-cart" size={18} color="#FFFFFF" />
              <Text style={styles.weekShoppingText}>Bu Haftayı Alışveriş Listesine Ekle</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {pickerSlot !== null && (
        <View style={[styles.pickerOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.background }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>{MEAL_SLOT_LABELS[pickerSlot]} için tarif seç</Text>
              <Pressable onPress={() => setPickerSlot(null)}><IconSymbol name="close" size={22} color={colors.foreground} /></Pressable>
            </View>
            <TextInput
              value={pickerSearch}
              onChangeText={setPickerSearch}
              placeholder="Tarif ara..."
              placeholderTextColor={colors.muted}
              style={[styles.pickerSearch, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            />
            {recipesQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={recipesQuery.data ?? []}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center", marginTop: 24 }}>Tarif bulunamadı.</Text>}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      addEntry(selectedDateKey, pickerSlot, { id: String(item.id), title: item.title }, item.servings || 2);
                      setPickerSlot(null);
                    }}
                    style={[styles.pickerItem, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.foreground, fontWeight: "700", flex: 1 }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{item.servings} kişilik</Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  weekNav: { flexDirection: "row", gap: 8 },
  navBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dayStrip: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  dayChip: { width: 52, height: 64, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", marginHorizontal: 4, gap: 2 },
  dayChipLabel: { fontSize: 11, fontWeight: "700" },
  dayChipNum: { fontSize: 17, fontWeight: "900" },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  selectedDateText: { paddingHorizontal: 20, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  slotList: { paddingHorizontal: 16, paddingBottom: 30, gap: 10 },
  slotCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  slotHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  entryBlock: { marginBottom: 10 },
  slotLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  slotRecipeTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  servingStepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 6 },
  stepBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12, paddingVertical: 12 },
  weekShoppingBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 8 },
  weekShoppingText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  pickerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end" },
  pickerSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: "80%", minHeight: "50%" },
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  pickerTitle: { fontSize: 17, fontWeight: "800" },
  pickerSearch: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12, fontSize: 14 },
  pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, gap: 8 },
});
