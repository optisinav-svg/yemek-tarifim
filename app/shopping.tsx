import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { useColors } from "@/hooks/use-colors";

type AisleCategory = "Sebze & Meyve" | "Et & Kasap" | "Süt & Şarküteri" | "Kiler & Baharat" | "Diğer";

function categorizeIngredient(name: string): AisleCategory {
  const lower = (name || "").toLowerCase();
  if (/domates|biber|soğan|sarımsak|patates|patlıcan|kabak|limon|maydanoz|dereotu|nane|havuç|salatalık|marul|ıspanak|meyve|elma|muz/.test(lower)) {
    return "Sebze & Meyve";
  }
  if (/et|kıyma|tavuk|göğüs|köfte|sucuk|salam|pastırma|balık/.test(lower)) {
    return "Et & Kasap";
  }
  if (/süt|yoğurt|peynir|kaşar|tereyağı|krema|yumurta|lor/.test(lower)) {
    return "Süt & Şarküteri";
  }
  if (/un|şeker|tuz|yağ|zeytinyağı|salça|pirinç|bulgur|makarna|mercimek|nohut|fasulye|baharat|pul biber|karabiber|kekik|kimyon|vanilya|kabartma tozu/.test(lower)) {
    return "Kiler & Baharat";
  }
  return "Diğer";
}

const AISLE_ORDER: AisleCategory[] = ["Sebze & Meyve", "Et & Kasap", "Süt & Şarküteri", "Kiler & Baharat", "Diğer"];

type ListRow = { type: "header"; title: string } | { type: "item"; item: { id: string; name: string; amount: string; checked: boolean } };

