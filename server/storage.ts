// Basit, kendi kendine yeten depolama katmanı.
//
// Daha önce burada eski "Manus/Forge" platformunun harici depolama
// servisi kullanılıyordu (BUILT_IN_FORGE_API_URL / BUILT_IN_FORGE_API_KEY).
// Bu proje artık Render üzerinde bağımsız çalıştığı için o servise erişim
// yok ve fotoğraf yükleme (profil fotoğrafı, tarif kapak fotoğrafı,
// "tarifi denedim" fotoğrafları) sessizce başarısız oluyordu.
//
// Yeni ekstra bir depolama servisi/anahtarı gerektirmemek için, resmi
// doğrudan "data URL" (base64 gömülü) olarak döndürüyoruz. Bu URL,
// veritabanındaki mevcut metin (TEXT) sütununa aynı şekilde yazılır ve
// <Image> bileşenleri tarafından doğrudan görüntülenebilir; ek bir dosya
// sunucusu veya veritabanı göçü (migration) gerekmez.

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const base64 = buffer.toString("base64");
  return { key, url: `data:${contentType};base64,${base64}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  // Artık harici imzalı URL üretimine ihtiyaç yok; storagePut zaten
  // doğrudan kullanılabilir bir data URL döndürüyor.
  return `/manus-storage/${normalizeKey(relKey)}`;
}
