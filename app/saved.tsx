import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { RecipeCard } from "@/components/recipe-card";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import type { Recipe } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { adaptServerRecipe } from "@/lib/server-recipe-adapter";

export default function SavedScreen() {
  const colors = useColors();
  const router = useRouter();
  const { savedRecipeIds } = useAppStore();
  const recipesQuery = trpc.recipes.list.useQuery();
  const saved = (recipesQuery.data ?? [])
    .filter((recipe) => savedRecipeIds.includes(String(recipe.id)))
    .map(adaptServerRecipe);
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}><Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow-left" size={21} color={colors.foreground} /></Pressable><View><Text style={[styles.kicker, { color: colors.primary }]}>KAYDETTİKLERİM</Text><Text style={[styles.title, { color: colors.foreground }]}>Listemdeki tarifler</Text></View></View>
      <FlatList<Recipe> data={saved} keyExtractor={(item) => item.id} numColumns={2} columnWrapperStyle={styles.row} contentContainerStyle={styles.content} renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: item.id } })} />} ListEmptyComponent={<View style={styles.empty}><IconSymbol name="bookmark" size={36} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Listen henüz boş</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Beğendiğin tariflerin üzerindeki kaydet simgesine dokunarak onları burada toplayabilirsin.</Text></View>} showsVerticalScrollIndicator={false} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 20 }, backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 }, kicker: { fontSize: 10, letterSpacing: 1.3, fontWeight: "800" }, title: { marginTop: 3, fontSize: 24, fontWeight: "900" }, row: { gap: 11, marginBottom: 11 }, content: { paddingBottom: 40 }, empty: { alignItems: "center", paddingHorizontal: 22, paddingTop: 65 }, emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "900" }, emptyText: { marginTop: 8, textAlign: "center", fontSize: 12, lineHeight: 18, fontWeight: "600" } });
