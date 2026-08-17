import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { categories, countries } from "@/lib/recipe-data";
import { useColors } from "@/hooks/use-colors";
import * as Auth from "@/lib/_core/auth";
import { trpc } from "@/lib/trpc";

type PendingMedia = { uri: string; mediaType: "image" | "video"; mimeType: "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | "video/quicktime"; fileName: string };

const defaultIngredients = ["", "", ""];
const defaultSteps = ["", ""];
const recipeCountries = countries.filter((country) => country.code !== "ALL");

export default function CreateRecipeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tip, setTip] = useState("");
  const [category, setCategory] = useState("Ana Yemek");
  const [countryCode, setCountryCode] = useState("TR");
  const [servings, setServings] = useState("4");
  const [prepMinutes, setPrepMinutes] = useState("20");
  const [cookMinutes, setCookMinutes] = useState("30");
  const [ingredients, setIngredients] = useState(defaultIngredients);
  const [steps, setSteps] = useState(defaultSteps);
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const customGroupsQuery = trpc.groups.list.useQuery({ countryCode }, { staleTime: 30_000 });
  const availableCategories = useMemo(() => {
    const builtInNames = new Set(categories.map((item) => item.name));
    return [
      ...categories,
      ...(customGroupsQuery.data ?? [])
        .filter((group) => !builtInNames.has(group.name))
        .map((group) => ({ name: group.name, icon: "category", count: 0, color: "#8B6BA8" })),
    ];
  }, [customGroupsQuery.data]);
  const utils = trpc.useUtils();
  const uploadMediaMutation = trpc.recipes.media.upload.useMutation();
  const ocrMutation = trpc.recipes.ocr.useMutation();
  const createMutation = trpc.recipes.create.useMutation({
    onSuccess: () => {
      void utils.recipes.list.invalidate();
      Alert.alert("Başarılı", "Tarifiniz yayınlandı ve listeye eklendi.", [{ text: "Tamam", onPress: () => router.back() }]);
    },
    onError: (err) => {
      Alert.alert("Hata", err.message || "Tarif kaydedilemedi. Lütfen giriş yaptığınızdan emin olun.");
    },
  });
  const isBusy = createMutation.isPending || uploadMediaMutation.isPending || ocrMutation.isPending;
  const canSave = title.trim().length > 2 && ingredients.some((item) => item.trim()) && steps.some((item) => item.trim()) && !isBusy;

  const updateIngredient = (index: number, value: string) => setIngredients((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const updateStep = (index: number, value: string) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const addIngredient = () => setIngredients((current) => [...current, ""]);
  const addStep = () => setSteps((current) => [...current, ""]);
  const total = useMemo(() => (Number(prepMinutes) || 0) + (Number(cookMinutes) || 0), [prepMinutes, cookMinutes]);

  const pickMedia = async () => {
    if (media.length >= 3) {
      Alert.alert("Medya sınırı", "Bir tarife en fazla 3 fotoğraf veya video ekleyebilirsiniz.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.82,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mediaType: PendingMedia["mediaType"] = asset.type === "video" ? "video" : "image";
    const rawMimeType = asset.mimeType ?? (mediaType === "image" ? "image/jpeg" : "video/mp4");
    const mimeType = (["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"] as const).includes(rawMimeType as PendingMedia["mimeType"])
      ? rawMimeType as PendingMedia["mimeType"]
      : mediaType === "image" ? "image/jpeg" : "video/mp4";
    setMedia((current) => [...current, { uri: asset.uri, mediaType, mimeType, fileName: asset.fileName ?? `tarif-${Date.now()}.${mediaType === "image" ? "jpg" : "mp4"}` }].slice(0, 3));
  };

  const readFileAsBase64 = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
      };
      reader.onerror = () => reject(new Error("Medya dosyası okunamadı."));
      reader.readAsDataURL(blob);
    });
  };

  const handleOcrImport = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.82,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const rawMimeType = asset.mimeType ?? "image/jpeg";
    const mimeType: "image/jpeg" | "image/png" | "image/webp" = (["image/jpeg", "image/png", "image/webp"] as const).includes(rawMimeType as "image/jpeg" | "image/png" | "image/webp")
      ? rawMimeType as "image/jpeg" | "image/png" | "image/webp"
      : "image/jpeg";

    try {
      const dataBase64 = await readFileAsBase64(asset.uri);
      const extracted = await ocrMutation.mutateAsync({ dataBase64, mimeType });
      const normalizedCountry = extracted.countryCode.trim().toUpperCase();
      const matchedCountry = recipeCountries.find((item) => item.code === normalizedCountry);
      const matchedCategory = availableCategories.find((item) => item.name === extracted.category.trim());
      setTitle(extracted.title);
      setSummary(extracted.summary);
      setTip(extracted.tip ?? "");
      setCategory(matchedCategory?.name ?? "Ana Yemek");
      setCountryCode(matchedCountry?.code ?? "TR");
      setServings(String(extracted.servings || 4));
      setPrepMinutes(String(extracted.prepMinutes || 0));
      setCookMinutes(String(extracted.cookMinutes || 0));
      setIngredients(extracted.ingredients.length > 0 ? extracted.ingredients.map((item) => [item.amount, item.unit, item.name].filter(Boolean).join(" ")) : [""]);
      setSteps(extracted.steps.length > 0 ? extracted.steps : [""]);
      Alert.alert("Taslak hazır", "Görselden çıkarılan alanlar forma aktarıldı. Yayınlamadan önce bilgileri kontrol edin.");
    } catch (error) {
      Alert.alert("Aktarım başarısız", error instanceof Error ? error.message : "Görsel okunamadı. Lütfen daha net bir fotoğraf deneyin.");
    }
  };

  const handleSave = async () => {
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

    const token = await Auth.getSessionToken();
    if (!token) {
      Alert.alert(
        "Oturum Açılması Gerekir",
        "Tarif yayınlamak için lütfen önce profil sekmesinden hesabınıza giriş yapın veya demo hesabı aktif edin.",
        [{ text: "Tamam" }]
      );
      return;
    }
    try {
      const uploadedMedia = [];
      for (const item of media) {
        const dataBase64 = await readFileAsBase64(item.uri);
        const uploaded = await uploadMediaMutation.mutateAsync({ dataBase64, fileName: item.fileName, mimeType: item.mimeType, mediaType: item.mediaType });
        uploadedMedia.push({ url: uploaded.url, mediaType: item.mediaType, mimeType: item.mimeType, sortOrder: uploadedMedia.length });
      }
      await createMutation.mutateAsync({
        countryCode,
        category,
        title: title.trim(),
        summary: summary.trim() || undefined,
        tip: tip.trim() || undefined,
        servings: Number(servings) || 4,
        prepMinutes: Number(prepMinutes) || 15,
        cookMinutes: Number(cookMinutes) || 30,
        ingredients: formattedIngredients,
        steps: steps.filter((step) => step.trim().length > 0),
        media: uploadedMedia,
        imageUrl: uploadedMedia[0]?.url,
      });
    } catch (error) {
      Alert.alert("Yükleme başarısız", error instanceof Error ? error.message : "Medya veya tarif kaydedilemedi.");
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}><Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow-left" size={21} color={colors.foreground} /></Pressable><View style={styles.heading}><Text style={[styles.kicker, { color: colors.primary }]}>YENİ TARİF</Text><Text style={[styles.title, { color: colors.foreground }]}>Tarifini paylaş</Text></View><Text style={[styles.timeTotal, { color: colors.muted }]}>{total} dk</Text></View>
          <Field label="Tarif adı" value={title} onChangeText={setTitle} placeholder="Örn. Fırında sebzeli köfte" colors={colors} />
          <Field label="Kısa açıklama" value={summary} onChangeText={setSummary} placeholder="Bu tarifi özel yapan nedir?" colors={colors} multiline />
          <Field label="Püf noktası" value={tip} onChangeText={setTip} placeholder="Tarifin inceliğini ve dikkat edilmesi gerekenleri yazın" colors={colors} multiline />
          <View style={[styles.ocrCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable onPress={() => void handleOcrImport()} disabled={isBusy} style={({ pressed }) => [styles.ocrAction, { opacity: isBusy ? 0.55 : pressed ? 0.72 : 1 }]} accessibilityRole="button" accessibilityLabel="Fotoğraftan tarif aktar">
              <View style={[styles.ocrIcon, { backgroundColor: colors.primary }]}><IconSymbol name="camera" size={19} color="#FFFFFF" /></View>
              <View style={styles.ocrCopy}><Text style={[styles.ocrTitle, { color: colors.foreground }]}>{ocrMutation.isPending ? "Tarif okunuyor..." : "Fotoğraftan tarif aktar"}</Text><Text style={[styles.ocrText, { color: colors.muted }]}>Bir tarif görseli seçin; alanları taslak olarak dolduralım.</Text></View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>
          </View>
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
          <View style={styles.categoryWrap}>{availableCategories.map((item) => { const active = category === item.name; return <Pressable key={item.name} onPress={() => setCategory(item.name)} style={[styles.category, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.categoryText, { color: active ? "#FFFFFF" : colors.foreground }]}>{item.name}</Text></Pressable>; })}</View>
          <View style={styles.twoFields}><Field label="Porsiyon" value={servings} onChangeText={setServings} placeholder="4" colors={colors} keyboardType="number-pad" compact /><Field label="Hazırlama (dk)" value={prepMinutes} onChangeText={setPrepMinutes} placeholder="20" colors={colors} keyboardType="number-pad" compact /><Field label="Pişirme (dk)" value={cookMinutes} onChangeText={setCookMinutes} placeholder="30" colors={colors} keyboardType="number-pad" compact /></View>
          <SectionLabel title="Malzemeler" hint="Miktar ve birimiyle yaz" colors={colors} />
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{ingredients.map((ingredient, index) => <View key={index} style={styles.listRow}><Text style={[styles.rowNumber, { color: colors.primary }]}>{index + 1}</Text><TextInput value={ingredient} onChangeText={(value) => updateIngredient(index, value)} placeholder="Örn. 2 su bardağı un" placeholderTextColor={colors.muted} style={[styles.listInput, { color: colors.foreground }]} returnKeyType="next" />{ingredients.length > 1 && <Pressable onPress={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}><IconSymbol name="delete" size={18} color={colors.muted} /></Pressable>}</View>)}<Pressable onPress={addIngredient} style={[styles.addLine, { borderTopColor: colors.border }]}><IconSymbol name="add" size={17} color={colors.primary} /><Text style={[styles.addLineText, { color: colors.primary }]}>Malzeme ekle</Text></Pressable></View>
          <SectionLabel title="Yapılışı" hint="Adımları sırayla yaz" colors={colors} />
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{steps.map((step, index) => <View key={index} style={styles.stepInputRow}><View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><TextInput value={step} onChangeText={(value) => updateStep(index, value)} placeholder="Bu adımda ne yapılır?" placeholderTextColor={colors.muted} style={[styles.stepInput, { color: colors.foreground }]} multiline />{steps.length > 1 && <Pressable onPress={() => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}><IconSymbol name="delete" size={18} color={colors.muted} /></Pressable>}</View>)}<Pressable onPress={addStep} style={[styles.addLine, { borderTopColor: colors.border }]}><IconSymbol name="add" size={17} color={colors.primary} /><Text style={[styles.addLineText, { color: colors.primary }]}>Adım ekle</Text></Pressable></View>
          <View style={styles.mediaSection}>
            <View style={styles.mediaSectionHeader}><View><Text style={[styles.mediaTitle, { color: colors.foreground }]}>Fotoğraf ve video</Text><Text style={[styles.mediaText, { color: colors.muted }]}>Tarifini en fazla 3 görselle zenginleştir.</Text></View><Text style={[styles.mediaCount, { color: colors.primary }]}>{media.length}/3</Text></View>
            <View style={[styles.mediaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {media.length > 0 && <View style={styles.mediaGrid}>{media.map((item, index) => <View key={`${item.uri}-${index}`} style={styles.mediaTile}>{item.mediaType === "image" ? <Image source={{ uri: item.uri }} style={styles.mediaPreview} /> : <View style={[styles.videoPreview, { backgroundColor: colors.foreground }]}><IconSymbol name="play" size={26} color={colors.background} /><Text style={[styles.videoLabel, { color: colors.background }]}>Video</Text></View>}<Pressable onPress={() => setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={[styles.removeMedia, { backgroundColor: colors.background }]} accessibilityLabel="Medyayı kaldır"><IconSymbol name="close" size={15} color={colors.foreground} /></Pressable></View>)}</View>}
              <Pressable onPress={() => void pickMedia()} disabled={media.length >= 3} style={[styles.mediaPicker, { borderColor: colors.border, opacity: media.length >= 3 ? 0.45 : 1 }]} accessibilityRole="button" accessibilityLabel="Fotoğraf veya video seç"><IconSymbol name="add" size={18} color={colors.primary} /><Text style={[styles.mediaPickerText, { color: colors.primary }]}>{media.length > 0 ? "Başka medya ekle" : "Galeriden fotoğraf veya video seç"}</Text></Pressable>
            </View>
          </View>
          <Pressable onPress={() => void handleSave()} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.55 }]}><Text style={styles.saveText}>{uploadMediaMutation.isPending ? "Medya yükleniyor..." : createMutation.isPending ? "Yayınlanıyor..." : "Tarifi yayınla"}</Text><IconSymbol name="chevron.right" size={19} color="#FFFFFF" /></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, multiline, keyboardType, compact }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; multiline?: boolean; keyboardType?: "default" | "number-pad"; compact?: boolean }) {
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>{label}</Text>
        <VoiceInputButton onVoiceInput={(spoken) => onChangeText(value ? `${value} ${spoken}` : spoken)} />
      </View>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }, multiline && styles.multiline]} />
    </View>
  );
}
function SectionLabel({ title, hint, colors }: { title: string; hint: string; colors: ReturnType<typeof useColors> }) { return <View style={styles.sectionLabel}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>{hint}</Text></View>; }

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 45 }, topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 22 }, backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 }, heading: { flex: 1 }, kicker: { fontSize: 10, letterSpacing: 1.3, fontWeight: "800" }, title: { marginTop: 3, fontSize: 26, fontWeight: "900" }, timeTotal: { fontSize: 12, fontWeight: "800" },   field: { marginBottom: 15 }, compactField: { flex: 1 }, ocrCard: { borderWidth: 1, borderRadius: 17, marginBottom: 17, padding: 11 }, ocrAction: { flexDirection: "row", alignItems: "center", gap: 10 }, ocrIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12 }, ocrCopy: { flex: 1 }, ocrTitle: { fontSize: 13, fontWeight: "900" }, ocrText: { marginTop: 3, fontSize: 11, lineHeight: 16, fontWeight: "600" }, label: { marginBottom: 7, fontSize: 12, fontWeight: "800" }, input: { minHeight: 49, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 13, fontWeight: "600" }, multiline: { minHeight: 83, paddingTop: 12, textAlignVertical: "top" }, countryWrap: { gap: 8, marginBottom: 6 }, countryOption: { flexDirection: "row", alignItems: "center", minHeight: 68, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, gap: 11 }, countryFlag: { fontSize: 25 }, countryCopy: { flex: 1 }, countryName: { fontSize: 13, fontWeight: "900" }, countrySubtitle: { marginTop: 3, fontSize: 11, fontWeight: "600" }, countryHint: { marginBottom: 17, fontSize: 11, fontWeight: "600" }, categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 17 }, category: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 }, categoryText: { fontSize: 11, fontWeight: "800" }, twoFields: { flexDirection: "row", gap: 8 }, sectionLabel: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 5, marginBottom: 9 }, sectionTitle: { fontSize: 19, fontWeight: "900" }, sectionHint: { fontSize: 11, fontWeight: "700" }, listCard: { overflow: "hidden", borderWidth: 1, borderRadius: 17, paddingHorizontal: 13 }, listRow: { flexDirection: "row", alignItems: "center", minHeight: 51, gap: 9, borderBottomWidth: 0 }, rowNumber: { width: 20, fontSize: 12, fontWeight: "900" }, listInput: { flex: 1, fontSize: 13, fontWeight: "600" }, addLine: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingVertical: 13 }, addLineText: { fontSize: 12, fontWeight: "900" }, stepInputRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 68, gap: 9, paddingVertical: 9 }, stepNumber: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, marginTop: 4 }, stepNumberText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, stepInput: { flex: 1, minHeight: 48, paddingTop: 7, fontSize: 13, lineHeight: 19, fontWeight: "600", textAlignVertical: "top" }, mediaSection: { marginTop: 22 }, mediaSectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 9 }, mediaCount: { fontSize: 11, fontWeight: "900" }, mediaTitle: { fontSize: 13, fontWeight: "900" }, mediaText: { marginTop: 3, fontSize: 11, fontWeight: "600" }, mediaCard: { borderWidth: 1, borderRadius: 17, padding: 10 }, mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }, mediaTile: { position: "relative", width: "31.5%", aspectRatio: 1, overflow: "hidden", borderRadius: 12 }, mediaPreview: { width: "100%", height: "100%" }, videoPreview: { flex: 1, alignItems: "center", justifyContent: "center" }, videoLabel: { marginTop: 4, fontSize: 10, fontWeight: "900" }, removeMedia: { position: "absolute", top: 5, right: 5, alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 12 }, mediaPicker: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 45, borderWidth: 1, borderStyle: "dashed", borderRadius: 12 }, mediaPickerText: { fontSize: 12, fontWeight: "900" }, saveButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, marginTop: 18, paddingVertical: 15 }, saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" } });
