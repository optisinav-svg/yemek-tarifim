import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "./screen-container";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export function AuthGate({ children, isAuthenticated, onLoginSuccess }: { children: React.ReactNode; isAuthenticated: boolean; onLoginSuccess: () => void }) {
  const [step, setStep] = useState<"login" | "register" | "verify" | "password" | "forgot">("login");
  
  // Form alanları
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Beni hatırla kontrolü
  useEffect(() => {
    AsyncStorage.getItem("saved_email").then((saved) => {
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    });
  }, []);

  const requestVerificationMutation = trpc.authCustom.requestVerificationCode.useMutation();
  const verifyCodeMutation = trpc.authCustom.verifyCode.useMutation();
  const setPasswordMutation = trpc.authCustom.setPassword.useMutation();
  const loginMutation = trpc.authCustom.loginWithPassword.useMutation();
  const forgotPasswordMutation = trpc.authCustom.forgotPassword.useMutation();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleRegisterStart = async () => {
    if (!name || !surname || !email) {
      Alert.alert("Eksik Alan", "Lütfen ad, soyad ve e-posta alanlarını doldurun.");
      return;
    }
    setLoading(true);
    try {
      const res = await requestVerificationMutation.mutateAsync({ name, surname, email });
      console.log("[AuthGate] Request verification result:", res);
      Alert.alert("Başarılı", "Doğrulama kodunuz e-posta adresinize gönderildi.");
      setStep("verify");
    } catch (err: any) {
      console.error("[AuthGate] Request verification error:", err);
      const msg = err?.message || JSON.stringify(err);
      Alert.alert("Kayıt Hatası (Detay)", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert("Hatalı Kod", "Lütfen 6 haneli doğrulama kodunu girin.");
      return;
    }
    setLoading(true);
    try {
      await verifyCodeMutation.mutateAsync({ email, code });
      Alert.alert("Doğrulandı", "E-postanız onaylandı. Şimdi şifrenizi oluşturun.");
      setStep("password");
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Kod doğrulanamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!username || username.length < 3) {
      Alert.alert("Kullanıcı Adı", "Kullanıcı adı en az 3 karakter olmalıdır.");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Şifre", "Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Şifre Uyuşmazlığı", "Girdiğiniz şifreler birbiriyle aynı değil.");
      return;
    }
    setLoading(true);
    try {
      await setPasswordMutation.mutateAsync({ email, password, confirmPassword, username });
      Alert.alert("Başarılı", "Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.");
      setStep("login");
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Şifre kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Eksik Bilgi", "Lütfen e-posta ve şifrenizi girin.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      if (rememberMe) {
        await AsyncStorage.setItem("saved_email", email);
      } else {
        await AsyncStorage.removeItem("saved_email");
      }
      Alert.alert("Hoş Geldiniz", `Merhaba ${res.user.name}, başarıyla giriş yaptınız.`);
      onLoginSuccess();
    } catch (err: any) {
      Alert.alert("Giriş Hatası", err.message || "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      Alert.alert("E-posta Gerekli", "Lütfen şifresini unuttuğunuz e-posta adresini yazın.");
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      Alert.alert("Gönderildi", "Şifre sıfırlama talimatları e-postanıza iletildi.");
      setStep("login");
    } catch (err: any) {
      Alert.alert("Hata", err.message || "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-6 justify-center bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-sm self-center bg-surface p-6 rounded-3xl shadow-md border border-border">
          <View className="items-center mb-6">
            <Text className="text-3xl font-extrabold text-primary mb-1">Gastronotlar</Text>
            <Text className="text-sm text-muted text-center">Mutfağın ve Lezzetin Dijital Rehberi</Text>
          </View>

          {/* GİRİŞ EKRANI */}
          {step === "login" && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-foreground text-center mb-2">Giriş Yap</Text>
              
              <View>
                <Text className="text-xs font-semibold text-muted mb-1">E-posta Adresi</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#9ba1a6"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Şifre</Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-xl p-3 pr-10 text-foreground"
                    placeholder="******"
                    placeholderTextColor="#9ba1a6"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity className="absolute right-3" onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#687076" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center justify-between my-1">
                <TouchableOpacity className="flex-row items-center gap-2" onPress={() => setRememberMe(!rememberMe)}>
                  <View className={`w-5 h-5 rounded border border-border items-center justify-center ${rememberMe ? "bg-primary" : "bg-background"}`}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                  </View>
                  <Text className="text-xs text-foreground">Beni Hatırla</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep("forgot")}>
                  <Text className="text-xs text-primary font-semibold">Şifremi Unuttum?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-primary py-3.5 rounded-xl items-center mt-2 active:opacity-85"
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-bold text-base">Giriş Yap</Text>}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-4 gap-1">
                <Text className="text-xs text-muted">Hesabınız yok mu?</Text>
                <TouchableOpacity onPress={() => setStep("register")}>
                  <Text className="text-xs text-primary font-bold">Hemen Kayıt Ol</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* KAYIT EKRANI: 1. Adım (Ad, Soyad, E-posta) */}
          {step === "register" && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-foreground text-center mb-2">Yeni Hesap Oluştur</Text>
              
              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Ad</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="Adınız"
                  placeholderTextColor="#9ba1a6"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Soyad</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="Soyadınız"
                  placeholderTextColor="#9ba1a6"
                  value={surname}
                  onChangeText={setSurname}
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-muted mb-1">E-posta Adresi</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#9ba1a6"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                className="bg-primary py-3.5 rounded-xl items-center mt-2 active:opacity-85"
                onPress={handleRegisterStart}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-bold text-base">Doğrulama Kodu Gönder</Text>}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-4 gap-1">
                <Text className="text-xs text-muted">Zaten hesabınız var mı?</Text>
                <TouchableOpacity onPress={() => setStep("login")}>
                  <Text className="text-xs text-primary font-bold">Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* VERIFY KOD EKRANI */}
          {step === "verify" && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-foreground text-center mb-1">E-posta Onayı</Text>
              <Text className="text-xs text-muted text-center mb-3">{email} adresine gönderilen 6 haneli kodu girin.</Text>

              <View>
                <TextInput
                  className="bg-background border border-border rounded-xl p-4 text-center text-2xl tracking-widest text-foreground font-bold"
                  placeholder="123456"
                  placeholderTextColor="#9ba1a6"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                className="bg-primary py-3.5 rounded-xl items-center mt-2 active:opacity-85"
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-bold text-base">Kodu Doğrula</Text>}
              </TouchableOpacity>

              <TouchableOpacity className="items-center mt-2" onPress={() => setStep("register")}>
                <Text className="text-xs text-muted underline">Geri Dön / E-postayı Değiştir</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ŞİFRE OLUŞTURMA EKRANI */}
          {step === "password" && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-foreground text-center mb-1">Şifre Belirleme</Text>
              <Text className="text-xs text-muted text-center mb-2">Kullanıcı adı ve şifrenizi iki kez girerek belirleyin.</Text>

              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Kullanıcı Adı</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="kullaniciadi"
                  placeholderTextColor="#9ba1a6"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Şifre Oluştur</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="En az 6 karakter"
                  placeholderTextColor="#9ba1a6"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-muted mb-1">Şifre Tekrar</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="Şifreyi tekrar girin"
                  placeholderTextColor="#9ba1a6"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <TouchableOpacity className="flex-row items-center gap-2" onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "checkbox" : "square-outline"} size={18} color="#0a7ea4" />
                <Text className="text-xs text-muted">Şifreyi Göster</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-primary py-3.5 rounded-xl items-center mt-2 active:opacity-85"
                onPress={handleSetPassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-bold text-base">Hesabı Tamamla</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ŞİFREMİ UNUTTUM EKRANI */}
          {step === "forgot" && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-foreground text-center mb-1">Şifre Sıfırlama</Text>
              <Text className="text-xs text-muted text-center mb-3">Kayıtlı e-posta adresinizi girin; size sıfırlama bağlantısı gönderelim.</Text>

              <View>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#9ba1a6"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                className="bg-primary py-3.5 rounded-xl items-center mt-2 active:opacity-85"
                onPress={handleForgot}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-bold text-base">Sıfırlama E-postası Gönder</Text>}
              </TouchableOpacity>

              <TouchableOpacity className="items-center mt-2" onPress={() => setStep("login")}>
                <Text className="text-xs text-primary font-semibold">Giriş Ekranına Dön</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
