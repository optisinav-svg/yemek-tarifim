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

- [ ] Gastronot.com, gastronot.com.tr alan adları ve mobil mağazalardaki varlık durumunu doğrula

- [ ] Gastronotlar.com için en hesaplı kayıt kuruluşu fiyat karşılaştırmasını tamamla

- [ ] Turhost ve Cloudflare güvenlik/kullanılabilirlik karşılaştırmasını tamamla

- [ ] Alan adı sağlayıcısı ile uzun vadeli iletişim ve Cloudflare/Turhost tercihini netleştir

- [ ] Cloudflare üzerinden gastronotlar.com satın alma adım adım yönlendirmesini başlat

## Gastronotlar.com ve E-posta Doğrulama Adımları

- [x] Cloudflare üzerinden gastronotlar.com alan adını aktif olarak tescil etmek
- [ ] Resend üzerinden alan adı doğrulama (DKIM/SPF) kayıtlarını hazırlamak
- [ ] Kullanıcıya Resend hesabı açma ve API anahtarını ekleme adımlarını tarif etmek
- [ ] Kullanıcıya Cloudflare DNS ekranına eklenecek TXT/CNAME kayıtlarını tek tek tarif etmek
- [ ] Sunucu tarafında e-posta doğrulama, yeniden gönderme ve şifre sıfırlama kodunu tamamlayıp test etmek

## Sıralı Yayın Planı (Web -> Google Play -> iOS)

- [ ] 1. Aşama: Gastronotlar web sürümünü yayınlamaya hazır hale getirmek, Resend e-posta doğrulaması ve Cloudflare DNS yönlendirmesini tamamlamak
- [ ] 2. Aşama: Google Play Store için uygulama paketini (AAB/APK) hazırlamak ve mağaza gereksinimlerini kontrol etmek
- [ ] 3. Aşama: iOS (App Store) için build altyapısını ve testflight hazırlıklarını tamamlamak

- [ ] Expo Go 502 port hatasını gidermek için geliştirme sunucusunu yeniden başlat ve yeni QR bağlantısı üret

- [ ] Expo Go önizlemesini ertele, gastronotlar.com web sürümü ve e-posta doğrulama akışına tam odaklan
- [ ] Canlı Render veritabanı kayıt ve şema hatasını kesin olarak teşhis etmek ve çözmek


## Web üretim sunucusu ve GET / düzeltmesi (18 Ağustos 2026)

- [x] Render servisinde `GET /` isteğinin neden uygulama HTML’i döndürmediğini denetle.
- [x] Expo web üretim çıktısının Render üretim sunucusundan doğru klasörden sunulmasını sağla.
- [x] Render’ın `PORT` değişkeniyle çalışan üretim başlangıç komutunu doğrula.
- [x] SPA yolları, ana sayfa ve API başlangıç akışını üretimde test et.\n- [x] optisinav-svg GitHub deposu yazma yetkisi ve üretim aktarım düzeltmesi\n- [x] Render üretim sunucusunda dist/web yolunun statik servis eşlemesini düzelt\n- [x] gastronotlar.com GET / isteğinin 200 dönmesini canlı test et
- [x] `https://gastronotlar.com` ve `https://www.gastronotlar.com` adreslerini bağımsız olarak doğrula.
- [ ] Web açılışı doğrulanmadan Google Play ve iOS mağaza hazırlığına geçme.
- [ ] Kullanıcıya yalnızca tek işlem ver; kullanıcı sonucu bildirmeden sonraki işlemi isteme.

> Not: Alan adı ve SSL doğrulandı; ancak `GET /` hatası nedeniyle web yayını henüz tamamlandı kabul edilmeyecek.

- [ ] Sayaç penceresini sürüklenebilir (Draggable) hale getirmek ve konumunu korumak
- [ ] Zil sesini güçlü, en az 15 saniye süren zırıltılı bir alarm döngüsüne dönüştürmek
- [ ] Pişirme modundaki çalışmayan "Sesli Kontrol Aktif" yazısını ve özelliğini kaldırmak
- [ ] "Tarifi paylaş" butonunun ana menüye dönme hatasını düzeltmek
- [ ] Alışveriş listesine el ile madde eklerken miktar (adet/gram) alanı eklemek
- [ ] Fotoğraftan tarif aktarma ekranına kamera ile fotoğraf çekme ve OCR akışını eklemek

- [ ] Takvim sekmesini alt menüye eklemek ve haftalık menü (sabah, öğle, akşam + en fazla iki saatli ara öğün, malzeme birleştirme) akışını görünür şekilde tamamlamak

