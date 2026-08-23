import { useState, useMemo } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { useColors } from "@/hooks/use-colors";
import { categories, countries, formatTotalTime, type Recipe, type CountryCode } from "@/lib/recipe-data";
import { CountryFlagIcon } from "@/lib/flag-icons";
import { trpc } from "@/lib/trpc";
import { adaptServerRecipe } from "@/lib/server-recipe-adapter";
import { useRouter } from "expo-router";

function normalizeIngredientName(raw: string) {
  return raw
    .replace(/\([^)]*\)/g, "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .filter(Boolean)
    .slice(-2) // "yeşil sivri biber" gibi uzun tariflerde son 1-2 kelimeye indir, çok özgün olmayanları grupla
    .join(" ");
}

function displayCase(name: string) {
  return name.charAt(0).toLocaleUpperCase("tr-TR") + name.slice(1);
}

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCountry, setSelectedCountry, savedRecipeIds, toggleSaved } = useAppStore();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [filterCountry, setFilterCountry] = useState<CountryCode | "ALL">(selectedCountry);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [sortByMatch, setSortByMatch] = useState(false);

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const recipesQuery = trpc.recipes.list.useQuery({
    countryCode: filterCountry === "ALL" ? undefined : filterCountry,
    category: selectedCategory === "Tümü" ? undefined : selectedCategory,
    search: query.trim() || undefined,
  });

  // Malzeme önerileri için, mevcut arama/kategori filtresinden bağımsız
  // olarak TÜM tarifleri kullanıyoruz; amaç ne yazdığına göre değil,
  // veritabanındaki tüm tariflere göre öneri sunmak.
  const allRecipesForIngredientsQuery = trpc.recipes.list.useQuery();

  const suggestedIngredients = useMemo(() => {
    const allRecipes = (allRecipesForIngredientsQuery.data ?? []).map(adaptServerRecipe);
    const selectedNormalized = selectedIngredients.map((s) => s.toLocaleLowerCase("tr-TR"));

    // 1. Adım: seçili malzemelerin HEPSİNİ içeren tarifleri bul.
    const matchingRecipes = selectedNormalized.length === 0
      ? allRecipes
      : allRecipes.filter((recipe) => {
          const recipeIngs = recipe.ingredients.map((i) => normalizeIngredientName(i.name));
          return selectedNormalized.every((sel) => recipeIngs.some((ri) => ri.includes(sel) || sel.includes(ri)));
        });

    // 2. Adım: bu tariflerdeki malzemeleri say (zaten seçilmiş olanlar hariç).
    const frequency = new Map<string, number>();
    for (const recipe of matchingRecipes) {
      const seenInThisRecipe = new Set<string>();
      for (const ingredient of recipe.ingredients) {
        const normalized = normalizeIngredientName(ingredient.name);
        if (!normalized || seenInThisRecipe.has(normalized)) continue;
        if (selectedNormalized.some((sel) => normalized.includes(sel) || sel.includes(normalized))) continue;
        seenInThisRecipe.add(normalized);
        frequency.set(normalized, (frequency.get(normalized) ?? 0) + 1);
      }
    }

    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => displayCase(name));
  }, [allRecipesForIngredientsQuery.data, selectedIngredients]);

  const results = useMemo(() => {
    const baseRecipes = (recipesQuery.data ?? []).map(adaptServerRecipe);

    let filtered = baseRecipes;

    if (selectedIngredients.length > 0) {
      filtered = filtered.filter((recipe) => {
        const recipeIngs = recipe.ingredients.map((i) => i.name.toLowerCase());
        return selectedIngredients.some((sel) =>
          recipeIngs.some((ri) => ri.includes(sel.toLowerCase()))
        );
      });
    }

    if (sortByMatch && selectedIngredients.length > 0) {
      return [...filtered].sort((a, b) => {
        const scoreA = a.ingredients.filter((i) =>
          selectedIngredients.some((sel) => i.name.toLowerCase().includes(sel.toLowerCase()))
        ).length;
        const scoreB = b.ingredients.filter((i) =>
          selectedIngredients.some((sel) => i.name.toLowerCase().includes(sel.toLowerCase()))
        ).length;
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [recipesQuery.data, selectedIngredients, sortByMatch]);

  return (
    <ScreenContainer className="px-5 pt-4" edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>AKILLI TARİF BULUCU</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Tarif ve Malzeme Ara</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="search" size={20} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder="Yemek adı, malzeme veya mutfak ara..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <IconSymbol name="close" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Pressable
            onPress={() => setFilterCountry("ALL")}
            style={[styles.filterChip, { backgroundColor: filterCountry === "ALL" ? colors.primary : colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.filterChipText, { color: filterCountry === "ALL" ? "#FFFFFF" : colors.foreground }]}>Tüm Ülkeler</Text>
          </Pressable>
          {countries.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => setFilterCountry(c.code)}
              style={[styles.filterChip, { backgroundColor: filterCountry === c.code ? colors.primary : colors.surface, borderColor: colors.border }]}
            >
              <CountryFlagIcon code={c.code} size={16} />
              <Text style={[styles.filterChipText, { color: filterCountry === c.code ? "#FFFFFF" : colors.foreground }]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {["Tümü", ...categories.map((cat) => cat.name)].map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.filterChip, { backgroundColor: selectedCategory === cat ? colors.foreground : colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.filterChipText, { color: selectedCategory === cat ? colors.background : colors.foreground }]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.ingredientSection}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>Elimde bu malzemeler var (Eşleştir):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {[...selectedIngredients, ...suggestedIngredients].map((ing) => {
            const active = selectedIngredients.includes(ing);
            return (
              <Pressable
                key={ing}
                onPress={() => toggleIngredient(ing)}
                style={[styles.ingChip, { backgroundColor: active ? colors.primary + "22" : colors.surface, borderColor: active ? colors.primary : colors.border }]}
              >
                <Text style={[styles.ingText, { color: active ? colors.primary : colors.foreground }]}>
                  {active ? "✓ " : "+ "} {ing}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {selectedIngredients.length > 0 && (
        <View style={styles.sortBar}>
          <Text style={[styles.countText, { color: colors.muted }]}>{results.length} tarif bulundu</Text>
          <Pressable
            onPress={() => setSortByMatch(!sortByMatch)}
            style={[styles.sortBtn, { backgroundColor: sortByMatch ? colors.primary : colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.sortBtnText, { color: sortByMatch ? "#FFFFFF" : colors.foreground }]}>
              {sortByMatch ? "Eşleşme Oranına Göre Sıralı" : "Eşleşmeye Göre Sırala"}
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="search" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aradığınız kriterde tarif bulunamadı</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Farklı anahtar kelimeler deneyebilir veya malzeme seçimlerini esnetebilirsiniz.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSaved = savedRecipeIds.includes(item.id);
          return (
            <Pressable
              onPress={() => router.push(`/recipe/${item.id}` as any)}
              style={[styles.recipeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.flagBadge}>
                  <CountryFlagIcon code={item.country} size={16} />
                  <Text style={[styles.countryName, { color: colors.muted }]}>{item.countryName}</Text>
                </View>
                <Pressable onPress={() => toggleSaved(item.id)} style={styles.saveBtn}>
                  <IconSymbol name={isSaved ? "bookmark.fill" : "bookmark"} size={18} color={isSaved ? colors.primary : colors.muted} />
                </Pressable>
              </View>
              <Text style={[styles.recipeTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.recipeSummary, { color: colors.muted }]} numberOfLines={2}>{item.summary}</Text>
              <View style={styles.recipeFooter}>
                <Text style={[styles.metaText, { color: colors.muted }]}>⏱ {formatTotalTime(item)}</Text>
                <Text style={[styles.metaText, { color: colors.muted }]}>🍽 {item.servings} porsiyon</Text>
                <Text style={[styles.catBadge, { color: colors.primary }]}>{item.category}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 10, paddingBottom: 12 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, fontWeight: "600", padding: 0 },
  filterSection: { marginBottom: 10 },
  chipRow: { gap: 8, paddingVertical: 4 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  chipFlag: { fontSize: 14 },
  filterChipText: { fontSize: 13, fontWeight: "700" },
  ingredientSection: { marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  ingChip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  ingText: { fontSize: 12, fontWeight: "700" },
  sortBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  countText: { fontSize: 12, fontWeight: "600" },
  sortBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  sortBtnText: { fontSize: 11, fontWeight: "700" },
  resultsList: { gap: 12, paddingBottom: 32, paddingTop: 4 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "900", textAlign: "center" },
  emptySubtitle: { fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 18 },
  recipeCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  flagBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  flag: { fontSize: 16 },
  countryName: { fontSize: 12, fontWeight: "700" },
  saveBtn: { padding: 4 },
  recipeTitle: { fontSize: 17, fontWeight: "900" },
  recipeSummary: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  recipeFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  metaText: { fontSize: 12, fontWeight: "600" },
  catBadge: { fontSize: 12, fontWeight: "800" },
});
