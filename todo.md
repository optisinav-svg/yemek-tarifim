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
- [x] Profil adı, soyadı, kullanıcı adı, e-posta ve profil fotoğrafı düzenleme akışını tamamlamak
- [x] Sunucu tarafı kimlik doğrulama, rol tabanlı yetkilendirme ve admin koruması eklemek
- [x] Girdi doğrulama, XSS/SQL injection önlemleri, rate limiting ve medya doğrulaması eklemek
- [x] Hassas işlemler için audit kaydı ve kullanıcıya güvenli hata mesajları eklemek
- [x] Hesap silme, çıkış ve güvenlilik/gizlilik ayarlarını tamamlamak

## Ülke ve kategori keşfi

- [x] Türkiye ülke seçimini ve bayrak kartlarını eklemek
- [x] İleride ülke eklemeye uygun ülke/mutfak seçici oluşturmak
- [x] “Tümü” seçeneğinde seçili kategorinin tüm ülkelerden tariflerini göstermek
- [x] Sistem kategorilerini ve kullanıcı tarafından eklenen grupları oluşturmak
- [x] Kategori altında tarif sayısını göstermek
- [x] Günlük grup ekleme sınırını sunucu tarafında uygulamak

## Tarifler

- [x] Yeni tarifleri en yeniden eskiye listelemek
- [x] İki sütunlu tarif kartı görünümünü oluşturmak
- [x] Tarif oluşturma ve düzenleme formunu geliştirmek
- [x] Tarif sahibi profil fotoğrafı ve kullanıcı adını göstermek
- [x] Malzemeleri miktar, birim ve ad olarak yapılandırılmış biçimde saklamak
- [x] Hazırlama, yapılış ve toplam süre alanlarını eklemek
- [x] Tarife porsiyon sayısı eklemek
- [x] En fazla üç fotoğraf ve video ekleme akışını oluşturmak
- [x] Yayınlanmış tarif detayında yüklenen fotoğraf/video galerisini göstermek
- [x] Fotoğraf/PDF/görselden metin aktarma için OCR akışını eklemek
- [x] OCR sonucunu yayın öncesi düzenleme ve onay ekranından geçirmek
- [x] Tarif ekleme ekranında görsel seçip OCR sonucunu başlık, ülke, malzeme ve adımlara aktarmak
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
- [x] Tarif yorumları ve fotoğraflı deneme paylaşımı için veri modelini hazırlamak
- [x] Tarif detayında yorum yazma ve fotoğraflı kullanıcı denemesi paylaşma akışını eklemek
- [x] Tarif puanlama ve raporlama kapsamını değerlendirmek

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
- [x] Sonraki aşamada PDF/görsel dışa aktarma için mimariyi açık bırakmak

## Pişirme modu ve zamanlayıcı

- [x] Süre başlatıldığında ekranda her sayfada görünen kalıcı küçük sayaç (widget) ve bitişte sesli/titreşimli uyarı

- [x] Adım adım pişirme modunu geliştirmek
- [x] Pişirme modunda ekranı açık tutmak
- [x] Büyük yazı ve kolay dokunma alanlarıyla sonraki/önceki adım gezinmesi eklemek
- [x] Saat ve dakika için dairesel zamanlayıcı arayüzü oluşturmak
- [x] Zamanlayıcı çalışırken tüm ekranlarda yüzen kalan süre göstergesi eklemek
- [x] Süre bitiminde uygulama içi sesli/işitsel uyarı eklemek
- [x] Arka plan bildirimleri için platform uygunluğunu doğrulamak

## Dil, tema ve profil

- [x] Dil seçici ve çeviri görünümünü eklemek
- [x] Orijinal tarifi çeviriyle birlikte erişilebilir tutmak
- [x] Karanlık tema seçeneğini tamamlamak
- [x] Alt sekmeleri Ana Sayfa, Gruplar, Ara, Favoriler ve Zamanlayıcı olarak yapılandırmak
- [x] Geri ve ana sayfaya dönüş davranışlarını doğrulamak

## Admin ve moderasyon

- [x] Admin rolünü yalnızca sunucu tarafında doğrulamak
- [x] Tarif, fotoğraf ve video silme/gizleme işlemlerini eklemek
- [x] Kullanıcı uyarma, engelleme ve hesap silme işlemlerini eklemek
- [x] Kullanıcı içeriklerini raporlama ve inceleme akışını eklemek
- [x] Uygulamayı kapatmak yerine bakım modu eklemek
- [x] Kritik admin işlemlerinde onay ve audit kaydı kullanmak

## Kalite ve teslim

- [x] Birim ve sunucu API testlerini yazmak
- [x] Tarif, porsiyon, alışveriş listesi ve zamanlayıcı akışlarını doğrulamak
- [x] Android, iOS ve web için platform koşullu davranışları kontrol etmek
- [x] TypeScript, lint ve test kontrollerini geçirmek
- [x] Kullanıcı akışlarında boş onPress ve ölü ekran bırakmamak
- [x] GitHub deposunu bağlamak ve açıklayıcı README hazırlamak
- [x] İlk tamamlanmış sürüm için checkpoint oluşturmak