- [ ] Google Takvim entegrasyonunu araştırmak: haftalık yemek planını kullanıcının seçtiği Google Takvim'e etkinlik olarak aktarabilmek; uygulama içi Takvim ekranından ayrı kapsam olarak tasarlamak
- [ ] Google Takvim bağlantısı için OAuth izinleri, yönlendirme adresleri ve güvenli token saklama akışını hazırlamak; kullanıcı onayı olmadan hesap erişimi başlatmamak

- [ ] ACİL: ESM production düzeltmesini GitHub'a aktar, Render deploy başlat ve gastronotlar.com ana sayfasını 200 yanıtıyla doğrula; web çalışmadan sonraki aşamaya geçme

- [ ] WEB SONRASI — Sayaç penceresi: telefonda parmakla tutulup farklı konuma sürüklenebilmeli; konum ekranda sabitlenmemeli ve uygulama yeniden açıldığında korunmalı
- [ ] WEB SONRASI — Sayaç alarmı: yüksek duyulabilirlikte gerçek ses kaynağıyla en az 15 saniye çalmalı ve iki tam tekrar yapmalı; cihaz sessiz/medya ses seviyesi kısıtlarını açıkça test et
- [ ] WEB SONRASI — Takvim: alt gezinme satırında görünür Takvim sekmesi olmalı ve açılabilmeli
- [ ] WEB SONRASI — Pişirme modu: sesli kontrol gerçekten çalışmıyorsa yanıltıcı “Sesli kontrol aktif” metni gösterilmemeli; çalışıyorsa gerçek ses komutuyla ileri/geri doğrulanmalı
- [ ] WEB SONRASI — Tarif paylaşma: tarif ekranındaki “Tarifi paylaş” mevcut çalışan paylaşım akışıyla aynı sistem paylaşım ekranını açmalı; ana sayfaya yönlendirmemeli

- [x] WEB SONRASI — Expo Go uyumluluğu: `expo-notifications` uzak bildirim modülünü Expo Go’da koşulsuz içe aktarmayı kaldır; konsoldaki uyarıyı temizle; gerçek uzak bildirim gereksinimini development build notu olarak koru

- [x] Render deploy hatası teşhisi: `react-native-css-interop/.cache/web.css` dosyası build sırasında SHA-1 okuma hatasına yol açıyor. Build betiğinde `npx expo export --platform web` adımının eksik olması veya node_modules önbelleğinin sızması düzeltilecek.

- [ ] Kullanıcı kayıt ve giriş ekranını istenen alanlarla (e-posta, ad, soyad, kullanıcı adı, şifre, beni hatırla, maskeli şifre, şifremi unuttum ve e-posta doğrulama) güncellemek ve doğrulamak

- [ ] Ana sayfayı doğrulanmamış ziyaretçiye kapat; uygulama ilk açılışta zorunlu Kayıt/Giriş ekranını göstermeli
- [ ] Kayıt akışında kullanıcı adı, soyadı ve e-posta al; e-posta onay kodu/bağlantısı doğrulanmadan ana sayfaya geçişe izin verme
- [ ] Doğrulama sonrasında şifreyi iki kez alıp eşleşmeyi zorunlu kıl; şifreyi güvenli biçimde sakla
- [ ] Giriş ekranında e-posta dolu, şifre maskeli ve “Beni Hatırla” seçili varsayılan durumunu oluştur; başarılı girişten sonra uygulamayı aç
- [ ] Giriş ekranındaki “Şifremi Unuttum” gerçek sıfırlama e-postası göndermeli
- [ ] Resend veya eşdeğer e-posta sağlayıcısını bağlamadan gerçek e-posta gönderimi tamamlandı sayma

- [ ] Kayıt formundaki SQL tablosu ve kolon adı uyumsuzluğunu Drizzle şeması ile eşitleyip kalıcı olarak çözmek
- [ ] Canlı Render kayıt SQL hatasını (Failed query) kesin olarak gidermek ve gastronotlar.com üzerinde bizzat test etmek

## İptal Edilen Özellikler
- [x] Takvim / Haftalık yemek planı (Kullanıcı isteğiyle tamamen kapsam dışı bırakıldı ve iptal edildi)

- [ ] Canlı kayıt akışında doğrulama e-postasının ulaşmaması sorununu Resend, gönderen adresi, API anahtarı ve sunucu loglarıyla uçtan uca teşhis etmek
- [ ] Doğrulama kodu e-postasını canlı ortamda gerçek bir kayıtla doğrulamak

- [ ] Resend anahtarı eklendikten sonraki canlı kayıt testinde e-posta ve kullanıcı geri bildirimi sorununu yeniden teşhis etmek
- [ ] Canlı kayıt isteğinin Render çalışan servisine ulaştığını ve Resend gönderim sonucunu doğrulamak