export default function ShoppingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { shoppingItems, toggleShoppingItem, clearCheckedShopping, addShoppingItem } = useAppStore();
  const [newItem, setNewItem] = useState("");
  const checkedCount = shoppingItems.filter((item) => item.checked).length;

  const groupedRows = useMemo<ListRow[]>(() => {
    const groups = new Map<AisleCategory, typeof shoppingItems>();
    for (const item of shoppingItems) {
      const aisle = categorizeIngredient(item.name);
      if (!groups.has(aisle)) groups.set(aisle, []);
      groups.get(aisle)!.push(item);
    }
    const rows: ListRow[] = [];
    for (const aisle of AISLE_ORDER) {
      const items = groups.get(aisle);
      if (!items || items.length === 0) continue;
      rows.push({ type: "header", title: aisle });
      for (const item of items) rows.push({ type: "item", item });
    }
    return rows;
  }, [shoppingItems]);

  const shareList = async () => {
    if (!shoppingItems.length) {
      Alert.alert("Liste boş", "Paylaşmak için önce alışveriş listene malzeme ekle.");
      return;
    }
    const groups = new Map<AisleCategory, typeof shoppingItems>();
    for (const item of shoppingItems) {
      const aisle = categorizeIngredient(item.name);
      if (!groups.has(aisle)) groups.set(aisle, []);
      groups.get(aisle)!.push(item);
    }
    const lines = ["Alınacaklar", ""];
    for (const aisle of AISLE_ORDER) {
      const items = groups.get(aisle);
      if (!items || items.length === 0) continue;
      lines.push(`${aisle}:`);
      for (const item of items) {
        lines.push(`${item.name}${item.amount ? ` - ${item.amount}` : ""}`);
      }
      lines.push("");
    }
    const message = lines.join("\n").trim();
    try {
      await Share.share({ title: "Alışveriş listem", message });
    } catch {
      Alert.alert("Paylaşım yapılamadı", "Listeyi daha sonra tekrar paylaşmayı deneyebilirsin.");
    }
  };

  const submitItem = () => {
    const name = newItem.trim();
    if (!name) return;
    addShoppingItem({ name, amount: "" });
    setNewItem("");
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}><Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow-left" size={21} color={colors.foreground} /></Pressable><View style={styles.heading}><Text style={[styles.kicker, { color: colors.primary }]}>MUTFAK YARDIMCISI</Text><Text style={[styles.title, { color: colors.foreground }]}>Alışveriş listem</Text></View><View style={styles.topActions}><Pressable onPress={shareList} disabled={shoppingItems.length === 0}><Text style={[styles.share, { color: shoppingItems.length ? colors.primary : colors.muted }]}>Paylaş</Text></Pressable><Pressable onPress={clearCheckedShopping} disabled={checkedCount === 0}><Text style={[styles.clear, { color: checkedCount ? colors.error : colors.muted }]}>Temizle</Text></Pressable></View></View>
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.summaryIcon, { backgroundColor: colors.success }]}><IconSymbol name="shopping-cart" size={21} color="#FFFFFF" /></View><View style={styles.summaryText}><Text style={[styles.summaryTitle, { color: colors.foreground }]}>{shoppingItems.length} malzeme hazır</Text><Text style={[styles.summarySubtitle, { color: colors.muted }]}>{checkedCount} ürün sepete girdi</Text></View><View style={[styles.progress, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { backgroundColor: colors.success, width: shoppingItems.length ? `${(checkedCount / shoppingItems.length) * 100}%` : "0%" }]} /></View></View>
      <View style={[styles.addWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput value={newItem} onChangeText={setNewItem} onSubmitEditing={submitItem} placeholder="Listeye malzeme ekle" placeholderTextColor={colors.muted} returnKeyType="done" style={[styles.input, { color: colors.foreground }]} /><Pressable onPress={submitItem} style={[styles.addButton, { backgroundColor: colors.primary }]}><IconSymbol name="add" size={20} color="#FFFFFF" /></Pressable></View>
      <FlatList data={groupedRows} keyExtractor={(row) => row.type === "header" ? `h-${row.title}` : row.item.id} contentContainerStyle={styles.content} ListEmptyComponent={<View style={styles.empty}><IconSymbol name="shopping-cart" size={35} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Listen henüz boş</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Bir tarifte "Alışveriş listesine ekle" düğmesine dokunarak başlayabilirsin.</Text></View>} renderItem={({ item: row }) => row.type === "header" ? (
        <Text style={[styles.aisleHeader, { color: colors.primary }]}>{row.title}</Text>
      ) : (
        <Pressable onPress={() => toggleShoppingItem(row.item.id)} style={[styles.item, { borderBottomColor: colors.border }]}><View style={[styles.checkbox, { borderColor: row.item.checked ? colors.success : colors.border, backgroundColor: row.item.checked ? colors.success : "transparent" }]}>{row.item.checked && <IconSymbol name="check" size={14} color="#FFFFFF" />}</View><Text style={[styles.itemName, { color: row.item.checked ? colors.muted : colors.foreground, textDecorationLine: row.item.checked ? "line-through" : "none" }]}>{row.item.name}</Text>{row.item.amount ? <Text style={[styles.itemAmount, { color: colors.muted }]}>{row.item.amount}</Text> : null}</Pressable>
      )} showsVerticalScrollIndicator={false} />
      <Pressable style={[styles.marketButton, { backgroundColor: colors.foreground }]}><IconSymbol name="check" size={18} color={colors.background} /><Text style={[styles.marketText, { color: colors.background }]}>Market moduna geç</Text></Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 20 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  heading: { flex: 1 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  share: { fontSize: 12, fontWeight: "800" },
  kicker: { fontSize: 10, letterSpacing: 1.3, fontWeight: "800" },
  title: { marginTop: 3, fontSize: 26, fontWeight: "900" },
  clear: { fontSize: 12, fontWeight: "800" },
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 18, padding: 14 },
  summaryIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  summaryText: { flex: 1 },
  summaryTitle: { fontSize: 14, fontWeight: "900" },
  summarySubtitle: { marginTop: 4, fontSize: 11, fontWeight: "600" },
  progress: { width: 44, height: 7, overflow: "hidden", borderRadius: 4 },
  progressFill: { height: "100%", borderRadius: 4 },
  addWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 15, marginTop: 17, paddingLeft: 14 },
  input: { flex: 1, minHeight: 48, fontSize: 13, fontWeight: "600" },
  addButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 11, marginRight: 6 },
  content: { paddingBottom: 90, paddingTop: 12 },
  aisleHeader: { fontSize: 13, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, marginBottom: 4 },
  item: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 55, borderBottomWidth: 1 },
  checkbox: { width: 23, height: 23, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 8 },
  itemName: { flex: 1, fontSize: 14, fontWeight: "700" },
  itemAmount: { fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingHorizontal: 22, paddingTop: 50 },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "900" },
  emptyText: { marginTop: 8, textAlign: "center", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  marketButton: { position: "absolute", left: 20, right: 20, bottom: 82, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 14 },
  marketText: { fontSize: 13, fontWeight: "900" },
});
