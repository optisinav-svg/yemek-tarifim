import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/app-store";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const scheme = useColorScheme();
  const { savedRecipeIds } = useAppStore();
  const { user, isAuthenticated, loading, logout } = useAuth();
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.topBar}><Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow-left" size={21} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>Profil ve ayarlar</Text></View>
      <Pressable onPress={() => { if (!isAuthenticated) void startOAuthLogin(); }} style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{isAuthenticated ? (user?.name?.slice(0, 2).toUpperCase() || "YK") : "YK"}</Text></View><View style={styles.profileText}><Text style={[styles.name, { color: colors.foreground }]}>{loading ? "Hesap kontrol ediliyor" : isAuthenticated ? (user?.name || "Yemek dostu") : "Hesabına bağlan"}</Text><Text style={[styles.email, { color: colors.muted }]}>{loading ? "Lütfen bekleyin" : isAuthenticated ? (user?.email || "Tariflerin cihazların arasında eşitleniyor") : "Tariflerini cihazların arasında eşitle"}</Text></View><IconSymbol name="chevron.right" size={19} color={colors.muted} /></Pressable>
      <View style={styles.stats}><Stat value={String(savedRecipeIds.length)} label="Listemde" colors={colors} /><Stat value="3" label="Tarifim" colors={colors} /><Stat value="TR" label="Mutfağım" colors={colors} /></View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tercihler</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingRow icon="bookmark" title="Listemdeki tarifler" detail={`${savedRecipeIds.length} kayıt`} colors={colors} onPress={() => router.push("/saved")} />
        <SettingRow icon="restaurant" title="Benim Tariflerim" detail="Yayınladığım tarifler" colors={colors} onPress={() => router.push("/my-recipes")} />
        <SettingRow icon="shopping-cart" title="Alışveriş listem" detail="Market hazırlığı" colors={colors} onPress={() => router.push("/shopping")} />
        <SettingRow icon="translate" title="Dil" detail="Türkçe" colors={colors} />
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}><View style={[styles.settingIcon, { backgroundColor: "#EEE7FF" }]}><IconSymbol name="settings" size={18} color="#7A6AA8" /></View><View style={styles.settingText}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Karanlık görünüm</Text><Text style={[styles.settingDetail, { color: colors.muted }]}>{scheme === "dark" ? "Açık" : "Sistem tercihi"}</Text></View><Switch value={scheme === "dark"} onValueChange={() => {}} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" /></View>
      </View>
      {isAuthenticated && <Pressable onPress={() => void logout()} style={styles.logoutButton}><Text style={[styles.logoutText, { color: colors.error }]}>Hesaptan çıkış yap</Text></Pressable>}
      <View style={styles.security}><IconSymbol name="check" size={17} color={colors.success} /><Text style={[styles.securityText, { color: colors.muted }]}>{isAuthenticated ? "Verilerin hesabınla güvenle eşitleniyor." : "Giriş yapana kadar verilerin cihazında saklanır."}</Text></View>
    </ScreenContainer>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: ReturnType<typeof useColors> }) { return <View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></View>; }
function SettingRow({ icon, title, detail, colors, onPress }: { icon: "bookmark" | "shopping-cart" | "translate" | "restaurant"; title: string; detail: string; colors: ReturnType<typeof useColors>; onPress?: () => void }) { return <Pressable onPress={onPress} style={[styles.settingRow, { borderBottomColor: colors.border }]}><View style={[styles.settingIcon, { backgroundColor: "#FFF0DD" }]}><IconSymbol name={icon} size={18} color={colors.primary} /></View><View style={styles.settingText}><Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.settingDetail, { color: colors.muted }]}>{detail}</Text></View><IconSymbol name="chevron.right" size={18} color={colors.muted} /></Pressable>; }

const styles = StyleSheet.create({ topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 18, paddingBottom: 22 }, backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 }, title: { fontSize: 25, fontWeight: "900" }, profileCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 19, padding: 15 }, avatar: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 27 }, avatarText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" }, profileText: { flex: 1 }, name: { fontSize: 16, fontWeight: "900" }, email: { marginTop: 4, fontSize: 12, fontWeight: "600" }, stats: { flexDirection: "row", justifyContent: "space-around", marginVertical: 22 }, stat: { alignItems: "center", gap: 3 }, statValue: { fontSize: 20, fontWeight: "900" }, statLabel: { fontSize: 11, fontWeight: "700" }, sectionTitle: { marginBottom: 11, fontSize: 18, fontWeight: "900" }, settingsCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 }, settingRow: { minHeight: 63, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1 }, settingIcon: { width: 35, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 11 }, settingText: { flex: 1 }, settingTitle: { fontSize: 13, fontWeight: "800" }, settingDetail: { marginTop: 3, fontSize: 11, fontWeight: "600" }, logoutButton: { alignItems: "center", marginTop: 18, paddingVertical: 10 }, logoutText: { fontSize: 13, fontWeight: "800" }, security: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }, securityText: { fontSize: 11, fontWeight: "700" } });