- [ ] Canlı web kayıt düğmesinin API isteğinin Render loglarında görünmemesi sorununu istemci API adresi ve tRPC yapılandırmasıyla teşhis etmek
- [ ] Canlı web istemcisi ile `/api/trpc` arasındaki kayıt isteğini uçtan uca doğrulamak

- [ ] Son canlı testte doğrulama e-postasının ulaşmaması ve kayıt sonrası kod ekranının açılmaması sorununu yeniden teşhis etmek
- [ ] PostgreSQL kayıt prosedürünün gerçek canlı şemayla çalıştığını doğrulamak
- [ ] Web kayıt formunda tRPC başarı/hata yanıtını görünür kullanıcı mesajına dönüştürmek

- [ ] Canlı kayıt formunun gerçek API endpointine ulaşıp ulaşmadığını Render loglarıyla doğrulamak
- [ ] PostgreSQL users şemasını ve kayıt sorgusunu canlı veritabanında doğrulamak
- [ ] Resend gönderim yanıtını ve gönderen adresini gerçek canlı testle doğrulamak
- [ ] Web kayıt formunda başarısızlıkta görünür hata, başarıda kod ekranı geçişi sağlamak
- [ ] Kayıt ve doğrulama akışını canlıda tek kontrollü testle doğrulamak
- [ ] Canlı e-posta gönderim yanıtını ve Resend teslimatını doğrula
- [ ] Ortak e-posta gönderim zincirini ve gerçek Resend hatasını düzelt

- [ ] Misafir ve üye erişim modelini uygula: ana sayfayı misafirlere aç, tarif/grup ekle ve alışveriş listesi için üyelik/giriş duvarı koy, profil ekranında ad/soyad/şifre düzenleme ekle.

## Kullanıcı geri bildirimi — misafir erişimi ve üyelik kapısı (19.08.2026)

- [x] Ana sayfayı ve herkese açık tarif/grup keşfini misafir kullanıcılar için erişilebilir yapmak
- [x] Tarif ekle, grup ekle ve alışveriş listesi işlemlerini üyelik/giriş kapısıyla korumak
- [x] Misafir işlemlerinde e-posta doğrulamalı kayıt, 6 haneli kod, parola oluşturma, giriş ve şifre sıfırlama modal akışını bağlamak
- [x] Üye profilinde ad, soyad ve parola düzenlemeyi; e-postayı sabit göstermeyi sağlamak
- [x] Web ve mobil oturum alanlarını özel e-posta oturum tokenı/çereziyle eşleştirmek
- [x] PostgreSQL bağlantısı erişilemediğinde public keşif sorgularının güvenli boş liste döndürmesini sağlamak
- [x] Misafir erişimi değişiklikleri için TypeScript, test ve üretim build kontrollerini çalıştırmak

## Canlı sürüm doğrulaması — 19.08.2026

- [ ] Canlı gastronotlar.com sürümünün misafir ana sayfasını gösterdiğini doğrula; eski zorunlu giriş ekranı görünüyorsa güncel checkpoint’i yayımla
- [ ] Canlı telefonda kayıt sırasında görülen “Veritabanı bağlantısı kurulamadı” hatasını, güncel Render deploy ve DATABASE_URL ile uçtan uca doğrula
- [ ] Güncel sürüm yayımlandıktan sonra gizli sekme web ve QR telefon akışlarını ayrı ayrı yeniden test et

## Render İki Gastronotlar Servisi İncelemesi — 19.08.2026

- [ ] Render panelindeki iki Gastronotlar servisini birbiriyle karşılaştır (biri `srv-da23dem1egvs7398g8vg` ID'li aktif servis, diğeri muhtemelen eski veya yedek servis)
- [ ] `gastronotlar.com` alan adının hangi servise bağlı olduğunu doğrula
- [ ] `optisinav-svg/yemek-tarifim` GitHub reposunun bağlı olduğu doğru serviste Manual Deploy yapıldığından emin ol

## Canlı Kayıt ve Veritabanı Teşhisi — 19.08.2026

- [ ] Web kayıt formunda "Kod gönder" tıklandığında konsol/sunucu tarafında oluşan hatayı incele
- [ ] Telefon QR uygulamasında alınan "Veritabanı bağlantısı kurulamadı" hatasının kaynaklandığı tRPC mutation endpoint'ini kontrol et
- [ ] Render üzerindeki `DATABASE_URL` ortam değişkeninin doğru aktarıldığını ve havuzun ilk bağlantıda düşmediğini doğrula

- [ ] Market (Alışveriş listesi / market) sekmesine misafirler için giriş/üyelik kapısı ekle

- [ ] Market sekmesinde misafirler için ara kartı kaldırıp doğrudan giriş yap ekranını aç
