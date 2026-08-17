# Yemek Tarifim — Proje TODO

## Ürün kapsamı ve temel altyapı

- [x] Android, iOS ve web hedeflerini Expo tabanlı ortak kod yapısıyla başlatmak
- [x] Mobil arayüz tasarım planını `design.md` dosyasına yazmak
- [ ] Türkiye ile başlayıp ileride dünya mutfaklarına genişleyebilecek ülke/mutfak veri modelini oluşturmak
- [x] Tarif ekleme ekranında tarifin ülkesini seçebilme ve seçilen ülkeyi kaydetme
- [ ] Güvenli sunucu, veritabanı, dosya depolama ve tRPC API sınırlarını yapılandırmak
- [x] Uygulama markası, tema renkleri ve erişilebilirlik tokenlarını uygulamak
- [x] Benzersiz uygulama logosu üretmek ve Expo marka yapılandırmasına bağlamak

## Kullanıcı ve güvenlik

- [x] Kullanıcı kaydı/girişi ve güvenli oturum yönetimini tamamlamak
- [ ] Profil adı, soyadı, kullanıcı adı, e-posta ve profil fotoğrafı düzenleme akışını tamamlamak
- [ ] Sunucu tarafı kimlik doğrulama, rol tabanlı yetkilendirme ve admin koruması eklemek
- [ ] Girdi doğrulama, XSS/SQL injection önlemleri, rate limiting ve medya doğrulaması eklemek
- [ ] Hassas işlemler için audit kaydı ve kullanıcıya güvenli hata mesajları eklemek
- [ ] Hesap silme, çıkış ve güvenlilik/gizlilik ayarlarını tamamlamak

## Ülke ve kategori keşfi

- [x] Türkiye ülke seçimini ve bayrak kartlarını eklemek
- [x] İleride ülke eklemeye uygun ülke/mutfak seçici oluşturmak
- [x] “Tümü” seçeneğinde seçili kategorinin tüm ülkelerden tariflerini göstermek
- [x] Sistem kategorilerini ve kullanıcı tarafından eklenen grupları oluşturmak
- [x] Kategori altında tarif sayısını göstermek
- [ ] Günlük grup ekleme sınırını sunucu tarafında uygulamak

## Tarifler

- [x] Yeni tarifleri en yeniden eskiye listelemek
- [x] İki sütunlu tarif kartı görünümünü oluşturmak
- [x] Tarif oluşturma ve düzenleme formunu geliştirmek
- [x] Tarif sahibi profil fotoğrafı ve kullanıcı adını göstermek
- [x] Malzemeleri miktar, birim ve ad olarak yapılandırılmış biçimde saklamak
- [x] Hazırlama, yapılış ve toplam süre alanlarını eklemek
- [x] Tarife porsiyon sayısı eklemek
- [x] En fazla üç fotoğraf ve video ekleme akışını oluşturmak
- [x] Fotoğraf/PDF/görselden metin aktarma için OCR akışını eklemek
- [x] OCR sonucunu yayın öncesi düzenleme ve onay ekranından geçirmek
- [ ] Kullanıcının sistem klavyesiyle sesli yazma kullanımını desteklemek
- [ ] Kullanıcı tariflerinin tüm kullanıcılarca görülebilmesini sağlamak
- [x] Kullanıcının kendi tarifini düzenleyebilmesini sağlamak
- [ ] Tarif paylaşımını sistem paylaşım menüsüyle düz metin ve medya bağlantısı olarak eklemek
- [ ] Günlük tarif ekleme sınırını sunucu tarafında uygulamak

## Arama ve kişiselleştirme

- [x] Yemek adına göre arama eklemek
- [x] Malzemeye göre arama eklemek
- [x] En fazla beş malzemeyle eşleşme oranına göre arama sonuçları oluşturmak
- [x] Favorilere/listeme ekleme ve listeden çıkarma akışını eklemek
- [ ] Tarif yorumları ve fotoğraflı deneme paylaşımı için veri modelini hazırlamak
- [ ] Tarif puanlama ve raporlama kapsamını değerlendirmek

## Porsiyon ve ölçü birimleri

