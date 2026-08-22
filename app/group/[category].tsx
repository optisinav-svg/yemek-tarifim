import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { RecipeCard } from "@/components/recipe-card";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { categories, type Recipe } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { adaptServerRecipe } from "@/lib/server-recipe-adapter";

export default function CategoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { selectedCountry } = useAppStore();
  const selectedCategory = category && category !== "Tümü" ? category : undefined;
  const recipesQuery = trpc.recipes.list.useQuery({
    countryCode: selectedCountry === "ALL" ? undefined : selectedCountry,
    category: selectedCategory,
  });
  const list = (recipesQuery.data ?? []).map(adaptServerRecipe);
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
      <FlatList<Recipe>
        data={list}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: item.id } })} />}
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
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 18 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  heading: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800" },
  title: { marginTop: 3, fontSize: 25, fontWeight: "900" },
  filterNotice: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 15 },
  filterText: { fontSize: 13, fontWeight: "800" },
  filterCount: { fontSize: 12, fontWeight: "700" },
  content: { paddingBottom: 100 },
  row: { gap: 11, marginBottom: 11 },
  empty: { paddingTop: 50, textAlign: "center", fontSize: 14 },
  addButton: { position: "absolute", right: 20, bottom: 82, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 12 },
  addText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
