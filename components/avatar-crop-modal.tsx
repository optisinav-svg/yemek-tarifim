import type { ThemeColorPalette } from "@/constants/theme";

type Props = {
  visible: boolean;
  imageUri: string | null;
  colors: ThemeColorPalette;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

/**
 * Native (iOS/Android) tarafında zaten işletim sisteminin kendi fotoğraf
 * kırpma/yakınlaştırma arayüzü kullanılıyor (ImagePicker'ın allowsEditing
 * seçeneği), bu yüzden bu özel web bileşenine gerek yok.
 */
export function AvatarCropModal(_props: Props) {
  return null;
}
