import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Share } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStore } from "@/lib/app-store";
import { formatTotalTime, getRecipe, recipeImages, type Recipe } from "@/lib/recipe-data";
import { CountryFlagIcon } from "@/lib/flag-icons";
import { getApiBaseUrl } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { SUPPORTED_TRANSLATION_LANGUAGES } from "@/shared/const";
import { formatIngredient } from "@/lib/recipe-utils";
import { useColors } from "@/hooks/use-colors";

type ServerRecipeResponse = {
  id: number;
  countryCode: string;
  category: string;
  title: string;
  summary: string | null;
  tip: string | null;
  imageUrl: string | null;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: unknown;
  steps: unknown;
  createdAt: Date | string;
  media: { url: string; mediaType: "image" | "video"; mimeType: string; sortOrder: number }[];
};

type TranslateResult = {
  title: string;
  summary: string;
  tip: string;
  ingredients: { name: string; amount?: string | number | null; unit?: string }[];
  steps: string[];
};

function resolveAssetUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return url;
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

async function readUriAsBase64(uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = () => reject(new Error("Fotoğraf okunamadı."));
    reader.readAsDataURL(blob);
  });
}

function parseServerIngredients(value: unknown): Recipe["ingredients"] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
    const amountText = String(record.amount ?? "").replace(",", ".").trim();
    const parsedAmount = Number(amountText);
    return {
      name: String(record.name ?? "Malzeme"),
      unit: String(record.unit ?? "adet"),
      amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
      scalable: Number.isFinite(parsedAmount),
    };
  });
}

function parseServerSteps(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((step) => String(step).trim()).filter(Boolean);
}

function toDisplayRecipe(serverRecipe: ServerRecipeResponse, fallback: Recipe | undefined): Recipe {
  const country = serverRecipe.countryCode === "TR" ? "TR" : "ALL";
  return {
    id: String(serverRecipe.id),
    title: serverRecipe.title,
    category: serverRecipe.category,
    country,
    countryName: country === "TR" ? "Türkiye" : "Dünya mutfağı",
    flag: country === "TR" ? "🇹🇷" : "🌍",
    image: serverRecipe.imageUrl ? { uri: resolveAssetUrl(serverRecipe.imageUrl) } : fallback?.image ?? recipeImages.mercimek,
    author: "Topluluk üyesi",
    authorAvatar: "TY",
    prepMinutes: serverRecipe.prepMinutes,
    cookMinutes: serverRecipe.cookMinutes,
    servings: serverRecipe.servings,
    summary: serverRecipe.summary ?? "Topluluk tarafından paylaşılan tarif.",
    ingredients: parseServerIngredients(serverRecipe.ingredients),
    steps: parseServerSteps(serverRecipe.steps),
    tip: serverRecipe.tip?.trim() || fallback?.tip || "Tarifin inceliğini ve dikkat edilmesi gerekenleri tarife göre uygulayın.",
    createdAt: serverRecipe.createdAt instanceof Date ? serverRecipe.createdAt.toISOString() : String(serverRecipe.createdAt),
  };
}

