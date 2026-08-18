# Expo Go bildirim uyarısı teşhisi

Ekran görüntüsündeki uyarı Expo SDK 53+ Android Expo Go sınırlamasıdır: uzak push bildirimleri Expo Go'da kullanılamaz; development build gerekir. Expo SDK 54 dokümanına göre yerel bildirimler Expo Go'da kullanılabilir. Projede `lib/kitchen-timer-view.tsx` dosyası `expo-notifications` paketini üst seviyede doğrudan içe aktarıyor ve sayaç bildirimi planlıyor. Uygulama içi sayaç sesini bu akıştan bağımsız korumak; Expo Go/store client ortamında bildirim modülünü hiç yüklememek; gerçek bildirim modülünü yalnızca uygun native ortamda dinamik içe aktarmak kararı alındı.

Expo Constants enum değerleri: `ExecutionEnvironment.StoreClient` (Expo Go), `Bare`, `Standalone`.
