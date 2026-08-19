import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { useColors } from "@/hooks/use-colors";

type AisleCategory = "Sebze & Meyve" | "Et & Kasap" | "Süt & Şarküteri" | "Kiler & Baharat" | "Diğer";

type ShoppingItemType = {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
};

function categorizeIngredient(name: string): AisleCategory {
  const lower = (name || "").toLowerCase();
  if (/domates|biber|soğan|sarımsak|patates|patlıcan|kabak|limon|maydanoz|dereotu|nane|havuç|salatalık|marul|ıspanak|meyve|elma|muz/.test(lower)) {
    return "Sebze & Meyve";
  }
  if (/et|kıyma|tavuk|göğüs|köfte|sucuk|salam|pastırma|balık/.test(lower)) {
    return "Et & Kasap";
  }
  if (/süt|yoğurt|peynir|kaşar|tereyağı|krema|yumurta|lor/.test(lower)) {
    return "Süt & Şarküteri";
  }
  if (/un|şeker|tuz|yağ|zeytinyağı|salça|pirinç|bulgur|makarna|mercimek|nohut|fasulye|baharat|pul biber|karabiber|kekik|kimyon|vanilya|kabartma tozu/.test(lower)) {
    return "Kiler & Baharat";
  }
  return "Diğer";
}

const aisleIcons: Record<AisleCategory, { icon: string; color: string }> = {
  "Sebze & Meyve": { icon: "restaurant", color: "#22C55E" },
  "Et & Kasap": { icon: "restaurant", color: "#EF4444" },
  "Süt & Şarküteri": { icon: "restaurant", color: "#F59E0B" },
  "Kiler & Baharat": { icon: "restaurant", color: "#0A7EA4" },
  "Diğer": { icon: "shopping-cart", color: "#687076" },
};

export default function ShoppingScreen() {
  const colors = useColors();
  const { shoppingItems, toggleShoppingItem, clearCheckedShopping } = useAppStore();
  const [collapsedAisles, setCollapsedAisles] = useState<Record<string, boolean>>({});

  const grouped: Record<AisleCategory, ShoppingItemType[]> = {
    "Sebze & Meyve": [],
    "Et & Kasap": [],
    "Süt & Şarküteri": [],
    "Kiler & Baharat": [],
    "Diğer": [],
  };

  shoppingItems.forEach((item: ShoppingItemType) => {
    const aisle = categorizeIngredient(item.name);
    grouped[aisle].push(item);
  });

  const activeAisles = (Object.keys(grouped) as AisleCategory[]).filter((aisle) => grouped[aisle].length > 0);

  const toggleAisle = (aisle: string) => {
    setCollapsedAisles((prev) => ({ ...prev, [aisle]: !prev[aisle] }));
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>MARKET HAZIRLIĞI</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Alışveriş Listesi</Text>
        </View>
        {shoppingItems.length > 0 && (
          <Pressable onPress={() => clearCheckedShopping()} style={[styles.clearButton, { borderColor: colors.border }]} accessibilityLabel="Alınanları temizle">
            <Text style={[styles.clearText, { color: colors.error }]}>Alınanları Temizle</Text>
          </Pressable>
        )}
      </View>

      {shoppingItems.length === 0 ? (
        <View style={styles.empty}>
          <IconSymbol name="shopping-cart" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Alışveriş listeniz boş</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Tarif detaylarından &quot;Alışveriş listesine ekle&quot; diyerek malzemeleri buraya otomatik toplayabilirsiniz.</Text>
        </View>
      ) : (
        <FlatList
          data={activeAisles}
          keyExtractor={(aisle) => aisle}
          contentContainerStyle={styles.list}
          renderItem={({ item: aisle }) => {
            const items = grouped[aisle];
            const isCollapsed = collapsedAisles[aisle];
            const info = aisleIcons[aisle];
            const completedCount = items.filter((i: ShoppingItemType) => i.checked).length;

            return (
              <View style={[styles.aisleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Pressable onPress={() => toggleAisle(aisle)} style={styles.aisleHeader}>
                  <View style={[styles.aisleIconWrap, { backgroundColor: info.color + "18" }]}>
                    <IconSymbol name={info.icon as any} size={18} color={info.color} />
                  </View>
                  <View style={styles.aisleTitleWrap}>
                    <Text style={[styles.aisleTitle, { color: colors.foreground }]}>{aisle}</Text>
                    <Text style={[styles.aisleSub, { color: colors.muted }]}>
                      {completedCount}/{items.length} alındı
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                </Pressable>

                {!isCollapsed && (
                  <View style={styles.itemsList}>
                    {items.map((item: ShoppingItemType) => (
                      <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                        <Pressable
                          onPress={() => toggleShoppingItem(item.id)}
                          style={[styles.checkbox, { borderColor: item.checked ? colors.success : colors.border, backgroundColor: item.checked ? colors.success : "transparent" }]}
                        >
                          {item.checked && <IconSymbol name="check" size={13} color="#FFFFFF" />}
                        </Pressable>
                        <View style={styles.itemTextWrap}>
                          <Text style={[styles.itemName, { color: colors.foreground, textDecorationLine: item.checked ? "line-through" : "none", opacity: item.checked ? 0.6 : 1 }]}>
                            {item.name}
                          </Text>
                          {item.amount && (
                            <Text style={[styles.itemAmount, { color: colors.muted }]}>
                              {item.amount}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  clearButton: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  clearText: { fontSize: 12, fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32, paddingBottom: 64 },
  emptyTitle: { fontSize: 18, fontWeight: "900", textAlign: "center", marginTop: 8 },
  emptyText: { fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 18 },
  list: { gap: 14, paddingBottom: 32 },
  aisleSection: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  aisleHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  aisleIconWrap: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  aisleTitleWrap: { flex: 1 },
  aisleTitle: { fontSize: 15, fontWeight: "800" },
  aisleSub: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  itemsList: { paddingHorizontal: 14, paddingBottom: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderTopWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  itemTextWrap: { flex: 1, flexDirection: "row", alignItems: "baseline", gap: 8 },
  itemName: { fontSize: 14, fontWeight: "700" },
  itemAmount: { fontSize: 12, fontWeight: "600" },
});
