import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { ThemeColorPalette } from "@/constants/theme";

const OUTPUT_SIZE = 480; // px, kaydedilen kare fotoğrafın boyutu
const VIEWPORT_SIZE = 280; // px, ekranda gösterilen kırpma alanı

type Props = {
  visible: boolean;
  imageUri: string | null;
  colors: ThemeColorPalette;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

/**
 * Web'de expo-image-picker'ın "allowsEditing" (kırpma) özelliği çalışmıyor
 * (tarayıcı bunu desteklemiyor). Bu bileşen, resmi fare tekerleği/dokunma
 * ile yakınlaştırıp sürükleyerek bir kare alan seçmeyi sağlayan, sadece
 * web'de kullanılan basit bir kırpma aracıdır.
 */
export function AvatarCropModal({ visible, imageUri, colors, onCancel, onConfirm }: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<View>(null);
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; startOffset: { x: number; y: number } }>({
    dragging: false,
    startX: 0,
    startY: 0,
    startOffset: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (visible) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [visible, imageUri]);

  useEffect(() => {
    if (!visible) return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const onPointerDown = (e: PointerEvent) => {
      dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, startOffset: offset };
      node.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setOffset({ x: dragState.current.startOffset.x + dx, y: dragState.current.startOffset.y + dy });
    };
    const onPointerUp = (e: PointerEvent) => {
      dragState.current.dragging = false;
      node.releasePointerCapture?.(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.0015)));
    };

    node.style.touchAction = "none";
    node.style.cursor = "grab";
    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerUp);
    node.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerUp);
      node.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, offset]);

  const handleConfirm = () => {
    if (!imgElRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Görüntüyü, kapladığı alan viewport'u tam doldursun diye ölçekle (cover),
    // sonra kullanıcının zoom/pan değerlerini aynı oranla uygula.
    const coverScale = Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height);
    const outputScale = OUTPUT_SIZE / VIEWPORT_SIZE;
    const finalScale = coverScale * zoom * outputScale;
    const drawWidth = naturalSize.width * finalScale;
    const drawHeight = naturalSize.height * finalScale;
    const drawX = OUTPUT_SIZE / 2 - drawWidth / 2 + offset.x * outputScale;
    const drawY = OUTPUT_SIZE / 2 - drawHeight / 2 + offset.y * outputScale;

    ctx.drawImage(imgElRef.current, drawX, drawY, drawWidth, drawHeight);
    onConfirm(canvas.toDataURL("image/jpeg", 0.7));
  };

  if (!imageUri) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Fotoğrafı Ayarla</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>Sürükleyerek konumlandır, fare tekerleğiyle yakınlaştır.</Text>

          <View ref={containerRef} style={[styles.viewport, { borderColor: colors.border }]}>
            {/* @ts-ignore - web-only native img element for canvas access */}
            <img
              ref={(el: HTMLImageElement | null) => {
                imgElRef.current = el;
              }}
              src={imageUri}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight });
              }}
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                userSelect: "none",
                pointerEvents: "none",
                objectFit: "cover",
                width: naturalSize.width > naturalSize.height ? "auto" : "100%",
                height: naturalSize.height >= naturalSize.width ? "auto" : "100%",
                maxWidth: "none",
              }}
            />
          </View>

          <View style={styles.zoomRow}>
            <Pressable onPress={() => setZoom((z) => Math.max(1, z - 0.2))} style={[styles.zoomBtn, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18 }}>−</Text></Pressable>
            <Text style={{ color: colors.muted, fontSize: 12, minWidth: 60, textAlign: "center" }}>Yakınlaştır</Text>
            <Pressable onPress={() => setZoom((z) => Math.min(4, z + 0.2))} style={[styles.zoomBtn, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18 }}>+</Text></Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>Vazgeç</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <IconSymbol name="check" size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Kullan</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 },
  sheet: { borderRadius: 22, padding: 20, width: "100%", maxWidth: 420, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  hint: { fontSize: 12, marginBottom: 16, textAlign: "center" },
  viewport: { width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, borderRadius: VIEWPORT_SIZE / 2, borderWidth: 2, overflow: "hidden", backgroundColor: "#00000010" },
  zoomRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  zoomBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 10, marginTop: 20, width: "100%" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 13 },
});
