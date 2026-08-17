import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { categories, countries } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const defaultIngredients = ["", "", ""];
const defaultSteps = ["", ""];
const recipeCountries = countries.filter((country) => country.code !== "ALL");

export default function CreateRecipeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Ana Yemek");
  const [countryCode, setCountryCode] = useState("TR");
  const [servings, setServings] = useState("4");
  const [prepMinutes, setPrepMinutes] = useState("20");
  const [cookMinutes, setCookMinutes] = useState("30");
  const [ingredients, setIngredients] = useState(defaultIngredients);
  const [steps, setSteps] = useState(defaultSteps);
  const utils = trpc.useUtils();
  const createMutation = trpc.recipes.create.useMutation({
    onSuccess: () => {
      void utils.recipes.list.invalidate();
      Alert.alert("Başarılı", "Tarifiniz yayınlandı ve listeye eklendi.", [{ text: "Tamam", onPress: () => router.back() }]);
    },
    onError: (err) => {
      Alert.alert("Hata", err.message || "Tarif kaydedilemedi. Lütfen giriş yaptığınızdan emin olun.");
    },
  });
  const canSave = title.trim().length > 2 && ingredients.some((item) => item.trim()) && steps.some((item) => item.trim()) && !createMutation.isPending;

  const updateIngredient = (index: number, value: string) => setIngredients((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const updateStep = (index: number, value: string) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const addIngredient = () => setIngredients((current) => [...current, ""]);
  const addStep = () => setSteps((current) => [...current, ""]);
  const total = useMemo(() => (Number(prepMinutes) || 0) + (Number(cookMinutes) || 0), [prepMinutes, cookMinutes]);

  const handleSave = () => {
    if (!canSave) {
      Alert.alert("Eksik bilgi", "Tarif adı, en az bir malzeme ve bir yapılış adımı ekleyin.");
      return;
    }
    const formattedIngredients = ingredients
      .filter((item) => item.trim().length > 0)
      .map((item) => {
        const parts = item.trim().split(" ");
        const amount = parts[0] || "1";
        const unit = parts.length > 1 ? parts[1] || "adet" : "adet";
        const name = parts.length > 2 ? parts.slice(2).join(" ") : parts[1] || item.trim();
        return { name: name || item.trim(), amount, unit };
      });

    createMutation.mutate({
      countryCode,
      category,
      title: title.trim(),
      summary: summary.trim() || undefined,
      servings: Number(servings) || 4,
      prepMinutes: Number(prepMinutes) || 15,
      cookMinutes: Number(cookMinutes) || 30,
      ingredients: formattedIngredients,
      steps: steps.filter((step) => step.trim().length > 0),
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}><Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow-left" size={21} color={colors.foreground} /></Pressable><View style={styles.heading}><Text style={[styles.kicker, { color: colors.primary }]}>YENİ TARİF</Text><Text style={[styles.title, { color: colors.foreground }]}>Tarifini paylaş</Text></View><Text style={[styles.timeTotal, { color: colors.muted }]}>{total} dk</Text></View>
          <Field label="Tarif adı" value={title} onChangeText={setTitle} placeholder="Örn. Fırında sebzeli köfte" colors={colors} />
          <Field label="Kısa açıklama" value={summary} onChangeText={setSummary} placeholder="Bu tarifi özel yapan nedir?" colors={colors} multiline />
          <Text style={[styles.label, { color: colors.foreground }]}>Tarifin ülkesi</Text>
          <View style={styles.countryWrap} accessibilityLabel="Tarifin ülkesi">
            {recipeCountries.map((item) => {
              const active = countryCode === item.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => setCountryCode(item.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.countryOption, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View style={styles.countryCopy}>
                    <Text style={[styles.countryName, { color: active ? "#FFFFFF" : colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.countrySubtitle, { color: active ? "#FFF3E6" : colors.muted }]}>{item.subtitle}</Text>
                  </View>
                  <IconSymbol name={active ? "check" : "chevron.right"} size={18} color={active ? "#FFFFFF" : colors.muted} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.countryHint, { color: colors.muted }]}>Yeni ülke mutfakları eklendikçe bu seçim genişletilecektir.</Text>
          <Text style={[styles.label, { color: colors.foreground }]}>Tarif grubu</Text>
          <View style={styles.categoryWrap}>{categories.map((item) => { const active = category === item.name; return <Pressable key={item.name} onPress={() => setCategory(item.name)} style={[styles.category, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.categoryText, { color: active ? "#FFFFFF" : colors.foreground }]}>{item.name}</Text></Pressable>; })}</View>
          <View style={styles.twoFields}><Field label="Porsiyon" value={servings} onChangeText={setServings} placeholder="4" colors={colors} keyboardType="number-pad" compact /><Field label="Hazırlama (dk)" value={prepMinutes} onChangeText={setPrepMinutes} placeholder="20" colors={colors} keyboardType="number-pad" compact /><Field label="Pişirme (dk)" value={cookMinutes} onChangeText={setCookMinutes} placeholder="30" colors={colors} keyboardType="number-pad" compact /></View>
          <SectionLabel title="Malzemeler" hint="Miktar ve birimiyle yaz" colors={colors} />
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{ingredients.map((ingredient, index) => <View key={index} style={styles.listRow}><Text style={[styles.rowNumber, { color: colors.primary }]}>{index + 1}</Text><TextInput value={ingredient} onChangeText={(value) => updateIngredient(index, value)} placeholder="Örn. 2 su bardağı un" placeholderTextColor={colors.muted} style={[styles.listInput, { color: colors.foreground }]} returnKeyType="next" />{ingredients.length > 1 && <Pressable onPress={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}><IconSymbol name="delete" size={18} color={colors.muted} /></Pressable>}</View>)}<Pressable onPress={addIngredient} style={[styles.addLine, { borderTopColor: colors.border }]}><IconSymbol name="add" size={17} color={colors.primary} /><Text style={[styles.addLineText, { color: colors.primary }]}>Malzeme ekle</Text></Pressable></View>
          <SectionLabel title="Yapılışı" hint="Adımları sırayla yaz" colors={colors} />
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{steps.map((step, index) => <View key={index} style={styles.stepInputRow}><View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><TextInput value={step} onChangeText={(value) => updateStep(index, value)} placeholder="Bu adımda ne yapılır?" placeholderTextColor={colors.muted} style={[styles.stepInput, { color: colors.foreground }]} multiline />{steps.length > 1 && <Pressable onPress={() => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}><IconSymbol name="delete" size={18} color={colors.muted} /></Pressable>}</View>)}<Pressable onPress={addStep} style={[styles.addLine, { borderTopColor: colors.border }]}><IconSymbol name="add" size={17} color={colors.primary} /><Text style={[styles.addLineText, { color: colors.primary }]}>Adım ekle</Text></Pressable></View>
          <View style={[styles.mediaHint, { backgroundColor: "#FFF0DD" }]}><IconSymbol name="add" size={18} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.mediaTitle, { color: colors.foreground }]}>Fotoğraf ve video ekle</Text><Text style={[styles.mediaText, { color: colors.muted }]}>Tarifini en fazla 3 görselle zenginleştir.</Text></View></View>
          <Pressable onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.55 }]}><Text style={styles.saveText}>{createMutation.isPending ? "Yayınlanıyor..." : "Tarifi yayınla"}</Text><IconSymbol name="chevron.right" size={19} color="#FFFFFF" /></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, multiline, keyboardType, compact }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; multiline?: boolean; keyboardType?: "default" | "number-pad"; compact?: boolean }) { return <View style={[styles.field, compact && styles.compactField]}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }, multiline && styles.multiline]} /></View>; }
