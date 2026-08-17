import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-store";
import { categories, countries, getRecipes } from "@/lib/recipe-data";

const categoryDescriptions: Record<string, string> = {
  Çorbalar: "Sıcak, doyurucu ve sofranın başlangıç lezzetleri",
  "Ana Yemek": "Günün merkezine yakışan ev yemekleri",
  Salatalar: "Taze, renkli ve hafif seçenekler",
  Tatlılar: "Çay saatine ve özel günlere tatlı dokunuşlar",
  "Hamur İşi": "Fırından ve tavadan çıkan nefis tarifler",
  İçecekler: "Serinleten ve içinizi ısıtan içecekler",
};

export default function GroupsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCountry, setSelectedCountry } = useAppStore();

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
        >
          <IconSymbol name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.kicker, { color: colors.primary }]}>KEŞFET</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Tarif grupları
          </Text>
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.countrySection}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text
                    style={[styles.sectionTitle, { color: colors.foreground }]}
                  >
                    Mutfak seç
                  </Text>
                  <Text
                    style={[styles.sectionSubtitle, { color: colors.muted }]}
                  >
                    Önce ülkeyi, sonra tarif grubunu seç
                  </Text>
                </View>
                <IconSymbol name="public" size={21} color={colors.muted} />
              </View>
              <View style={styles.countryRow}>
                {countries.map((country) => {
                  const active = selectedCountry === country.code;
                  return (
                    <Pressable
                      key={country.code}
                      onPress={() => setSelectedCountry(country.code)}
                      style={[
                        styles.countryCard,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${country.name} mutfağını seç`}
                    >
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <View style={styles.countryCopy}>
                        <Text
                          style={[
                            styles.countryName,
                            { color: active ? "#FFFFFF" : colors.foreground },
                          ]}
                        >
                          {country.name}
                        </Text>
                        <Text
                          style={[
                            styles.countrySubtitle,
                            {
                              color: active
                                ? "rgba(255,255,255,0.78)"
                                : colors.muted,
                            },
                          ]}
                        >
                          {country.subtitle}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View
              style={[
                styles.introCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[styles.introIcon, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="restaurant" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.introCopy}>
                <Text style={[styles.introTitle, { color: colors.foreground }]}>
                  Canın hangisini çekiyor?
                </Text>
                <Text style={[styles.introText, { color: colors.muted }]}>
                  Bir grup seçerek o gruptaki tarifleri keşfet.
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const count = getRecipes(selectedCountry, item.name).length;
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/group/[category]",
                  params: { category: item.name },
                })
              }
              style={({ pressed }) => [
                styles.categoryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} grubundaki tarifleri aç`}
            >
              <View
                style={[styles.categoryIcon, { backgroundColor: item.color }]}
              >
                <IconSymbol
                  name={item.icon as never}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.categoryCopy}>
                <Text
                  style={[styles.categoryName, { color: colors.foreground }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.categoryDescription, { color: colors.muted }]}
                >
                  {categoryDescriptions[item.name] ??
                    "Bu gruptaki tarifleri keşfet"}
                </Text>
                <Text style={[styles.categoryCount, { color: colors.primary }]}>
                  {count} tarif
                </Text>
              </View>
              <IconSymbol name="chevron-right" size={21} color={colors.muted} />
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 18,
    paddingBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
  },
  heading: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800" },
  title: { marginTop: 3, fontSize: 25, fontWeight: "900" },
  content: { paddingBottom: 42, gap: 11 },
  countrySection: { marginBottom: 20 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  sectionSubtitle: { marginTop: 3, fontSize: 11, fontWeight: "600" },
  countryRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  countryCard: {
    flex: 1,
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderRadius: 17,
    padding: 10,
  },
  countryFlag: { fontSize: 25 },
  countryCopy: { flex: 1 },
  countryName: { fontSize: 13, fontWeight: "900" },
  countrySubtitle: { marginTop: 3, fontSize: 9, fontWeight: "600" },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 14,
    padding: 15,
  },
  introIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  introCopy: { flex: 1 },
  introTitle: { fontSize: 15, fontWeight: "900" },
  introText: { marginTop: 4, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    minHeight: 95,
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
  },
  categoryIcon: {
    width: 53,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  categoryCopy: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: "900" },
  categoryDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  categoryCount: { marginTop: 5, fontSize: 11, fontWeight: "800" },
});
