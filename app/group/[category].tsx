import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { RecipeCard } from "@/components/recipe-card";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { getRecipes, type Recipe } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function CategoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { selectedCountry } = useAppStore();
  const selectedCategory = category && category !== "Tümü" ? category : undefined;
  const { data: serverRecipes } = trpc.recipes.list.useQuery({ countryCode: selectedCountry, category: selectedCategory });
  const localList = getRecipes(selectedCountry, selectedCategory);
  const serverList = serverRecipes && serverRecipes.length > 0 ? serverRecipes : [];
  const mergedMap = new Map();
  [...serverList, ...localList].forEach((r: any) => {
    if (r && r.id) mergedMap.set(r.id, r);
  });
  const list = Array.from(mergedMap.values());
  const count = list.length;

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Geri dön">
          <IconSymbol name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.kicker, { color: colors.primary }]}>TARİF GRUBU</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{category || "Tümü"}</Text>
        </View>
        <Pressable onPress={() => router.push("/search")} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Ara">
          <IconSymbol name="search" size={20} color={colors.foreground} />
        </Pressable>
      </View>
      <View style={[styles.filterNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.filterText, { color: colors.foreground }]}>{selectedCountry === "TR" ? "🇹🇷 Türkiye mutfağı" : "🌍 Tüm mutfaklar"}</Text>
        <Text style={[styles.filterCount, { color: colors.muted }]}>{count} tarif</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(item: any) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        renderItem={({ item }: { item: any }) => <RecipeCard recipe={item} onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: String(item.id) } })} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Bu kategoride henüz tarif yok.</Text>}
        showsVerticalScrollIndicator={false}
      />
      <Pressable onPress={() => router.push("/recipe/create")} style={[styles.addButton, { backgroundColor: colors.primary }]}>
        <IconSymbol name="add" size={21} color="#FFFFFF" />
        <Text style={styles.addText}>Tarif ekle</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  heading: { alignItems: "center" },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  filterNotice: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 10, marginBottom: 14 },
  filterText: { fontSize: 13, fontWeight: "700" },
  filterCount: { fontSize: 12, fontWeight: "600" },
  content: { paddingBottom: 110 },
  row: { justifyContent: "space-between", marginBottom: 16 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  addButton: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  addText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