## GitHub aktarım geçmişi

- [x] İlk çalışan sürümü `optisinav-svg/yemek-tarifim` GitHub deposunun `main` dalına göndermek (commit: `9eb3136`, 17.08.2026)
- [ ] Sonraki geliştirmelerde GitHub’a düzenli commit ve sürüm etiketleri eklemek
- [x] Expo Go QR önizleme bağlantısını telefon üzerinde doğrulamak ve bağlantı sorununu gidermek
- [ ] Sandbox aktif değil uyarısını giderip telefon için yeni Expo önizleme bağlantısını doğrulamak

## Sonraki aşama: kullanıcı hesabı ve sunucu senkronizasyonu

- [x] Kullanıcı hesabı oluşturma/giriş ekranlarını mevcut kimlik doğrulama altyapısına bağlamak
- [x] Oturum durumunu Android, iOS ve web üzerinde güvenli biçimde yönetmek
- [x] Yerel kayıtlı tarifleri ve alışveriş listesini kullanıcı hesabına sunucu üzerinden senkronize etmek
- [x] Kullanıcı tariflerinin sahiplik ve görünürlük kurallarını uçtan uca uygulamak
- [x] Oturum açma, çıkış, yetkisiz erişim ve veri senkronizasyonu testlerini eklemek

- [x] Sayaç süresi bitince Android ve iOS'ta güvenilir sesli uyarı vermek; dokununca istemeden kapanmasını önlemek
- [x] Sayaç penceresini kullanıcı parmağıyla sürükleyerek ekran içinde taşıyabilmek ve konumu korumak

## Audit ile doğrulanan kalan işler

- [x] Sunucu güvenliği için rate limit, audit log ve hesap silme uçlarını gerçek uygulama akışına bağlamak
- [ ] Dünya mutfakları ülke/kategori veri modelini ve kullanıcı tariflerinin tüm kullanıcılara görünür listeleme akışını tamamlamak
- [x] Günlük tarif ve grup ekleme sınırlarını sunucu tarafında uygulamak
- [ ] Sistem klavyesi sesli yazma, tarif paylaşımı ve puanlama/raporlama akışlarını tamamlamak
- [ ] Metrik/ABD ölçü sistemi ve tüm tarif ölçü birimlerini yapılandırmak
- [ ] Gerçek dil/çeviri seçimini ve profil hesap/gizlilik ayarlarını tamamlamak
- [ ] Admin moderasyon ekranını rapor, kullanıcı ve içerik işlemleriyle tamamlamak
- [ ] Düzenli GitHub commit ve sürüm etiketi akışını belgelemek

## Kullanıcı geri bildirimi — 17.08.2026

- [ ] Tarif paylaş düğmesinin paylaşım menüsünü açıp ekranda kalmasını düzeltmek
- [ ] Yüzen sayaç penceresini parmakla sürüklenebilir yapmak ve konum sınırlarını korumak
- [ ] Sayaç bitiş uyarısını daha uzun ve belirgin bir sesle iyileştirmek
- [ ] Tarif sahibi dokunmasını kişi profiline ve kişinin tarif listesine yönlendirmek

## Kullanıcı geri bildirimi — tarif grupları

- [x] “Tümünü gör” seçeneğini ayrı tarif grupları ekranına yönlendirmek
- [x] Ayrı tarif grupları ekranında tüm grupları, tarif sayılarını ve grup detayına geçişi göstermek
- [x] Grup kartına dokunmayı ilgili grubun tarif listesine yönlendirmek
- [x] Gereksinim netleştirmesi: Tarif gruplarındaki “Tümünü gör” yalnızca tüm grup kartlarının bulunduğu liste ekranını açacak; tarif listesi açmayacak.
- [x] Tarif grupları ekranında üstte ülke mutfaklarını, altta tüm tarif gruplarını göstermek
- [x] Ülke seçiminin altındaki grup sayılarını ve grup bağlantılarını aktif ülkeye göre güncellemek

## Kullanıcı geri bildirimi — tarif püf noktası

- [x] Yeni tarif formuna tarif yazarının yazabileceği “Püf noktası” alanını eklemek
- [x] Püf noktası metnini sunucuda güvenli biçimde saklamak ve düzenleme akışında korumak
- [x] Kayıtlı püf noktasını tarif detayında göstermek

## Kullanıcı geri bildirimi — kayıt ve profil bilgileri

