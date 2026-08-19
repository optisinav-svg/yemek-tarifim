import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function useMemberGate() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const requireMember = (action?: () => void) => {
    if (isAuthenticated) {
      action?.();
      return true;
    }
    pendingAction.current = action ?? null;
    setIsAuthModalVisible(true);
    return false;
  };

  const authModal = (
    <AuthModal
      visible={isAuthModalVisible}
      onClose={() => {
        setIsAuthModalVisible(false);
        pendingAction.current = null;
      }}
      onSuccess={() => {
        setIsAuthModalVisible(false);
        void refresh().then(() => {
          const action = pendingAction.current;
          pendingAction.current = null;
          action?.();
        });
      }}
    />
  );

  return { isAuthenticated, loading, requireMember, authModal };
}

export function MemberRequiredView({ title = "Üyelik gerekir", description, onLogin }: { title?: string; description: string; onLogin: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <IconSymbol name="person" size={30} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      <Pressable onPress={onLogin} style={[styles.button, { backgroundColor: colors.primary }]} accessibilityRole="button">
        <Text style={styles.buttonText}>Üye ol / Giriş yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 12 },
  iconWrap: { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 21, fontWeight: "900", textAlign: "center" },
  description: { fontSize: 14, lineHeight: 20, fontWeight: "600", textAlign: "center" },
  button: { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13, marginTop: 8 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
