import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-store";
import { trpc } from "@/lib/trpc";
import { useMemberGate } from "@/components/member-gate";
import { categories, countries, getRecipes, type Recipe } from "@/lib/recipe-data";

const categoryDescriptions: Record<string, string> = {
  Çorbalar: "Sıcak, doyurucu ve sofranın başlangıç lezzetleri",
  "Ana Yemek": "Günün merkezine yakışan ev yemekleri",
  Salatalar: "Taze, renkli ve hafif seçenekler",
  Tatlılar: "Çay saatine ve özel günlere tatlı dokunuşlar",
  "Hamur İşi": "Fırından ve tavadan çıkan nefis tarifler",
  İçecekler: "Serinleten ve içinizi ısıtan içecekler",
};

type GroupCard = {
  id?: number;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
};

export default function GroupsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCountry, setSelectedCountry } = useAppStore();
  const { requireMember, authModal } = useMemberGate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState("");

  const customGroupsQuery = trpc.groups.list.useQuery(
    { countryCode: selectedCountry },
    { staleTime: 30_000 },
  );
  const serverRecipesQuery = trpc.recipes.list.useQuery(
    { countryCode: selectedCountry },
    { staleTime: 30_000 },
  );
  const createGroupMutation = trpc.groups.create.useMutation();

  const groupCards = useMemo<GroupCard[]>(() => {
    const builtInNames = new Set(categories.map((category) => category.name));
    const customGroups = (customGroupsQuery.data ?? [])
      .filter((group) => !builtInNames.has(group.name))
      .map((group) => ({
        id: group.id,
        name: group.name,
        icon: "category",
        color: "#8B6BA8",
        isCustom: true,
      }));

    return [
      ...categories.map((category) => ({ ...category, isCustom: false })),
      ...customGroups,
    ];
  }, [customGroupsQuery.data]);

  const selectedCountryName = countries.find((country) => country.code === selectedCountry)?.name ?? "Mutfak";

  const openCreateModal = () => {
    setGroupError("");
    setGroupName("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (createGroupMutation.isPending) return;
    setShowCreateModal(false);
    setGroupError("");
  };

  const handleCreateGroup = async () => {
    const normalizedName = groupName.replace(/\s+/g, " ").trim();
    if (selectedCountry === "ALL") {
      setGroupError("Yeni grup eklemek için önce belirli bir ülke seçin.");
      return;
    }
    if (normalizedName.length < 2) {
      setGroupError("Grup adı en az 2 karakter olmalıdır.");
      return;
    }

    try {
      await createGroupMutation.mutateAsync({ countryCode: selectedCountry, name: normalizedName });
      await customGroupsQuery.refetch();
      setGroupName("");
      setGroupError("");
      setShowCreateModal(false);
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : "Grup eklenemedi. Lütfen tekrar deneyin.");
    }
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
        >
          <IconSymbol name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.kicker, { color: colors.primary }]}>KEŞFET</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Tarif grupları</Text>
        </View>
      </View>

      <FlatList
        data={groupCards}
        keyExtractor={(item) => item.id ? `custom-${item.id}` : `built-in-${item.name}`}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.countrySection}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionHeadingCopy}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mutfak seç</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Önce ülkeyi, sonra tarif grubunu seç</Text>
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
                        { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${country.name} mutfağını seç`}
                    >
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <View style={styles.countryCopy}>
                        <Text style={[styles.countryName, { color: active ? "#FFFFFF" : colors.foreground }]}>{country.name}</Text>
                        <Text style={[styles.countrySubtitle, { color: active ? "rgba(255,255,255,0.78)" : colors.muted }]}>{country.subtitle}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.groupSectionHeading}>
              <View style={styles.sectionHeadingCopy}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tarif grupları</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>{selectedCountryName} mutfağındaki gruplar</Text>
              </View>
              <Pressable
                onPress={() => requireMember(openCreateModal)}
                style={({ pressed }) => [
                  styles.addGroupButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Yeni tarif grubu ekle"
              >
                <IconSymbol name="add" size={17} color="#FFFFFF" />
                <Text style={styles.addGroupText}>Grup ekle</Text>
              </Pressable>
            </View>
            <View style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.introIcon, { backgroundColor: colors.primary }]}>
                <IconSymbol name="restaurant" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.introCopy}>
                <Text style={[styles.introTitle, { color: colors.foreground }]}>Canın hangisini çekiyor?</Text>
                <Text style={[styles.introText, { color: colors.muted }]}>Bir grup seçerek o gruptaki tarifleri keşfet.</Text>
              </View>
            </View>
            {customGroupsQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>Kullanıcı grupları yükleniyor…</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const count = item.isCustom
            ? (serverRecipesQuery.data ?? []).filter((recipe: Pick<Recipe, "category">) => recipe.category === item.name).length
            : getRecipes(selectedCountry, item.name).length;
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/group/[category]", params: { category: item.name, countryCode: selectedCountry } })}
              style={({ pressed }) => [
                styles.categoryCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} grubundaki tarifleri aç`}
            >
              <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                <IconSymbol name={item.icon as never} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.categoryCopy}>
                <Text style={[styles.categoryName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.categoryDescription, { color: colors.muted }]}>{categoryDescriptions[item.name] ?? "Bu gruptaki tarifleri keşfet"}</Text>
                <Text style={[styles.categoryCount, { color: colors.primary }]}>{count} tarif</Text>
              </View>
              <IconSymbol name="chevron-right" size={21} color={colors.muted} />
            </Pressable>
          );
        }}
      />

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={closeCreateModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={[styles.modalKicker, { color: colors.primary }]}>YENİ GRUP</Text>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Tarif grubu ekle</Text>
              </View>
              <Pressable onPress={closeCreateModal} disabled={createGroupMutation.isPending} style={styles.modalClose} accessibilityRole="button" accessibilityLabel="Grup ekleme penceresini kapat">
                <IconSymbol name="close" size={21} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={[styles.modalDescription, { color: colors.muted }]}>Seçili ülke: {selectedCountryName}. Yeni grup adı tarif ekleme ekranında da kullanılabilir.</Text>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Grup adı</Text>
            <TextInput
              value={groupName}
              onChangeText={(value) => { setGroupName(value); setGroupError(""); }}
              placeholder="Örn. Kahvaltılıklar"
              placeholderTextColor={colors.muted}
              maxLength={80}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void handleCreateGroup()}
              style={[styles.input, { color: colors.foreground, borderColor: groupError ? colors.error : colors.border, backgroundColor: colors.background }]}
              accessibilityLabel="Yeni tarif grubu adı"
            />
            {groupError ? <Text style={[styles.errorText, { color: colors.error }]}>{groupError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={closeCreateModal} disabled={createGroupMutation.isPending} style={[styles.modalCancel, { borderColor: colors.border }]} accessibilityRole="button">
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Vazgeç</Text>
              </Pressable>
              <Pressable onPress={() => void handleCreateGroup()} disabled={createGroupMutation.isPending} style={[styles.modalSubmit, { backgroundColor: colors.primary, opacity: createGroupMutation.isPending ? 0.6 : 1 }]} accessibilityRole="button">
                {createGroupMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalSubmitText}>Kaydet</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {authModal}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 18 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  heading: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800" },
  title: { marginTop: 3, fontSize: 25, fontWeight: "900" },
  content: { paddingBottom: 42, gap: 11 },
  countrySection: { marginBottom: 20 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionHeadingCopy: { flex: 1 },
  sectionTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  sectionSubtitle: { marginTop: 3, fontSize: 11, fontWeight: "600" },
  countryRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  countryCard: { flex: 1, minHeight: 76, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderRadius: 17, padding: 10 },
  countryFlag: { fontSize: 25 },
  countryCopy: { flex: 1 },
  countryName: { fontSize: 13, fontWeight: "900" },
  countrySubtitle: { marginTop: 3, fontSize: 9, fontWeight: "600" },
  groupSectionHeading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  addGroupButton: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9 },
  addGroupText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  introCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 18, marginBottom: 14, padding: 15 },
  introIcon: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  introCopy: { flex: 1 },
  introTitle: { fontSize: 15, fontWeight: "900" },
  introText: { marginTop: 4, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  loadingText: { fontSize: 11, fontWeight: "700" },
  categoryCard: { flexDirection: "row", alignItems: "center", gap: 13, minHeight: 95, borderWidth: 1, borderRadius: 18, padding: 13 },
  categoryIcon: { width: 53, height: 53, alignItems: "center", justifyContent: "center", borderRadius: 17 },
  categoryCopy: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: "900" },
  categoryDescription: { marginTop: 4, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  categoryCount: { marginTop: 5, fontSize: 11, fontWeight: "800" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.48)", padding: 22 },
  modalCard: { width: "100%", maxWidth: 430, borderWidth: 1, borderRadius: 22, padding: 20 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  modalHeaderCopy: { flex: 1 },
  modalKicker: { fontSize: 10, letterSpacing: 1.2, fontWeight: "900" },
  modalTitle: { marginTop: 4, fontSize: 22, fontWeight: "900" },
  modalClose: { padding: 4 },
  modalDescription: { marginTop: 12, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  fieldLabel: { marginTop: 18, marginBottom: 7, fontSize: 12, fontWeight: "900" },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 15, fontWeight: "600" },
  errorText: { marginTop: 7, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalCancel: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 46, borderWidth: 1, borderRadius: 13 },
  modalCancelText: { fontSize: 13, fontWeight: "900" },
  modalSubmit: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 46, borderRadius: 13 },
  modalSubmitText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
