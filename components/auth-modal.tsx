import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData: { email: string; name: string; username: string }) => void;
}

export function AuthModal({ visible, onClose, onSuccess }: AuthModalProps) {
  const colors = useColors();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [securePassword, setSecurePassword] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen e-posta ve şifre alanlarını doldurun.");
      return;
    }

    if (mode === "register") {
      if (!name.trim() || !surname.trim() || !username.trim()) {
        Alert.alert("Eksik bilgi", "Kayıt için ad, soyad ve kullanıcı adı gereklidir.");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          "Doğrulama E-postası Gönderildi",
          `${email} adresine gönderilen 6 haneli doğrulama kodunu girerek hesabınızı etkinleştirin.`,
          [{ text: "Kodu Gir", onPress: () => setMode("verify") }]
        );
      }, 800);
      return;
    }

    if (mode === "verify") {
      if (verificationCode.length < 4) {
        Alert.alert("Geçersiz Kod", "Lütfen e-postanıza gelen doğrulama kodunu eksiksiz girin.");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        Alert.alert("Başarılı", "E-postanız doğrulandı! Gastronotlar dünyasına hoş geldiniz.");
        onSuccess({
          email,
          name: `${name} ${surname}`.trim() || username,
          username,
        });
        onClose();
      }, 700);
      return;
    }

    if (mode === "forgot") {
      if (!email.trim()) {
        Alert.alert("E-posta gerekli", "Lütfen şifresini sıfırlamak istediğiniz e-posta adresini yazın.");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        Alert.alert("Şifre Sıfırlama Bağlantısı", `${email} adresine şifre sıfırlama talimatları gönderildi.`);
        setMode("login");
      }, 700);
      return;
    }

    // Login mode
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Giriş Başarılı", `Hoş geldiniz, ${email}!`);
      onSuccess({
        email,
        name: email.split("@")[0],
        username: email.split("@")[0],
      });
      onClose();
    }, 700);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {mode === "login" && "Gastronotlar'a Giriş Yap"}
              {mode === "register" && "Yeni Hesap Oluştur"}
              {mode === "forgot" && "Şifremi Unuttum"}
              {mode === "verify" && "E-posta Doğrulama"}
            </Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="close" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {mode === "register" && (
              <>
                <Text style={[styles.label, { color: colors.muted }]}>Adınız</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Adınız"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, { color: colors.muted }]}>Soyadınız</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Soyadınız"
                  placeholderTextColor={colors.muted}
                  value={surname}
                  onChangeText={setSurname}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, { color: colors.muted }]}>Kullanıcı Adı</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="ornegin: lezzetavcisi"
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </>
            )}

            {mode !== "verify" && (
              <>
                <Text style={[styles.label, { color: colors.muted }]}>E-posta Adresi</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="ornek@mail.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            )}

            {mode !== "forgot" && mode !== "verify" && (
              <>
                <View style={styles.passwordHeader}>
                  <Text style={[styles.label, { color: colors.muted }]}>Şifre</Text>
                  <Pressable onPress={() => setSecurePassword(!securePassword)}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                      {securePassword ? "Göster" : "Gizle"}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={securePassword}
                />
              </>
            )}

            {mode === "verify" && (
              <>
                <Text style={[styles.label, { color: colors.muted }]}>Doğrulama Kodu (6 Haneli)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border, letterSpacing: 6, fontSize: 22, textAlign: "center" }]}
                  placeholder="123456"
                  placeholderTextColor={colors.muted}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={[styles.hint, { color: colors.muted }]}>
                  {email} adresine gönderilen doğrulama kodunu girin.
                </Text>
              </>
            )}

            {mode === "login" && (
              <View style={styles.optionsRow}>
                <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.rememberRow}>
                  <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: rememberMe ? colors.primary : "transparent" }]}>
                    {rememberMe && <IconSymbol name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.rememberText, { color: colors.foreground }]}>Beni Hatırla</Text>
                </Pressable>

                <Pressable onPress={() => setMode("forgot")}>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>Şifremi Unuttum</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={handleAuthSubmit}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading
                  ? "İşlem yapılıyor..."
                  : mode === "login"
                  ? "Giriş Yap"
                  : mode === "register"
                  ? "Kayıt Ol ve Doğrula"
                  : mode === "forgot"
                  ? "Sıfırlama Bağlantısı Gönder"
                  : "Kodu Onayla"}
              </Text>
            </Pressable>

            <View style={styles.switchModeRow}>
              {mode === "login" && (
                <>
                  <Text style={{ color: colors.muted }}>Hesabınız yok mu? </Text>
                  <Pressable onPress={() => setMode("register")}>
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>Kayıt Ol</Text>
                  </Pressable>
                </>
              )}
              {mode === "register" && (
                <>
                  <Text style={{ color: colors.muted }}>Zaten hesabınız var mı? </Text>
                  <Pressable onPress={() => setMode("login")}>
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>Giriş Yap</Text>
                  </Pressable>
                </>
              )}
              {(mode === "forgot" || mode === "verify") && (
                <Pressable onPress={() => setMode("login")}>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>← Giriş Ekranına Dön</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 16 },
  content: { borderWidth: 1, borderRadius: 24, padding: 20, maxHeight: "90%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "900" },
  closeBtn: { padding: 8, borderRadius: 12 },
  scroll: { gap: 12, paddingBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  passwordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15 },
  hint: { fontSize: 12, textAlign: "center", marginTop: 4 },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 6 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rememberText: { fontSize: 13, fontWeight: "600" },
  forgotText: { fontSize: 13, fontWeight: "700" },
  submitBtn: { padding: 16, borderRadius: 16, alignItems: "center", marginTop: 12 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  switchModeRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
});