function SectionLabel({ title, hint, colors }: { title: string; hint: string; colors: ReturnType<typeof useColors> }) { return <View style={styles.sectionLabel}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>{hint}</Text></View>; }

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 45 }, topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 22 }, backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 }, heading: { flex: 1 }, kicker: { fontSize: 10, letterSpacing: 1.3, fontWeight: "800" }, title: { marginTop: 3, fontSize: 26, fontWeight: "900" }, timeTotal: { fontSize: 12, fontWeight: "800" }, field: { marginBottom: 15 }, compactField: { flex: 1 }, label: { marginBottom: 7, fontSize: 12, fontWeight: "800" }, input: { minHeight: 49, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 13, fontWeight: "600" }, multiline: { minHeight: 83, paddingTop: 12, textAlignVertical: "top" }, countryWrap: { gap: 8, marginBottom: 6 }, countryOption: { flexDirection: "row", alignItems: "center", minHeight: 68, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, gap: 11 }, countryFlag: { fontSize: 25 }, countryCopy: { flex: 1 }, countryName: { fontSize: 13, fontWeight: "900" }, countrySubtitle: { marginTop: 3, fontSize: 11, fontWeight: "600" }, countryHint: { marginBottom: 17, fontSize: 11, fontWeight: "600" }, categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 17 }, category: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 }, categoryText: { fontSize: 11, fontWeight: "800" }, twoFields: { flexDirection: "row", gap: 8 }, sectionLabel: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 5, marginBottom: 9 }, sectionTitle: { fontSize: 19, fontWeight: "900" }, sectionHint: { fontSize: 11, fontWeight: "700" }, listCard: { overflow: "hidden", borderWidth: 1, borderRadius: 17, paddingHorizontal: 13 }, listRow: { flexDirection: "row", alignItems: "center", minHeight: 51, gap: 9, borderBottomWidth: 0 }, rowNumber: { width: 20, fontSize: 12, fontWeight: "900" }, listInput: { flex: 1, fontSize: 13, fontWeight: "600" }, addLine: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingVertical: 13 }, addLineText: { fontSize: 12, fontWeight: "900" }, stepInputRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 68, gap: 9, paddingVertical: 9 }, stepNumber: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, marginTop: 4 }, stepNumberText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, stepInput: { flex: 1, minHeight: 48, paddingTop: 7, fontSize: 13, lineHeight: 19, fontWeight: "600", textAlignVertical: "top" }, mediaHint: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 17, marginTop: 22, padding: 14 }, mediaTitle: { fontSize: 13, fontWeight: "900" }, mediaText: { marginTop: 3, fontSize: 11, fontWeight: "600" }, saveButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, marginTop: 18, paddingVertical: 15 }, saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" } });