- [x] Tarif sahibinin baz porsiyon sayısını belirlemesini sağlamak
- [x] Kullanıcının porsiyon sayısını artırıp azaltabilmesini sağlamak
- [ ] Ölçüleri gram, kilogram, mililitre, litre, adet, çay kaşığı, yemek kaşığı ve bardak olarak yapılandırmak
- [ ] Metrik ve ABD ölçü sistemi tercihini eklemek
- [x] Güvenli dönüşümü olmayan “bir tutam/göz kararı” ölçülerini sabit tutmak ve açıklamak
- [x] Porsiyon ve ölçü dönüşümü için birim testleri yazmak

## Alışveriş listesi

- [x] Tariften tüm malzemeleri alışveriş listesine eklemek
- [x] Aynı malzemeleri uyumlu birimlerde birleştirmek
- [x] Liste öğelerini işaretleyebilmek ve temizleyebilmek
- [x] Uygulama içinde kalıcı kullanıcı alışveriş listesi oluşturmak
- [x] Market modunda ekranın kapanmasını önlemek
- [x] Düz metin olarak sistem paylaşım menüsüne göndermek
- [ ] Sonraki aşamada PDF/görsel dışa aktarma için mimariyi açık bırakmak

## Pişirme ve zamanlayıcı

- [x] Adım adım pişirme modunu geliştirmek
- [x] Pişirme modunda ekranı açık tutmak
- [x] Büyük yazı ve kolay dokunma alanlarıyla sonraki/önceki adım gezinmesi eklemek
- [x] Saat ve dakika için dairesel zamanlayıcı arayüzü oluşturmak
- [ ] Zamanlayıcı çalışırken tüm ekranlarda yüzen kalan süre göstergesi eklemek
- [ ] Süre bitiminde uygulama içi sesli/işitsel uyarı eklemek
- [ ] Arka plan bildirimleri için platform uygunluğunu doğrulamak

## Dil, tema ve profil

- [ ] Dil seçici ve çeviri görünümünü eklemek
- [ ] Orijinal tarifi çeviriyle birlikte erişilebilir tutmak
- [ ] Karanlık tema seçeneğini tamamlamak
- [x] Alt sekmeleri Ana Sayfa, Gruplar, Ara, Favoriler ve Zamanlayıcı olarak yapılandırmak
- [x] Geri ve ana sayfaya dönüş davranışlarını doğrulamak

## Admin ve moderasyon

- [ ] Admin rolünü yalnızca sunucu tarafında doğrulamak
- [ ] Tarif, fotoğraf ve video silme/gizleme işlemlerini eklemek
- [ ] Kullanıcı uyarma, engelleme ve hesap silme işlemlerini eklemek
- [ ] Kullanıcı içeriklerini raporlama ve inceleme akışını eklemek
- [ ] Uygulamayı kapatmak yerine bakım modu eklemek
- [ ] Kritik admin işlemlerinde onay ve audit kaydı kullanmak

## Kalite ve teslim

- [x] Birim ve sunucu API testlerini yazmak
- [x] Tarif, porsiyon, alışveriş listesi ve zamanlayıcı akışlarını doğrulamak
- [ ] Android, iOS ve web için platform koşullu davranışları kontrol etmek
- [x] TypeScript, lint ve test kontrollerini geçirmek
- [ ] Kullanıcı akışlarında boş onPress ve ölü ekran bırakmamak
- [ ] GitHub deposunu bağlamak ve açıklayıcı README hazırlamak
- [x] İlk tamamlanmış sürüm için checkpoint oluşturmak

## GitHub aktarım geçmişi

- [x] İlk çalışan sürümü `optisinav-svg/yemek-tarifim` GitHub deposunun `main` dalına göndermek (commit: `9eb3136`, 17.08.2026)
- [ ] Sonraki geliştirmelerde GitHub’a düzenli commit ve sürüm etiketleri eklemek
- [ ] Expo Go QR önizleme bağlantısını telefon üzerinde doğrulamak ve bağlantı sorununu gidermek

## Sonraki aşama: kullanıcı hesabı ve sunucu senkronizasyonu

- [x] Kullanıcı hesabı oluşturma/giriş ekranlarını mevcut kimlik doğrulama altyapısına bağlamak
- [x] Oturum durumunu Android, iOS ve web üzerinde güvenli biçimde yönetmek
- [x] Yerel kayıtlı tarifleri ve alışveriş listesini kullanıcı hesabına sunucu üzerinden senkronize etmek
- [x] Kullanıcı tariflerinin sahiplik ve görünürlük kurallarını uçtan uca uygulamak
- [x] Oturum açma, çıkış, yetkisiz erişim ve veri senkronizasyonu testlerini eklemek
