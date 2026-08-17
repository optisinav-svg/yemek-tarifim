import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-store";
import { useThemeContext } from "@/lib/theme-provider";
import { trpc } from "@/lib/trpc";
import { startOAuthLogin } from "@/constants/oauth";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { savedRecipeIds } = useAppStore();
  const { user, isAuthenticated, loading, logout, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const updateProfileMutation = trpc.updateProfile.useMutation();
  const uploadAvatarMutation = trpc.profile.uploadAvatar.useMutation();
  const deleteAccountMutation = trpc.account.delete.useMutation();

  useEffect(() => {
    setName(user?.name ?? "");
    setAvatarUrl(user?.imageUrl ?? "");
  }, [user?.name, user?.imageUrl]);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset?.base64) {
        if (!result.canceled) Alert.alert("Fotoğraf gerekli", "Lütfen yüklenebilir bir fotoğraf seçin.");
        return;
      }

      const mimeType = asset.mimeType === "image/png"
        ? "image/png"
        : asset.mimeType === "image/webp"
          ? "image/webp"
          : "image/jpeg";
      const uploaded = await uploadAvatarMutation.mutateAsync({
        dataBase64: asset.base64,
        fileName: "avatar.jpg",
        mimeType,
        mediaType: "image",
      });
      setAvatarUrl(uploaded.url);
    } catch {
      Alert.alert("Hata", "Profil fotoğrafı yüklenemedi.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim() || undefined,
        imageUrl: avatarUrl || undefined,
      });
      await refresh();
      setIsEditing(false);
      Alert.alert("Başarılı", "Profiliniz güncellendi.");
    } catch {
      Alert.alert("Hata", "Profil güncellenemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı sil",
      "Hesabınız, yayınladığınız tarifler ve kişisel eşitleme verileriniz silinecek. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabımı sil",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteAccountMutation.mutateAsync();
                await logout();
                Alert.alert("Hesap silindi", "Hesabınız ve kişisel verileriniz kaldırıldı.");
              } catch {
                Alert.alert("İşlem başarısız", "Hesabınız silinemedi. Lütfen tekrar deneyin.");
              }
            })();
          },
        },
      ],
    );
  };

  const isSaving = updateProfileMutation.isPending || uploadAvatarMutation.isPending || deleteAccountMutation.isPending;
  const displayAvatar = isEditing ? avatarUrl : user?.imageUrl;

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
          >
            <IconSymbol name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Profil ve ayarlar</Text>
        </View>

        <Pressable
          onPress={() => {
            if (!isAuthenticated) {
              void startOAuthLogin();
            } else {
              setName(user?.name ?? "");
              setAvatarUrl(user?.imageUrl ?? "");
              setIsEditing(true);
            }
          }}
          style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={isAuthenticated ? "Profili düzenle" : "Hesaba bağlan"}
        >
          <Avatar uri={displayAvatar} fallback={isAuthenticated ? (user?.name?.slice(0, 2).toUpperCase() || "YK") : "YK"} colors={colors} />
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {loading ? "Hesap kontrol ediliyor" : isAuthenticated ? (user?.name || "Yemek dostu") : "Hesabına bağlan"}
            </Text>
            <Text style={[styles.email, { color: colors.muted }]}>
              {loading ? "Lütfen bekleyin" : isAuthenticated ? (user?.email || "Düzenlemek için dokunun") : "Tariflerini cihazların arasında eşitle"}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={19} color={colors.muted} />
        </Pressable>

        <View style={styles.stats}>
          <Stat value={String(savedRecipeIds.length)} label="Listemde" colors={colors} />
          <Stat value="3" label="Tarifim" colors={colors} />
          <Stat value="TR" label="Mutfağım" colors={colors} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tercihler ve Yönetim</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow icon="bookmark" title="Listemdeki tarifler" detail={`${savedRecipeIds.length} kayıt`} colors={colors} onPress={() => router.push("/saved")} />
          <SettingRow icon="restaurant" title="Benim Tariflerim" detail="Yayınladığım tarifler" colors={colors} onPress={() => router.push("/my-recipes")} />
          <SettingRow icon="shopping-cart" title="Alışveriş listem" detail="Market hazırlığı" colors={colors} onPress={() => router.push("/shopping")} />
          <SettingRow icon="translate" title="Dil ve Ülke" detail="Türkçe (Türkiye)" colors={colors} />
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#EEE7FF" }]}>
              <IconSymbol name="settings" size={18} color="#7A6AA8" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Karanlık görünüm</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>{colorScheme === "dark" ? "Aktif" : "Kapalı"}</Text>
            </View>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={(value) => setColorScheme(value ? "dark" : "light")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Karanlık görünüm"
            />
          </View>
        </View>

        {isAuthenticated && (
          <>
            <Pressable onPress={() => void logout()} style={styles.logoutButton} accessibilityRole="button">
              <Text style={[styles.logoutText, { color: colors.error }]}>Hesaptan çıkış yap</Text>
            </Pressable>
            <Pressable onPress={handleDeleteAccount} style={styles.deleteAccountButton} accessibilityRole="button" disabled={deleteAccountMutation.isPending}>
              <Text style={[styles.deleteAccountText, { color: colors.error }]}>{deleteAccountMutation.isPending ? "Hesap siliniyor..." : "Hesabımı ve verilerimi sil"}</Text>
            </Pressable>
          </>
        )}

        <View style={styles.security}>
          <IconSymbol name="check" size={17} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.muted }]}>
            {user?.accountStatus === "suspended" ? "Hesabınız geçici olarak askıya alındı." : user?.accountStatus === "deleted" ? "Bu hesap silinmiş durumda." : isAuthenticated ? "Verilerin hesabınla güvenle eşitleniyor." : "Giriş yapana kadar verilerin cihazında saklanır."}
          </Text>
        </View>
      </ScrollView>

      <Modal visible={isEditing} animationType="slide" transparent onRequestClose={() => setIsEditing(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Profili Düzenle</Text>
            <Pressable
              onPress={() => void handlePickAvatar()}
              style={[styles.avatarPicker, { borderColor: colors.border, backgroundColor: colors.surface }]}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Profil fotoğrafı seç"
            >
              <Avatar uri={avatarUrl} fallback="YK" colors={colors} size={68} />
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                {uploadAvatarMutation.isPending ? "Fotoğraf yükleniyor..." : "Profil Fotoğrafı Seç"}
              </Text>
            </Pressable>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Ad Soyad</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Adınızı girin"
              placeholderTextColor={colors.muted}
              editable={!isSaving}
              autoCapitalize="words"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setIsEditing(false)} style={[styles.actionBtn, { backgroundColor: colors.surface }]} disabled={isSaving}>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>İptal</Text>
              </Pressable>
              <Pressable onPress={() => void handleSaveProfile()} style={[styles.actionBtn, { backgroundColor: colors.primary }]} disabled={isSaving}>
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{isSaving ? "Kaydediliyor..." : "Kaydet"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function Avatar({ uri, fallback, colors, size = 54 }: { uri?: string | null; fallback: string; colors: ReturnType<typeof useColors>; size?: number }) {
  return uri ? (
    <Image source={{ uri }} contentFit="cover" style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} accessibilityLabel="Profil fotoğrafı" />
  ) : (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }]}>
      <Text style={styles.avatarText}>{fallback}</Text>
    </View>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></View>;
}