export default function RecipeDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const localRecipe = getRecipe(id || "");
  const serverId = Number(id);
  const serverRecipeQuery = trpc.recipes.byId.useQuery(
    { id: serverId },
    { enabled: Number.isInteger(serverId) && serverId > 0 },
  );
  const recipe = serverRecipeQuery.data ? toDisplayRecipe(serverRecipeQuery.data, localRecipe) : localRecipe;
  const mediaItems = serverRecipeQuery.data?.media ?? [];
  const { savedRecipeIds, toggleSaved, addRecipeToShopping } = useAppStore();
  const [servings, setServings] = useState(recipe?.servings ?? 4);
  const [commentText, setCommentText] = useState("");
  const [attemptCaption, setAttemptCaption] = useState("");
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof SUPPORTED_TRANSLATION_LANGUAGES)[number]["code"]>("tr");
  const [translations, setTranslations] = useState<Partial<Record<string, TranslateResult>>>({});
  const translateMutation = trpc.recipes.translate.useMutation({
    onSuccess: (data) => {
      setTranslations((current) => ({ ...current, [selectedLanguage]: data }));
    },
    onError: (error) => {
      Alert.alert("Çeviri yapılamadı", error.message);
      setSelectedLanguage("tr");
    },
  });
  const utils = trpc.useUtils();
  const commentsQuery = trpc.recipes.community.comments.useQuery(
    { recipeId: serverId },
    { enabled: Number.isInteger(serverId) && serverId > 0 },
  );
  const attemptsQuery = trpc.recipes.community.attempts.useQuery(
    { recipeId: serverId },
    { enabled: Number.isInteger(serverId) && serverId > 0 },
  );
  const addCommentMutation = trpc.recipes.community.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      void utils.recipes.community.comments.invalidate({ recipeId: serverId });
    },
    onError: (error) => Alert.alert("Yorum gönderilemedi", error.message),
  });
  const addAttemptMutation = trpc.recipes.community.addAttempt.useMutation({
    onSuccess: () => {
      setAttemptCaption("");
      void utils.recipes.community.attempts.invalidate({ recipeId: serverId });
      Alert.alert("Paylaşıldı", "Fotoğraflı denemeniz tarife eklendi.");
    },
    onError: (error) => Alert.alert("Deneme yüklenemedi", error.message),
  });

  const submitComment = () => {
    const body = commentText.trim();
    if (!body || !Number.isInteger(serverId) || serverId <= 0 || addCommentMutation.isPending) return;
    addCommentMutation.mutate({ recipeId: serverId, body });
  };

  const pickAttemptPhoto = async () => {
    if (!Number.isInteger(serverId) || serverId <= 0 || addAttemptMutation.isPending) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.82,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const rawMimeType = asset.mimeType ?? "image/jpeg";
    const mimeType = (["image/jpeg", "image/png", "image/webp"] as const).includes(rawMimeType as "image/jpeg" | "image/png" | "image/webp")
      ? rawMimeType as "image/jpeg" | "image/png" | "image/webp"
      : "image/jpeg";
    try {
      const dataBase64 = await readUriAsBase64(asset.uri);
      addAttemptMutation.mutate({
        recipeId: serverId,
        dataBase64,
        fileName: asset.fileName ?? `deneme-${Date.now()}.jpg`,
        mimeType,
        caption: attemptCaption.trim() || undefined,
      });
    } catch (error) {
      Alert.alert("Fotoğraf okunamadı", error instanceof Error ? error.message : "Fotoğraf yüklenemedi.");
    }
  };

  const ingredients = useMemo(() => {
    if (!recipe) return [];
    const activeTranslation = selectedLanguage !== "tr" ? translations[selectedLanguage] : undefined;
    return recipe.ingredients.map((ingredient, index) => {
      const translatedName = activeTranslation?.ingredients[index]?.name;
      const translatedUnit = activeTranslation?.ingredients[index]?.unit;
      const merged = { ...ingredient, name: translatedName || ingredient.name, unit: translatedUnit || ingredient.unit };
      return formatIngredient(merged, servings, recipe.servings);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, servings, selectedLanguage, translations]);

  const handleSelectLanguage = (code: (typeof SUPPORTED_TRANSLATION_LANGUAGES)[number]["code"]) => {
    setIsLanguagePickerOpen(false);
    setSelectedLanguage(code);
    if (code === "tr" || translations[code] || !Number.isInteger(serverId) || serverId <= 0) return;
    translateMutation.mutate({ id: serverId, targetLanguage: code as "en" | "de" | "fr" | "es" | "ar" | "ru" });
  };

  const deleteMutation = trpc.recipes.delete.useMutation({
    onSuccess: () => {
      Alert.alert("Silindi", "Tarif kalıcı olarak silindi.", [{ text: "Tamam", onPress: () => router.back() }]);
    },
    onError: (err) => {
      Alert.alert("Hata", err.message || "Tarif silinemedi.");
    },
  });

  if (!recipe) {
    return <ScreenContainer className="px-5 items-center justify-center"><Text style={[styles.title, { color: colors.foreground }]}>{serverRecipeQuery.isLoading ? "Tarif yükleniyor..." : "Tarif bulunamadı."}</Text></ScreenContainer>;
  }

  const activeTranslation = selectedLanguage !== "tr" ? translations[selectedLanguage] : undefined;
  const displayTitle = activeTranslation?.title || recipe.title;
  const displaySummary = activeTranslation?.summary || recipe.summary;
  const displayTip = activeTranslation?.tip || recipe.tip;
  const displaySteps = activeTranslation?.steps?.length ? activeTranslation.steps : recipe.steps;
  const isTranslating = translateMutation.isPending;
  const isOwner = Boolean(user && serverRecipeQuery.data && serverRecipeQuery.data.authorId === user.id);

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
              {isOwner && (
                <>
                  <Pressable onPress={() => router.push({ pathname: "/recipe/create", params: { editId: String(recipe.id) } })} style={styles.heroButton} accessibilityLabel="Tarifi düzenle" {...(Platform.OS === "web" ? { title: "Tarifi düzenle" } : {})}>
                    <IconSymbol name="edit" size={20} color="#FFFFFF" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const confirmDelete = () => deleteMutation.mutate({ id: serverId });
                      if (Platform.OS === "web") {
                        // react-native-web'de çok butonlu Alert.alert güvenilir
                        // çalışmıyor (bazı tarayıcılarda "Sil" tıklaması
                        // tetiklenmiyordu); web'de tarayıcının kendi
                        // onay penceresini kullanıyoruz.
                        if (window.confirm("Bu tarifi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
                          confirmDelete();
                        }
                        return;
                      }
                      Alert.alert("Tarifi sil", "Bu tarifi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.", [
                        { text: "Vazgeç", style: "cancel" },
                        { text: "Sil", style: "destructive", onPress: confirmDelete },
                      ]);
                    }}
                    style={styles.heroButton}
                    accessibilityLabel="Tarifi sil"
                    {...(Platform.OS === "web" ? { title: "Tarifi sil" } : {})}
                  >
                    {deleteMutation.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <IconSymbol name="delete" size={20} color="#FFFFFF" />}
                  </Pressable>
                </>
              )}
              <Pressable onPress={() => setIsLanguagePickerOpen(true)} style={styles.heroButton} accessibilityLabel="Dil değiştir" {...(Platform.OS === "web" ? { title: "Dil değiştir" } : {})}>
                {isTranslating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <IconSymbol name="translate" size={20} color="#FFFFFF" />}
              </Pressable>
              <Pressable onPress={() => toggleSaved(recipe.id)} style={styles.heroButton} accessibilityLabel={saved ? "Tarifi listeden çıkar" : "Tarifi listeme ekle"} {...(Platform.OS === "web" ? { title: saved ? "Listeden çıkar" : "Listeme ekle" } : {})}><IconSymbol name={saved ? "bookmark.fill" : "bookmark"} size={20} color="#FFFFFF" /></Pressable>
              <Pressable onPress={() => router.push("/shopping")} style={styles.heroButton} accessibilityLabel="Alışveriş listesi" {...(Platform.OS === "web" ? { title: "Alışveriş listesine git" } : {})}><IconSymbol name="shopping-cart" size={20} color="#FFFFFF" /></Pressable>
            </View>
          </View>
          <View style={styles.heroTitleWrap}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <CountryFlagIcon code={recipe.country} size={14} />
              <Text style={styles.heroKicker}>{recipe.category}{selectedLanguage !== "tr" ? ` · ${SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === selectedLanguage)?.label}` : ""}</Text>
            </View>
            <Text style={styles.heroTitle}>{displayTitle}</Text>
          </View>
        </View>

        {isLanguagePickerOpen && (
          <View style={[styles.languageOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <View style={[styles.languageSheet, { backgroundColor: colors.background }]}>
              <View style={styles.languageHeader}>
                <Text style={[styles.languageTitle, { color: colors.foreground }]}>Dil seç</Text>
                <Pressable onPress={() => setIsLanguagePickerOpen(false)}><IconSymbol name="close" size={22} color={colors.foreground} /></Pressable>
              </View>
              {SUPPORTED_TRANSLATION_LANGUAGES.map((lang) => (
                <Pressable key={lang.code} onPress={() => handleSelectLanguage(lang.code)} style={[styles.languageRow, { borderColor: colors.border, backgroundColor: selectedLanguage === lang.code ? colors.surface : "transparent" }]}>
                  <Text style={{ color: colors.foreground, fontWeight: selectedLanguage === lang.code ? "800" : "500", fontSize: 15 }}>{lang.label}</Text>
                  {selectedLanguage === lang.code && <IconSymbol name="check" size={18} color={colors.primary} />}
                </Pressable>
              ))}
              <Text style={[styles.languageNote, { color: colors.muted }]}>Çeviriler otomatik oluşturulur, orijinal Türkçe metinle küçük farklar olabilir.</Text>
            </View>
          </View>
        )}

          {mediaItems.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaStrip}>
              {mediaItems.map((item: ServerRecipeResponse["media"][number]) => (
                <View key={`${item.url}-${item.sortOrder}`} style={[styles.mediaTile, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  {item.mediaType === "image" ? (
                    <Image source={{ uri: resolveAssetUrl(item.url) }} contentFit="cover" style={styles.mediaTileImage} />
                  ) : (
                    <View style={[styles.mediaTileVideo, { backgroundColor: colors.foreground }]}>
                      <IconSymbol name="play" size={24} color={colors.background} />
                      <Text style={[styles.mediaTileVideoText, { color: colors.background }]}>Video</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.body}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: colors.success }]}><Text style={styles.avatarText}>{recipe.authorAvatar}</Text></View>
            <View style={styles.authorInfo}><Text style={[styles.authorName, { color: colors.foreground }]}>{recipe.author}</Text><Text style={[styles.authorMeta, { color: colors.muted }]}>Tarif sahibi · Türkiye</Text></View>
            <Pressable onPress={() => router.push("/search")}><IconSymbol name="more" size={23} color={colors.muted} /></Pressable>
          </View>

          <Text style={[styles.summary, { color: colors.muted }]}>{displaySummary}</Text>

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

          <View style={[styles.tipCard, { backgroundColor: "#FFF0DD" }]}><Text style={styles.tipEmoji}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.tipTitle, { color: colors.foreground }]}>Püf noktası</Text><Text style={[styles.tipText, { color: colors.muted }]}>{displayTip}</Text></View></View>

          <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yapılışı</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>{displaySteps.length} adım</Text></View>
          <View style={styles.steps}>
            {displaySteps.map((step, index) => <View key={step} style={styles.stepRow}><View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text></View>)}
          </View>

          {Number.isInteger(serverId) && serverId > 0 && (
            <View style={styles.communitySection}>
              <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Topluluk</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>Deneyimini paylaş</Text></View>
              <View style={[styles.communityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.communityLabel, { color: colors.foreground }]}>Yorum yaz</Text>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Bu tarifi denediniz mi?"
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={1200}
                  style={[styles.commentInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                />
                <Pressable onPress={submitComment} disabled={addCommentMutation.isPending || !commentText.trim()} style={({ pressed }) => [styles.communityButton, { backgroundColor: colors.primary, opacity: addCommentMutation.isPending || !commentText.trim() ? 0.5 : pressed ? 0.82 : 1 }]}>
                  <Text style={styles.communityButtonText}>{addCommentMutation.isPending ? "Gönderiliyor..." : "Yorumu gönder"}</Text>
                </Pressable>
              </View>

              <View style={styles.attemptHeader}><Text style={[styles.communityLabel, { color: colors.foreground }]}>Fotoğraflı denemeler</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>{attemptsQuery.data?.length ?? 0} paylaşım</Text></View>
              <TextInput
                value={attemptCaption}
                onChangeText={setAttemptCaption}
                placeholder="Fotoğrafınıza kısa bir not ekleyin (isteğe bağlı)"
                placeholderTextColor={colors.muted}
                maxLength={600}
                style={[styles.commentInput, styles.captionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Pressable onPress={pickAttemptPhoto} disabled={addAttemptMutation.isPending} style={({ pressed }) => [styles.attemptButton, { borderColor: colors.primary, opacity: addAttemptMutation.isPending ? 0.5 : pressed ? 0.7 : 1 }]}>
                <IconSymbol name="camera" size={18} color={colors.primary} />
                <Text style={[styles.attemptButtonText, { color: colors.primary }]}>{addAttemptMutation.isPending ? "Yükleniyor..." : "Fotoğraflı deneme ekle"}</Text>
              </Pressable>

              {commentsQuery.data?.map((comment: { id: number; authorName: string | null; body: string }) => (
                <View key={comment.id} style={[styles.commentRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.commentAvatar, { backgroundColor: colors.success }]}><Text style={styles.commentAvatarText}>{(comment.authorName ?? "YK").slice(0, 2).toUpperCase()}</Text></View>
                  <View style={styles.commentBody}><Text style={[styles.commentAuthor, { color: colors.foreground }]}>{comment.authorName ?? "Yemek Tarifim kullanıcısı"}</Text><Text style={[styles.commentText, { color: colors.muted }]}>{comment.body}</Text></View>
                </View>
              ))}

              {(attemptsQuery.data ?? []).map((attempt: { id: number; authorName: string | null; imageUrl: string; caption: string | null }) => (
                <View key={attempt.id} style={[styles.attemptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image source={{ uri: resolveAssetUrl(attempt.imageUrl) }} contentFit="cover" style={styles.attemptImage} />
                  <View style={styles.attemptInfo}><Text style={[styles.commentAuthor, { color: colors.foreground }]}>{attempt.authorName ?? "Yemek Tarifim kullanıcısı"}</Text>{attempt.caption ? <Text style={[styles.commentText, { color: colors.muted }]}>{attempt.caption}</Text> : null}</View>
                </View>
              ))}
            </View>
          )}

          <Pressable onPress={() => router.push({ pathname: "/cooking/[id]", params: { id: recipe.id } })} style={[styles.cookButton, { backgroundColor: colors.foreground }]}><IconSymbol name="play" size={19} color={colors.background} /><Text style={[styles.cookButtonText, { color: colors.background }]}>Pişirme modunu aç</Text></Pressable>
          <Pressable
            onPress={async () => {
              try {
                await Share.share({
                  title: recipe.title,
                  message: `${recipe.title} - Gastronotlar Lezzet Rehberi\n\n${recipe.summary}\n\nHazırlık: ${recipe.prepMinutes} dk | Pişirme: ${recipe.cookMinutes} dk`,
                });
              } catch (error: any) {
                Alert.alert("Paylaşılamadı", error?.message || "Tarif paylaşılırken bir hata oluştu.");
              }
            }}
            style={[styles.shareButton, { borderColor: colors.border }]}
          >
            <IconSymbol name="share" size={18} color={colors.foreground} />
            <Text style={[styles.shareText, { color: colors.foreground }]}>Tarifi paylaş</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({ icon, label, value, colors }: { icon: "timer" | "restaurant" | "clock"; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.stat}><IconSymbol name={icon} size={18} color={colors.primary} /><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  languageOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 30 },
  languageSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 },
  languageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  languageTitle: { fontSize: 18, fontWeight: "800" },
  languageRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  languageNote: { fontSize: 12, marginTop: 6, lineHeight: 17 },
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
  communitySection: { marginTop: 4 },
  communityCard: { borderWidth: 1, borderRadius: 17, padding: 14 },
  communityLabel: { fontSize: 14, fontWeight: "900" },
  commentInput: { minHeight: 82, borderWidth: 1, borderRadius: 13, marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, lineHeight: 19, textAlignVertical: "top" },
  captionInput: { minHeight: 48, marginTop: 12 },
  communityButton: { alignItems: "center", borderRadius: 12, marginTop: 10, paddingVertical: 12 },
  communityButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  attemptHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 1 },
  attemptButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 13, marginTop: 10, paddingVertical: 12 },
  attemptButtonText: { fontSize: 13, fontWeight: "900" },
  commentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderBottomWidth: 1, paddingVertical: 13 },
  commentAvatar: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  commentAvatarText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 12, fontWeight: "900" },
  commentText: { marginTop: 4, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  attemptCard: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 14, marginTop: 11, padding: 8 },
  attemptImage: { width: 78, height: 68, borderRadius: 10 },
  attemptInfo: { flex: 1 },
  mediaStrip: { gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  mediaTile: { width: 92, height: 76, overflow: "hidden", borderWidth: 1, borderRadius: 14 },
  mediaTileImage: { width: "100%", height: "100%" },
  mediaTileVideo: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  mediaTileVideoText: { fontSize: 10, fontWeight: "800" },
});
