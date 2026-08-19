import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { RecipeCard } from "@/components/recipe-card";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { categories, getCategories, countries, getRecipes, getCategoryCount, type Recipe } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";
import { useMemberGate } from "@/components/member-gate";

function Header({ onProfile, onSearch }: { onProfile: () => void; onSearch: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>BUGÜN NE PİŞİRSEK?</Text>
        <Text style={[styles.brand, { color: colors.foreground }]}>Yemek Tarifim</Text>
      </View>
      <Pressable onPress={onProfile} style={[styles.profileButton, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Profil ve ayarlar">
        <IconSymbol name="person" size={21} color={colors.foreground} />
      </Pressable>
      <Pressable onPress={onSearch} style={[styles.searchButton, { backgroundColor: colors.primary }]} accessibilityLabel="Tarif ara">
        <IconSymbol name="search" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function CountrySelector() {
  const colors = useColors();
  const { selectedCountry, setSelectedCountry } = useAppStore();
  return (
    <View style={styles.countrySection}>
      <View style={styles.sectionHeading}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mutfak keşfet</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Bir ülke seç, sofraya ilham kat</Text>
        </View>
        <IconSymbol name="tune" size={20} color={colors.muted} />
      </View>
      <View style={styles.countryRow}>
        {countries.map((country) => {
          const active = selectedCountry === country.code;
          return (
            <Pressable
              key={country.code}
              onPress={() => setSelectedCountry(country.code)}
              style={[styles.countryCard, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={`${country.name} mutfağını seç`}
            >
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <View style={styles.countryText}>
                <Text style={[styles.countryName, { color: active ? "#FFFFFF" : colors.foreground }]}>{country.name}</Text>
                <Text numberOfLines={1} style={[styles.countrySubtitle, { color: active ? "rgba(255,255,255,0.78)" : colors.muted }]}>{country.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CategoryStrip({ selectedCountry, onCategory, onSeeAll }: { selectedCountry: any; onCategory: (category: string) => void; onSeeAll: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.categorySection}>
      <View style={styles.sectionHeading}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tarif grupları</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Canın hangisini çekiyor?</Text>
        </View>
        <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="Tüm tarif gruplarını gör"><Text style={[styles.seeAll, { color: colors.primary }]}>Tümünü gör</Text></Pressable>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={getCategories(selectedCountry)}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          return (
            <Pressable onPress={() => onCategory(item.name)} style={[styles.categoryPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                <IconSymbol name={item.icon as never} size={19} color="#FFFFFF" />
              </View>
              <Text style={[styles.categoryName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.categoryCount, { color: colors.muted }]}>{getCategoryCount(item.name, selectedCountry)} tarif</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCountry } = useAppStore();
  const { requireMember, authModal } = useMemberGate();
  const latestRecipes = getRecipes(selectedCountry);

  const renderHeader = () => (
    <View>
      <Header onProfile={() => router.push("/profile")} onSearch={() => router.push("/search")} />
      <Pressable onPress={() => router.push("/search")} style={[styles.searchField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="search" size={20} color={colors.muted} />
        <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>Yemek veya malzeme ara</Text>
        <View style={[styles.searchShortcut, { backgroundColor: colors.background }]}><Text style={[styles.searchShortcutText, { color: colors.muted }]}>⌘ K</Text></View>
      </Pressable>
      <CountrySelector />
      <CategoryStrip selectedCountry={selectedCountry} onCategory={(category) => router.push({ pathname: "/group/[category]", params: { category } })} onSeeAll={() => router.push("/groups")} />
      <View style={styles.latestHeading}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yeni eklenenler</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Türkiye mutfağından taptaze tarifler</Text>
        </View>
        <Pressable onPress={() => router.push("/group/Tümü")}><Text style={[styles.seeAll, { color: colors.primary }]}>Tümü</Text></Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <FlatList<Recipe>
        data={latestRecipes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.recipeRow}
        contentContainerStyle={styles.feedContent}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: item.id } })} />}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>Bu seçime uygun henüz tarif bulunmuyor.</Text>}
        showsVerticalScrollIndicator={false}
      />
      <Pressable onPress={() => requireMember(() => router.push("/recipe/create"))} style={[styles.fab, { backgroundColor: colors.primary }]} accessibilityLabel="Yeni tarif ekle">
        <IconSymbol name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Tarif ekle</Text>
      </Pressable>
      {authModal}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  feedContent: { paddingTop: 18, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "flex-end", gap: 9, paddingBottom: 18 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: "800" },
  brand: { marginTop: 4, fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  profileButton: { marginLeft: "auto", width: 41, height: 41, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 1 },
  searchButton: { width: 41, height: 41, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  searchField: { flexDirection: "row", alignItems: "center", gap: 10, height: 53, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15 },
  searchPlaceholder: { flex: 1, fontSize: 14, fontWeight: "600" },
  searchShortcut: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  searchShortcutText: { fontSize: 11, fontWeight: "700" },
  countrySection: { marginTop: 27 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: "800" },
  sectionSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "600" },
  countryRow: { flexDirection: "row", gap: 10, marginTop: 13 },
  countryCard: { flex: 1, minHeight: 78, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, borderWidth: 1, padding: 12 },
  countryFlag: { fontSize: 28 },
  countryText: { flex: 1 },
  countryName: { fontSize: 14, fontWeight: "800" },
  countrySubtitle: { marginTop: 4, fontSize: 10, fontWeight: "600" },
  categorySection: { marginTop: 27 },
  categoryList: { gap: 10, paddingTop: 13 },
  categoryPill: { width: 111, minHeight: 112, borderRadius: 17, borderWidth: 1, padding: 10 },
  categoryIcon: { width: 31, height: 31, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  categoryName: { marginTop: 11, fontSize: 12, fontWeight: "800" },
  categoryCount: { marginTop: 3, fontSize: 10, fontWeight: "600" },
  latestHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 29, marginBottom: 13 },
  seeAll: { fontSize: 12, fontWeight: "800" },
  recipeRow: { gap: 11, marginBottom: 11 },
  emptyText: { paddingVertical: 40, textAlign: "center", fontSize: 14 },
  fab: { position: "absolute", right: 20, bottom: 86, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, elevation: 4, shadowColor: "#2D241F", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  fabText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
