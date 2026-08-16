import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { formatTotalTime, getRecipe } from "@/lib/recipe-data";
import { formatIngredient } from "@/lib/recipe-utils";
import { useColors } from "@/hooks/use-colors";

export default function RecipeDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const recipe = getRecipe(id || "");
  const { savedRecipeIds, toggleSaved, addRecipeToShopping } = useAppStore();
  const [servings, setServings] = useState(recipe?.servings ?? 4);

  const ingredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ingredient) => {
      return formatIngredient(ingredient, servings, recipe.servings);
    });
  }, [recipe, servings]);

  if (!recipe) {
    return <ScreenContainer className="px-5 items-center justify-center"><Text style={[styles.title, { color: colors.foreground }]}>Tarif bulunamadı.</Text></ScreenContainer>;
  }

  const saved = savedRecipeIds.includes(recipe.id);
  const totalTime = formatTotalTime(recipe);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <Image source={recipe.image} contentFit="cover" style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroActions}>
            <Pressable onPress={() => router.back()} style={styles.heroButton} accessibilityLabel="Geri dön"><IconSymbol name="arrow-left" size={21} color="#FFFFFF" /></Pressable>
            <View style={styles.heroActionGroup}>
              <Pressable onPress={() => toggleSaved(recipe.id)} style={styles.heroButton} accessibilityLabel={saved ? "Tarifi listeden çıkar" : "Tarifi listeme ekle"}><IconSymbol name={saved ? "bookmark.fill" : "bookmark"} size={20} color="#FFFFFF" /></Pressable>
              <Pressable onPress={() => router.push("/shopping")} style={styles.heroButton} accessibilityLabel="Alışveriş listesi"><IconSymbol name="shopping-cart" size={20} color="#FFFFFF" /></Pressable>
            </View>
          </View>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroKicker}>{recipe.flag} {recipe.category}</Text>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: colors.success }]}><Text style={styles.avatarText}>{recipe.authorAvatar}</Text></View>
            <View style={styles.authorInfo}><Text style={[styles.authorName, { color: colors.foreground }]}>{recipe.author}</Text><Text style={[styles.authorMeta, { color: colors.muted }]}>Tarif sahibi · Türkiye</Text></View>
            <Pressable onPress={() => router.push("/search")}><IconSymbol name="more" size={23} color={colors.muted} /></Pressable>
          </View>

          <Text style={[styles.summary, { color: colors.muted }]}>{recipe.summary}</Text>

          <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Stat icon="timer" label="Hazırlama" value={`${recipe.prepMinutes} dk`} colors={colors} />
            <Stat icon="restaurant" label="Pişirme" value={`${recipe.cookMinutes} dk`} colors={colors} />
            <Stat icon="clock" label="Toplam" value={totalTime} colors={colors} />
          </View>

          <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Malzemeler</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>Porsiyon</Text></View>
          <View style={[styles.servingControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.servingLabel, { color: colors.muted }]}>Kişilik</Text>
            <View style={styles.servingActions}>
              <Pressable onPress={() => setServings((value) => Math.max(1, value - 1))} style={[styles.circleButton, { borderColor: colors.border }]}><IconSymbol name="remove" size={17} color={colors.foreground} /></Pressable>
              <Text style={[styles.servingValue, { color: colors.foreground }]}>{servings}</Text>
              <Pressable onPress={() => setServings((value) => Math.min(20, value + 1))} style={[styles.circleButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}><IconSymbol name="add" size={17} color="#FFFFFF" /></Pressable>
            </View>
          </View>
          <View style={[styles.ingredientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {ingredients.map((ingredient, index) => <View key={`${ingredient}-${index}`} style={[styles.ingredientRow, index !== ingredients.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text style={[styles.ingredientText, { color: colors.foreground }]}>{ingredient}</Text></View>)}
          </View>
          <Pressable onPress={() => addRecipeToShopping(recipe, servings)} style={[styles.shoppingButton, { backgroundColor: colors.success }]}><IconSymbol name="shopping-cart" size={19} color="#FFFFFF" /><Text style={styles.actionText}>Alışveriş listesine ekle</Text></Pressable>

          <View style={[styles.tipCard, { backgroundColor: "#FFF0DD" }]}><Text style={styles.tipEmoji}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.tipTitle, { color: colors.foreground }]}>Püf noktası</Text><Text style={[styles.tipText, { color: colors.muted }]}>{recipe.tip}</Text></View></View>

          <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yapılışı</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>{recipe.steps.length} adım</Text></View>
          <View style={styles.steps}>
            {recipe.steps.map((step, index) => <View key={step} style={styles.stepRow}><View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text></View>)}
          </View>

          <Pressable onPress={() => router.push({ pathname: "/cooking/[id]", params: { id: recipe.id } })} style={[styles.cookButton, { backgroundColor: colors.foreground }]}><IconSymbol name="play" size={19} color={colors.background} /><Text style={[styles.cookButtonText, { color: colors.background }]}>Pişirme modunu aç</Text></Pressable>
          <Pressable onPress={() => router.push("/search")} style={[styles.shareButton, { borderColor: colors.border }]}><IconSymbol name="share" size={18} color={colors.foreground} /><Text style={[styles.shareText, { color: colors.foreground }]}>Tarifi paylaş</Text></Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({ icon, label, value, colors }: { icon: "timer" | "restaurant" | "clock"; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.stat}><IconSymbol name={icon} size={18} color={colors.primary} /><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 46 },
  title: { fontSize: 24, fontWeight: "900" },
  heroWrap: { height: 355, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,14,10,0.28)" },
  heroActions: { position: "absolute", top: 18, left: 18, right: 18, flexDirection: "row", justifyContent: "space-between" },
  heroActionGroup: { flexDirection: "row", gap: 9 },
  heroButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(45,36,31,0.55)" },
  heroTitleWrap: { position: "absolute", left: 20, right: 20, bottom: 25 },
  heroKicker: { color: "rgba(255,248,240,0.82)", fontSize: 12, fontWeight: "700" },
  heroTitle: { marginTop: 5, color: "#FFFFFF", fontSize: 33, lineHeight: 38, fontWeight: "900", letterSpacing: -0.6 },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  avatarText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: "800" },
  authorMeta: { marginTop: 3, fontSize: 11, fontWeight: "600" },
  summary: { marginTop: 17, fontSize: 15, lineHeight: 23, fontWeight: "600" },
  stats: { flexDirection: "row", justifyContent: "space-around", borderWidth: 1, borderRadius: 18, marginTop: 20, paddingVertical: 15 },
  stat: { alignItems: "center", gap: 4 },
  statLabel: { fontSize: 10, fontWeight: "600" },
  statValue: { fontSize: 13, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "900" },
  sectionHint: { fontSize: 12, fontWeight: "700" },
  servingControl: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 15, padding: 10, paddingLeft: 14 },
  servingLabel: { fontSize: 12, fontWeight: "700" },
  servingActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  circleButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 16 },
  servingValue: { minWidth: 22, textAlign: "center", fontSize: 16, fontWeight: "900" },
  ingredientCard: { marginTop: 10, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14 },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  ingredientText: { flex: 1, fontSize: 13, fontWeight: "600" },
  shoppingButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, marginTop: 11, paddingVertical: 13 },
  actionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  tipCard: { flexDirection: "row", gap: 12, borderRadius: 17, marginTop: 24, padding: 15 },
  tipEmoji: { color: "#D4862E", fontSize: 20, fontWeight: "900" },
  tipTitle: { fontSize: 13, fontWeight: "900" },
  tipText: { marginTop: 4, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  steps: { gap: 16 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepNumber: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  stepNumberText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  cookButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, marginTop: 30, paddingVertical: 15 },
  cookButtonText: { fontSize: 14, fontWeight: "900" },
  shareButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 16, marginTop: 10, paddingVertical: 14 },
  shareText: { fontSize: 13, fontWeight: "800" },
});
