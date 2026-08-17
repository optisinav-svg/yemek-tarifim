import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getRecipes } from "@/lib/recipe-data";

export default function MyRecipesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: serverRecipes, isLoading } = trpc.recipes.list.useQuery();

  const allRecipes = serverRecipes && serverRecipes.length > 0 ? serverRecipes : getRecipes("TR");
  const myRecipes = allRecipes.filter((r) => {
    if (!r) return false;
    if (!isAuthenticated) return false;
    const authorName = "author" in r && r.author ? (r.author as any)?.name : null;
    return authorName === user?.name || String(r.id).startsWith("custom-");
  });

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Geri dön">
          <IconSymbol name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Benim Tariflerim</Text>
      </View>
      <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="restaurant" size={22} color={colors.primary} />
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Yayınladığın lezzetler</Text>
          <Text style={[styles.bannerSubtitle, { color: colors.muted }]}>Kendi hazırladığın ve toplulukla paylaştığın tarifler burada görünür.</Text>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Tarifleriniz yükleniyor...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.empty}>
          <IconSymbol name="person" size={36} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Oturum açmanız gerekiyor</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Kendi tariflerinizi görebilmek ve yönetebilmek için lütfen profil ekranından giriş yapın.</Text>
          <Pressable onPress={() => router.push("/profile")} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionButtonText}>Profilime Git</Text>
          </Pressable>
        </View>
      ) : myRecipes.length === 0 ? (
        <View style={styles.empty}>
          <IconSymbol name="restaurant" size={36} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz bir tarif eklemediniz</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Ana sayfadaki &quot;Tarif ekle&quot; düğmesini kullanarak ilk tarifinizi hemen yayınlayabilirsiniz.</Text>
          <Pressable onPress={() => router.push("/recipe/create")} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionButtonText}>Tarif Oluştur</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={myRecipes}
          keyExtractor={(item) => String(item?.id ?? Math.random())}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (!item) return null;
            const subtitle = "summary" in item ? item.summary : ("description" in item ? (item as any).description : "");
            const prep = "prepTime" in item ? (item as any).prepTime : "30 dk";
            return (
              <Pressable
                onPress={() => router.push(`/recipe/${item.id}`)}
                style={[styles.recipeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.recipeInfo}>
                  <Text numberOfLines={1} style={[styles.recipeTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text numberOfLines={2} style={[styles.recipeDesc, { color: colors.muted }]}>{subtitle}</Text>
                  <View style={styles.recipeMeta}>
                    <Text style={[styles.metaItem, { color: colors.primary }]}>{prep}</Text>
                    <Text style={[styles.metaItem, { color: colors.muted }]}>• {item.category || "Ana Yemek"}</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={19} color={colors.muted} />
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 16 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 24, fontWeight: "900" },
  banner: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 18 },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 15, fontWeight: "800" },
  bannerSubtitle: { fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32, paddingBottom: 64 },
  emptyTitle: { fontSize: 18, fontWeight: "900", textAlign: "center", marginTop: 8 },
  emptyText: { fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 18 },
  actionButton: { marginTop: 12, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  actionButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  list: { gap: 12, paddingBottom: 32 },
  recipeCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  recipeInfo: { flex: 1, gap: 4 },
  recipeTitle: { fontSize: 15, fontWeight: "800" },
  recipeDesc: { fontSize: 12, fontWeight: "600" },
  recipeMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  metaItem: { fontSize: 11, fontWeight: "700" },
});
