import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { CountryFlagIcon } from "@/lib/flag-icons";
import { useAppStore } from "@/lib/app-store";
import { formatTotalTime, type Recipe } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";

export function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const colors = useColors();
  const { savedRecipeIds, toggleSaved } = useAppStore();
  const isSaved = savedRecipeIds.includes(recipe.id);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title} tarifini aç`}
    >
      <View style={styles.imageWrap}>
        <Image source={recipe.image} contentFit="cover" transition={180} style={styles.image} />
        <Pressable
          onPress={() => toggleSaved(recipe.id)}
          style={[styles.saveButton, { backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Tarifi listeden çıkar" : "Tarifi listeme ekle"}
        >
          <IconSymbol name={isSaved ? "bookmark.fill" : "bookmark"} size={17} color={colors.primary} />
        </Pressable>
        <View style={[styles.timeBadge, { backgroundColor: "rgba(45,36,31,0.78)" }]}>
          <IconSymbol name="clock" size={13} color="#FFF8F0" />
          <Text style={styles.timeText}>{formatTotalTime(recipe)}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>{recipe.title}</Text>
        <View style={styles.categoryRow}>
          <CountryFlagIcon code={recipe.country} size={12} />
          <Text numberOfLines={1} style={[styles.category, { color: colors.muted }]}>{recipe.category}</Text>
        </View>
        <View style={styles.authorRow}>
          {recipe.authorImage ? (
            <Image source={{ uri: recipe.authorImage }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.success }]}>
              <Text style={styles.avatarText}>{recipe.authorAvatar}</Text>
            </View>
          )}
          <Text numberOfLines={1} style={[styles.author, { color: colors.muted }]}>{recipe.author}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, overflow: "hidden", borderRadius: 20, borderWidth: 1 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  imageWrap: { position: "relative", aspectRatio: 1.1 },
  image: { width: "100%", height: "100%" },
  saveButton: { position: "absolute", top: 10, right: 10, width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17 },
  timeBadge: { position: "absolute", bottom: 9, left: 9, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  timeText: { color: "#FFF8F0", fontSize: 11, fontWeight: "700" },
  body: { padding: 12 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: "800" },
  category: { fontSize: 12, fontWeight: "600" },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  avatar: { width: 23, height: 23, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  avatarImage: { width: 23, height: 23, borderRadius: 12 },
  avatarText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  author: { flex: 1, fontSize: 11, fontWeight: "600" },
});
