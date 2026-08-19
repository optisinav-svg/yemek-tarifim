import React, { useState } from "react";
import { Alert, ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData: { email: string; name: string; username: string }) => void;
}

type AuthMode = "login" | "register" | "verify" | "password" | "forgot";

export function AuthModal({ visible, onClose, onSuccess }: AuthModalProps) {
  const colors = useColors();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [securePassword, setSecurePassword] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const requestVerificationMutation = trpc.authCustom.requestVerificationCode.useMutation();
  const verifyCodeMutation = trpc.authCustom.verifyCode.useMutation();
  const setPasswordMutation = trpc.authCustom.setPassword.useMutation();
  const loginMutation = trpc.authCustom.loginWithPassword.useMutation();
  const forgotPasswordMutation = trpc.authCustom.forgotPassword.useMutation();

  const completeSession = async (result: any) => {
    const returnedUser = result.user;
    const userInfo: Auth.User = {
      id: returnedUser.id,
      openId: returnedUser.openId ?? `email_${returnedUser.id}`,
      name: returnedUser.name ?? null,
      surname: returnedUser.surname ?? null,
      username: returnedUser.username ?? null,
      email: returnedUser.email ?? email,
      loginMethod: returnedUser.loginMethod ?? "email",
      imageUrl: returnedUser.imageUrl ?? null,
      role: returnedUser.role ?? "user",
      accountStatus: returnedUser.accountStatus ?? "active",
      lastSignedIn: returnedUser.lastSignedIn ? new Date(returnedUser.lastSignedIn) : new Date(),
    };

    if (result.sessionToken) {
      await Auth.setSessionToken(result.sessionToken);
    }
    await Auth.setUserInfo(userInfo);
    onSuccess({
      email: userInfo.email ?? email,
      name: userInfo.name ?? "Gastronotlar üyesi",
      username: userInfo.username ?? username,
    });
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim() || !surname.trim() || !email.trim()) {
          throw new Error("Kayıt için ad, soyad ve e-posta alanları gereklidir.");
        }
        await requestVerificationMutation.mutateAsync({ name: name.trim(), surname: surname.trim(), email: email.trim().toLowerCase() });
        setMode("verify");
        Alert.alert("Doğrulama e-postası gönderildi", `${email} adresine gelen 6 haneli kodu girin.`);
        return;
      }

      if (mode === "verify") {
        if (!/^\d{6}$/.test(verificationCode)) {
          throw new Error("Lütfen 6 haneli doğrulama kodunu girin.");
        }
        await verifyCodeMutation.mutateAsync({ email: email.trim().toLowerCase(), code: verificationCode });
        setMode("password");
        Alert.alert("E-posta doğrulandı", "Şimdi kullanıcı adınızı ve şifrenizi oluşturun.");
        return;
      }

      if (mode === "password") {
        if (!username.trim() || username.trim().length < 3) {
          throw new Error("Kullanıcı adı en az 3 karakter olmalıdır.");
        }
        if (password.length < 6) {
          throw new Error("Şifre en az 6 karakter olmalıdır.");
        }
        if (password !== confirmPassword) {
          throw new Error("Şifreler birbiriyle aynı değil.");
        }
        const regResult = await setPasswordMutation.mutateAsync({ email: email.trim().toLowerCase(), password, confirmPassword, username: username.trim() });
        if (regResult && "sessionToken" in regResult && regResult.sessionToken) {
          await completeSession(regResult);
        } else {
          const result = await loginMutation.mutateAsync({ email: email.trim().toLowerCase(), password });
          await completeSession(result);
        }
        return;
      }

      if (mode === "forgot") {
        if (!email.trim()) throw new Error("Lütfen kayıtlı e-posta adresinizi girin.");
        await forgotPasswordMutation.mutateAsync({ email: email.trim().toLowerCase() });
        Alert.alert("E-posta gönderildi", "Şifre sıfırlama talimatları e-posta adresinize gönderildi.");
        setMode("login");
        return;
      }

      if (!email.trim() || !password) {
        throw new Error("Lütfen e-posta ve şifre alanlarını doldurun.");
      }
      const result = await loginMutation.mutateAsync({ email: email.trim().toLowerCase(), password });
      if (!rememberMe) {
        // Oturum güvenlik politikası sunucu çerezini etkileyemese de kayıtlı e-posta tutulmaz.
        setEmail("");
      }
      await completeSession(result);
    } catch (error) {
      Alert.alert("İşlem başarısız", error instanceof Error ? error.message : "İşlem tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Gastronotlar'a Giriş Yap" : mode === "register" ? "Yeni Hesap Oluştur" : mode === "verify" ? "E-posta Doğrulama" : mode === "password" ? "Şifrenizi Oluşturun" : "Şifremi Unuttum";
  const submitLabel = mode === "login" ? "Giriş Yap" : mode === "register" ? "Doğrulama Kodu Gönder" : mode === "verify" ? "Kodu Doğrula" : mode === "password" ? "Hesabı Tamamla" : "Sıfırlama E-postası Gönder";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]} accessibilityLabel="Kapat">
              <IconSymbol name="close" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {mode === "register" && (
              <>
                <Label text="Ad" colors={colors} />
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="Adınız" placeholderTextColor={colors.muted} value={name} onChangeText={setName} autoCapitalize="words" />
                <Label text="Soyad" colors={colors} />
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="Soyadınız" placeholderTextColor={colors.muted} value={surname} onChangeText={setSurname} autoCapitalize="words" />
              </>
            )}

            {mode !== "verify" && mode !== "password" && (
              <>
                <Label text="E-posta Adresi" colors={colors} />
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="ornek@mail.com" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </>
            )}

            {mode === "verify" && (
              <>
                <Text style={[styles.hint, { color: colors.muted }]}>{email} adresine gönderilen 6 haneli kodu girin.</Text>
                <TextInput style={[styles.input, styles.codeInput, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="123456" placeholderTextColor={colors.muted} value={verificationCode} onChangeText={setVerificationCode} keyboardType="number-pad" maxLength={6} />
              </>
            )}

            {mode === "password" && (
              <>
                <Text style={[styles.hint, { color: colors.muted }]}>{email} adresi doğrulandı.</Text>
                <Label text="Kullanıcı Adı" colors={colors} />
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="kullaniciadi" placeholderTextColor={colors.muted} value={username} onChangeText={setUsername} autoCapitalize="none" />
                <View style={styles.passwordHeader}>
                  <Label text="Şifre" colors={colors} />
                  <Pressable onPress={() => setSecurePassword(!securePassword)}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{securePassword ? "Göster" : "Gizle"}</Text></Pressable>
                </View>
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="En az 6 karakter" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry={securePassword} />
                <Label text="Şifre Tekrar" colors={colors} />
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="Şifreyi tekrar girin" placeholderTextColor={colors.muted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={securePassword} />
              </>
            )}

            {(mode === "login") && (
              <>
                <View style={styles.passwordHeader}>
                  <Label text="Şifre" colors={colors} />
                  <Pressable onPress={() => setSecurePassword(!securePassword)}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{securePassword ? "Göster" : "Gizle"}</Text></Pressable>
                </View>
                <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} placeholder="En az 6 karakter" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry={securePassword} />
                <View style={styles.optionsRow}>
                  <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.rememberRow}><View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: rememberMe ? colors.primary : "transparent" }]}>{rememberMe && <IconSymbol name="check" size={12} color="#FFFFFF" />}</View><Text style={[styles.rememberText, { color: colors.foreground }]}>Beni Hatırla</Text></Pressable>
                  <Pressable onPress={() => setMode("forgot")}><Text style={[styles.forgotText, { color: colors.primary }]}>Şifremi Unuttum</Text></Pressable>
                </View>
              </>
            )}

            <Pressable onPress={() => void handleSubmit()} style={[styles.submitBtn, { backgroundColor: colors.primary }]} disabled={loading} accessibilityRole="button">
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>{submitLabel}</Text>}
            </Pressable>

            <View style={styles.switchModeRow}>
              {mode === "login" && <><Text style={{ color: colors.muted }}>Hesabınız yok mu? </Text><Pressable onPress={() => setMode("register")}><Text style={{ color: colors.primary, fontWeight: "700" }}>Kayıt Ol</Text></Pressable></>}
              {(mode === "register" || mode === "password" || mode === "verify") && <Pressable onPress={() => setMode("login")}><Text style={{ color: colors.primary, fontWeight: "700" }}>Giriş Ekranına Dön</Text></Pressable>}
              {mode === "forgot" && <Pressable onPress={() => setMode("login")}><Text style={{ color: colors.primary, fontWeight: "700" }}>Giriş Ekranına Dön</Text></Pressable>}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Label({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={[styles.label, { color: colors.muted }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 16 },
  content: { borderWidth: 1, borderRadius: 24, padding: 20, maxHeight: "90%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "900", flex: 1, paddingRight: 12 },
  closeBtn: { padding: 8, borderRadius: 12 },
  scroll: { gap: 12, paddingBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  passwordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15 },
  codeInput: { textAlign: "center", letterSpacing: 6, fontSize: 22 },
  hint: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 6 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rememberText: { fontSize: 13, fontWeight: "600" },
  forgotText: { fontSize: 13, fontWeight: "700" },
  submitBtn: { padding: 16, borderRadius: 16, alignItems: "center", marginTop: 12 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  switchModeRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
});
