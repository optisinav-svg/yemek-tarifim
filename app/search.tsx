import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { RecipeCard } from "@/components/recipe-card";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { getRecipes, recipes, type Recipe } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";

const ingredientSuggestions = ["mercimek", "bulgur", "kıyma", "kabak", "yoğurt"];

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCountry } = useAppStore();
  const [query, setQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const results = useMemo(() => {
    const base = getRecipes(selectedCountry, undefined, query);
    if (selectedIngredients.length === 0) return base;
    return recipes.filter((recipe) => {
      if (selectedCountry !== "ALL" && recipe.country !== selectedCountry) return false;
      const names = recipe.ingredients.map((ingredient) => ingredient.name.toLocaleLowerCase("tr-TR"));
      return selectedIngredients.some((ingredient) => names.some((name) => name.includes(ingredient)));
    });
  }, [query, selectedCountry, selectedIngredients]);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((current) => current.includes(ingredient) ? current.filter((item) => item !== ingredient) : current.length >= 5 ? current : [...current, ingredient]);
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}><Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow-left" size={21} color={colors.foreground} /></Pressable><View><Text style={[styles.kicker, { color: colors.primary }]}>BUGÜN NE PİŞİRSEK?</Text><Text style={[styles.title, { color: colors.foreground }]}>Tarif ara</Text></View></View>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="search" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Yemek veya malzeme yaz" placeholderTextColor={colors.muted} autoFocus style={[styles.input, { color: colors.foreground }]} returnKeyType="search" /></View>
      <View style={styles.ingredientHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Elindeki malzemeler</Text><Text style={[styles.limit, { color: colors.muted }]}>{selectedIngredients.length}/5</Text></View>
      <View style={styles.chips}>{ingredientSuggestions.map((ingredient) => { const active = selectedIngredients.includes(ingredient); return <Pressable key={ingredient} onPress={() => toggleIngredient(ingredient)} style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: active ? "#FFFFFF" : colors.foreground }]}>{ingredient}</Text></Pressable>; })}</View>
      <View style={styles.resultHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Eşleşen tarifler</Text><Text style={[styles.limit, { color: colors.muted }]}>{results.length} sonuç</Text></View>
      <FlatList<Recipe> data={results} keyExtractor={(item) => item.id} numColumns={2} columnWrapperStyle={styles.row} contentContainerStyle={styles.content} renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: item.id } })} />} ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Aramanıza uygun tarif bulunamadı.</Text>} showsVerticalScrollIndicator={false} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 19 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800" },
  title: { marginTop: 3, fontSize: 26, fontWeight: "900" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, height: 54, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15 },
  input: { flex: 1, fontSize: 14, fontWeight: "600" },
  ingredientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 25, marginBottom: 11 },
  sectionTitle: { fontSize: 18, fontWeight: "900" },
  limit: { fontSize: 12, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 12, fontWeight: "800" },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 26, marginBottom: 12 },
  row: { gap: 11, marginBottom: 11 },
  content: { paddingBottom: 40 },
  empty: { paddingVertical: 45, textAlign: "center", fontSize: 14 },
});
