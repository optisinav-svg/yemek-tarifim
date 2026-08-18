# Canlı web teşhisi — 18 Ağustos 2026

Saat 14:05 civarında canlı adresler tarayıcıyla kontrol edildi.

| Adres | Sonuç |
|---|---|
| https://gastronotlar.com/ | Sayfa başlığı `Error`; içerik yalnızca `Cannot GET /` |
| https://www.gastronotlar.com/ | Cloudflare/Render yönlendirmesiyle `https://gastronotlar.com/` adresine gidiyor; içerik yine yalnızca `Cannot GET /` |

Bu sonuç, alan adı ve SSL erişiminin bulunduğunu; fakat Render üzerinde çalışan üretim servisine ana sayfa route'unun veya statik Expo web çıktısının ulaşmadığını doğrular. Önceki yerel build testinin başarılı olması canlı Render deploy'ının güncel kodu çalıştırdığını kanıtlamaz.

Bir sonraki teşhis adımı: Render servisinin canlı endpoint'i (`gastronotlar.onrender.com`) ile `/api/health` ve `/` yanıtlarını karşılaştırmak; ardından GitHub'daki son commit ile Render'ın son deploy commit/build loglarının aynı olup olmadığını kontrol etmek.

## Render doğrudan servis kontrolü

| Adres | Sonuç |
|---|---|
| https://gastronotlar.onrender.com/ | `Cannot GET /` |
| https://gastronotlar.onrender.com/api/health | `{"ok":true,"timestamp":1787061951954}` |

Sonuç: Render servisi çalışıyor ve yeni/uygun bir sunucu API'si yanıt veriyor; yalnızca web kök route'u üretim sürecinde tanımlı değil veya Render eski/başka bir başlangıç dosyasını çalıştırıyor. Bu, DNS/SSL sorunu olmadığını ve problemin doğrudan Render build/start çıktısı veya çalıştırılan bundle içinde olduğunu gösterir.

İzlenecek teknik olasılıklar: (1) Render Start Command eski `dist/index.js` dosyasını çalıştırıyor olabilir; güncel build `dist/server/index.js` üretir. (2) Render Build Command güncel `pnpm run build` betiğini kullanmıyor olabilir. (3) Render deploy'ı GitHub'daki son değişiklikleri çekmemiş olabilir. (4) Çalışan bundle, kaynak dosyadaki statik middleware güncellemesini içermiyor olabilir.

## Render build hatası — NativeWind SHA-1

Yerel `pnpm run build` aynı güncel kodla başarıyla tamamlandı ve `dist/web` ile `dist/server` üretildi; yani kodun olağan build akışı yerelde kırılmıyor. Render hatası `react-native-css-interop/.cache/web.css` için Metro SHA-1 hesaplayamıyor. NativeWind issue #1158'de aynı sınıftaki `.cache/android.js`/`.cache/ios.js` SHA-1 hatalarının NativeWind sürüm düzeltmeleriyle giderildiği ve Metro `blockList`/symlink kontrollerinin ilgili olduğu görülüyor. İlk düşük riskli düzeltme: build öncesi `node_modules/react-native-css-interop/.cache` ve `dist` temizliği; ardından export ve server bundle. Sürüm yükseltme ancak temiz build başarısız olursa değerlendirilecek.

## NativeWind build düzeltmesi

İlk deneme yalnızca `react-native-css-interop/.cache` klasörünü silmekle yetmedi; temiz cache sonrası aynı SHA-1 hatası yeniden oluştu. Kök neden, `metro.config.js` içinde `forceWriteFileSystem: true` ayarının NativeWind’in Metro sanal modül yamasını devre dışı bırakmasıydı. Bu seçenek kaldırıldı. Ayrıca `scripts/clean-production-build.mjs`, Render build başlamadan `dist` ve NativeWind cache klasörlerini temizleyecek şekilde eklendi.

Bu iki değişiklikten sonra `pnpm run build` başarıyla tamamlandı: Expo web export `dist/web` oluşturdu ve esbuild `dist/server/index.js` oluşturdu. `pnpm run check` başarılı; Vitest sonucu 19 başarılı, 1 yapılandırma nedeniyle atlanan test.