function SettingRow({ icon, title, detail, colors, onPress }: { icon: "bookmark" | "shopping-cart" | "translate" | "restaurant"; title: string; detail: string; colors: ReturnType<typeof useColors>; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.settingRow, { borderBottomColor: colors.border }]} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined}><View style={[styles.settingIcon, { backgroundColor: "#FFF0DD" }]}><IconSymbol name={icon} size={18} color={colors.primary} /></View><View style={styles.settingText}><Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.settingDetail, { color: colors.muted }]}>{detail}</Text></View>{onPress ? <IconSymbol name="chevron.right" size={18} color={colors.muted} /> : null}</Pressable>;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 22 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 25, fontWeight: "900" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 19, padding: 15 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  profileText: { flex: 1 },
  name: { fontSize: 16, fontWeight: "900" },
  email: { marginTop: 4, fontSize: 12, fontWeight: "600" },
  stats: { flexDirection: "row", justifyContent: "space-around", marginVertical: 22 },
  stat: { alignItems: "center", gap: 3 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, fontWeight: "700" },
  sectionTitle: { marginBottom: 11, fontSize: 18, fontWeight: "900" },
  settingsCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  settingRow: { minHeight: 63, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1 },
  settingIcon: { width: 35, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 13, fontWeight: "800" },
  settingDetail: { marginTop: 3, fontSize: 11, fontWeight: "600" },
  logoutButton: { alignItems: "center", marginTop: 18, paddingVertical: 10 },
  logoutText: { fontSize: 13, fontWeight: "800" },
  deleteAccountButton: { alignItems: "center", paddingVertical: 8 },
  deleteAccountText: { fontSize: 12, fontWeight: "800" },
  security: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  securityText: { fontSize: 11, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: "900", textAlign: "center" },
  avatarPicker: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center", gap: 10 },
  inputLabel: { fontSize: 12, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
});
