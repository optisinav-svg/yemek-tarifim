import { Component, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Bir yerde React render sırasında beklenmedik bir hata olursa (örneğin
 * kodda bir yazım hatası, tanımsız bir değişken vb.), React tüm ekranı
 * boşaltıp "beyaz ekrana" düşer ve hiçbir ipucu vermez. Bu bileşen o
 * hatayı yakalayıp ekranda okunabilir şekilde gösterir, böylece sorunun
 * kaynağı hemen anlaşılabilir.
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[RootErrorBoundary] Yakalanan hata:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.subtitle}>Uygulama beklenmedik bir hatayla karşılaştı. Aşağıdaki bilgiyi geliştiriciyle paylaşabilirsiniz.</Text>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{this.state.error.message}</Text>
            {!!this.state.error.stack && <Text style={styles.stackText}>{this.state.error.stack}</Text>}
          </View>
          <Pressable style={styles.button} onPress={() => this.setState({ error: null })}>
            <Text style={styles.buttonText}>Tekrar dene</Text>
          </Pressable>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FFF8F0" },
  title: { fontSize: 20, fontWeight: "800", color: "#2D241F", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 13, color: "#806F63", textAlign: "center", marginBottom: 16 },
  errorBox: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E9DED4", padding: 14, width: "100%", maxHeight: 300 },
  errorText: { color: "#C95E58", fontWeight: "700", marginBottom: 8 },
  stackText: { color: "#806F63", fontSize: 11, fontFamily: "monospace" as any },
  button: { marginTop: 20, backgroundColor: "#E98B3A", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
});