- [ ] Kayıt akışında e-posta, ad, soyad, kullanıcı adı, parola ve profil fotoğrafı alanlarını desteklemek
- [ ] Kullanıcı adı benzersizliği ve parola güvenliği doğrulamalarını sunucu tarafında uygulamak
- [ ] Ana menüdeki kullanıcı düğmesini profil bilgileri düzenleme ekranına bağlamak
- [ ] Profil ekranından ad, soyad, kullanıcı adı, e-posta, parola ve profil fotoğrafı değişikliklerini güvenli biçimde kaydetmek

## Kullanıcı geri bildirimi — serbest sayaç süresi

- [ ] Sabit 5/10/20 dakika seçenekleri yerine saat ve dakika seçicisi eklemek
- [ ] Sayaç seçicisini 00:00 başlangıç değerinde açmak ve geçersiz sıfır süreyi engellemek
- [ ] Seçilen süreyi mevcut sürüklenebilir sayaç ve bitiş uyarısı akışına bağlamak

## Kullanıcı geri bildirimi — grup ekleme

- [x] Ülke ve tarif grupları ekranına “Grup ekle” butonu eklemek
- [x] Yeni grup adını seçili ülkeye bağlayıp güvenli biçimde kaydetmek
- [x] Yeni grubu grup listesinde ve ilgili tarif filtrelerinde göstermek
- [x] Günlük grup oluşturma sınırını sunucu tarafında uygulamak

## Kullanıcı geri bildirimi — e-posta doğrulamalı hesap akışı

- [ ] Kayıtta e-posta, ad, soyad ve parola alıp doğrulama e-postası göndermek
- [ ] E-posta doğrulanmadan hesabı etkinleştirmemek
- [ ] Giriş ekranında e-posta, parola ve güvenli “Beni hatırla” seçeneği sunmak
- [ ] “Şifremi unuttum” akışında tek kullanımlık, süreli parola sıfırlama e-postası göndermek
- [ ] Parola sıfırlama ekranını Android, iOS ve Web ile uyumlu tamamlamak

## Teslimat — GitHub aktarımı

- [ ] E-posta doğrulamalı kayıt ve parola sıfırlama özellikleri tamamlandıktan sonra son checkpoint’i GitHub aktarımına hazırlamak
- [ ] GitHub deposuna aktarım durumunu doğrulamak ve kullanıcıya net aktarım özeti vermek
- [ ] Konuşulanların dışından, .com ihtimali yüksek ve Google Play çakışması olmayan 5 yeni isim adayını üretmek ve araştırmasını yapmak
- [x] Daha önce konuşulan tüm adları (Sofra Rotaları, Lezzet Haritası, Tarif Pusulası, Pişir Noktası, Tabak Defteri vb.) hariç tutarak 5 yeni isim adayını üretmek: Mutfak Atölyesi, Tencere Rotası, Pişirme Rehberi, Lezzet Laboratuvarı, Sofra Notları.
- [x] mutfaksanatları.com adresini ve “mutfak” kelimesini içeren yeni özgün alan adı adaylarını araştırmak ve doğrulamak
- [x] “Şef” kelimesini içeren mevcut web sitelerini, tarif platformlarını ve Google Play uygulamalarını araştırmak
- [x] Sayaç widget’ını ekran içinde sürüklemek için dokunma alanını yeniden düzenlemek ve konum saklamasını doğrulamak
- [x] En az 15 saniye süren, yüksek algılanan zırıltılı sayaç alarmı üretmek ve uygulamaya bağlamak
- [x] Mutfak, yemek, lezzet, leziz, şef ve tarif kelimeleriyle marka adaylarını web, alan adı ve Google Play ön taramasından geçirmek
## Kullanıcı geri bildirimi — son erteleme kararı (17.08.2026)

- [ ] Sayaç zil sesi yüksekliği ve türü iyileştirmesi şimdilik ertelendi (mevcut standart uyarı sesi kullanılacak).
- [ ] Sayaç penceresini sürükleyerek yer değiştirme özelliği şimdilik ertelendi (widget sağ üst köşede sabit kalacak).
- [x] Mevcut tüm tamamlanmış özellikler GitHub deposuna aktarılacak.
## Kullanıcı yeni istekleri — 17.08.2026 (Son Eklemeler)

- [ ] Tüm form ve not yazma alanlarına sesle yazma simgesi ve sistem klavyesi entegrasyonu eklemek
- [ ] Sabah, öğle, akşam ve saatli ara öğünlerden oluşan, haftalık menüleri otomatik reyonlu alışveriş listesiyle birleştiren takvim planlayıcı eklemek
- [ ] Pişirme modunda eller serbest sesli adım ilerletme ve ekranın kapanmasını önleyen akıllı ekran koruma modu eklemek
- [x] Tüm yazı yazılacak ekranlarda sesle yazma simgesi ve gerçek dikte/sesli metin girişi
- [x] Alt menüye (Ana Sayfa, Ara, Listem, Market, Zamanlayıcı, Takvim) Takvim sekmesinin eklenmesi
- [x] Eller serbest pişirme modunda sesli komutlarla (ileri, geri, dur, başlat) adım ilerletme
