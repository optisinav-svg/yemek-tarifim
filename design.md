# Yemek Tarifim — Mobil Arayüz Tasarım Planı

## Tasarım yönü

Yemek Tarifim, Türkiye mutfağıyla başlayan ve ileride dünya mutfaklarına genişleyebilen, tarif keşfi ile mutfakta uygulamayı tek akışta birleştiren bir uygulama olarak tasarlanacaktır. Arayüz, **iOS Human Interface Guidelines** ilkelerine uygun; sakin, okunabilir, tek elle kullanılabilir ve içerik odaklı olacaktır. Mobil portre yönü (9:16) temel alınacak; web görünümünde aynı bilgi mimarisi daha geniş iki sütunlu yerleşime uyarlanacaktır.

Marka dili sıcak, ev yapımı ve güven verici olacaktır. Ana renk olarak **safran turuncusu `#E98B3A`**, yardımcı vurgu olarak **fesleğen yeşili `#5C8D62`**, arka plan olarak **krem `#FFF8F0`**, kart yüzeyi olarak **beyaz `#FFFFFF`**, ana metin olarak **koyu kakao `#2D241F`** kullanılacaktır. Koyu temada arka plan `#171412`, yüzey `#241F1B`, metin `#FFF8F0`, vurgu renkleri ise daha açık tonlara taşınacaktır.

## Ekran listesi

### 1. Ana Sayfa

Ana sayfanın üst bölümünde “Yemek Tarifim” başlığı, profil/ayar erişimi ve aktif zamanlayıcı göstergesi bulunacaktır. Hemen altında ülke seçici yatay kaydırılabilir bayrak kartlarıyla gösterilecek; ilk seçenek Türkiye, ikinci seçenek “Tümü” olacaktır. Ülke seçildiğinde kategori listesi o ülkeye göre süzülecektir. “Tümü” seçildiğinde kategori içindeki tarifler tüm ülkelerden karışık olarak gösterilecektir.

Ana içerikte öne çıkan kategoriler, yeni eklenen tarifler ve kullanıcının kaydettiği tariflere kısa erişim bulunacaktır. Yeni tarifler yeniden eskiye sıralanacak, kartlar iki sütunlu ızgarada gösterilecektir. Her kartta tarif adı, fotoğraf, toplam süre, hazırlayan kişinin küçük profil fotoğrafı ve kullanıcı adı yer alacaktır.

### 2. Gruplar / Kategoriler

“Gruplar” sekmesi çorba, ana yemek, sebze yemekleri, diyet, makarna, pilav, etli yemekler, hamur işi, salata, içecek ve tatlı gibi kategorileri listeler. Her kategori kartında ülke filtresine göre tarif sayısı görünür. Kullanıcı kendi grubunu ekleyebilir; günlük grup ekleme sınırı arayüzde açıklanır.

### 3. Kategori Tarif Listesi

Bir kategori seçildiğinde kategori başlığı, seçili ülke filtresi, arama/sıralama seçenekleri ve iki sütunlu tarif ızgarası gösterilir. Tarifler varsayılan olarak en yeni tarif üstte olacak şekilde sıralanır. Boş durumda kullanıcıya kategori değiştirme veya tarif ekleme çağrısı gösterilir.

### 4. Tarif Detayı

Tarif detayı ekranında üstte en fazla üç fotoğraf için galeri, tarif adı, tarif sahibi, ülke ve kategori bilgileri yer alacaktır. Hazırlama süresi, yapılış süresi ve toplam süre ayrı etiketlerle gösterilir. Porsiyon kontrolü “eksi / mevcut porsiyon / artı” biçiminde çalışır.

Malzemeler, yapılış ve püf noktaları ayrı bölümler halinde gösterilecektir. Miktar ve birim ayrı veri alanlarında saklandığı için porsiyon değişiminde matematiksel ölçüler güncellenir; “bir tutam”, “göz kararı” gibi ölçüler sabit kalır ve kullanıcıya bilgilendirici not gösterilir.

Temel eylemler: “Listeme ekle”, “Alışveriş listesine ekle”, “Pişirme modunu aç”, “Paylaş”, “Düzenle” ve uygun yetkiye sahip kullanıcı için “Raporla” olacaktır. Tarif sahibi kendi tarifini düzenleyebilir.

### 5. Tarif Oluştur / Düzenle

Tarif formu adım adım ilerleyecektir: temel bilgiler, süre ve porsiyon, malzemeler, yapılış, püf noktaları, fotoğraf/video ve yayın önizlemesi. Malzemeler miktar, birim ve ad olarak ayrı girilecektir. Enter ile yeni satır açılacak; kullanıcı isterse “bir tutam” gibi serbest ölçü seçebilecektir.

Fotoğraf, video, PDF veya görselden metin aktarma ve cihaz klavyesinin sesle yazma özelliğini kullanma seçenekleri görünür olacaktır. OCR sonucundan sonra mutlaka düzenleme ve onay ekranı bulunacaktır; otomatik dönüştürülen metin doğrudan yayınlanmayacaktır.

### 6. Arama

Arama ekranı yemek adı, malzeme ve kategori üzerinden çalışacaktır. Kullanıcı en fazla beş malzeme seçerek bu malzemelerle yapılabilecek tarifleri arayabilir; sonuçlar tam eşleşme yerine eşleşme oranına göre sıralanır. Arama geçmişi cihazda veya kullanıcı hesabında isteğe bağlı olarak tutulabilir.

### 7. Favoriler / Listem

Kullanıcının “Listeme ekle” ile kaydettiği tarifler burada gösterilir. Liste, ülke ve kategori filtreleriyle süzülebilir. Kaydedilen tarifler çevrimdışı erişim için ileride yerel önbelleğe alınabilecek şekilde modellenir.

### 8. Alışveriş Listesi

Alışveriş listesi uygulama içinde kalıcı olarak tutulur ve malzemeler işaretlenebilir. Aynı malzeme, birden fazla tariften geldiğinde mümkün olduğunda birleştirilir; farklı birimler güvenli biçimde ayrılır. Kullanıcı “Market modu” ile ekranın kapanmasını önleyebilir. Liste, cihazın sistem paylaşım menüsüyle düz metin olarak WhatsApp, Telegram, e-posta veya not uygulamalarına gönderilebilir; ilerleyen aşamada PDF/görsel dışa aktarma eklenebilir.

### 9. Pişirme Modu

Pişirme modu büyük yazı, yüksek kontrast, ekranın kapanmasını önleme, adım adım ilerleme ve zamanlayıcıya hızlı erişim sunacaktır. Kullanıcının elleri meşgul olabileceği için temel kontroller büyük dokunma alanlarına sahip olacaktır. İlk sürümde “sonraki / önceki adım” dokunmatik kontrolleri, sonraki sürümde sesli komut değerlendirilir.

### 10. Zamanlayıcı

Alt menüdeki zamanlayıcı sekmesinde saat ve dakika dairesel kontrolle ayarlanır. Başlatıldığında kalan süre tüm ekranların üst bölümünde küçük, ayrı bir yüzen gösterge olarak görünür. Süre bittiğinde uygulama içi sesli/işitsel uyarı verilir; uygulama arka plandayken platformun bildirim yetenekleri kullanılabilir.

### 11. Profil ve Ayarlar

Profil ekranında ad, soyad, kullanıcı adı, e-posta ve profil fotoğrafı düzenlenebilir. Ayarlarda dil, ölçü birimi tercihi, tema, bildirimler, gizlilik, hesap silme ve çıkış seçenekleri bulunur. Dil değişimi tarif metninin seçilen dile çevrilmiş görünümünü açar; orijinal metin her zaman erişilebilir tutulur.

### 12. Yönetim / Moderasyon

Admin ekranı yalnızca sunucu tarafında doğrulanan admin rolüyle açılır. Tarif, fotoğraf, video ve kullanıcı yönetimi; uyarı, engelleme, silme, rapor inceleme ve bakım modu işlemleri bulunur. “Uygulamayı kapatma” yerine bakım modu kullanılacaktır. Kritik işlemler onay, audit kaydı ve mümkünse geri alma bilgisiyle korunacaktır.

## Temel kullanıcı akışları

### Tarif keşfetme

Kullanıcı ana sayfayı açar → ülke bayrağından Türkiye veya “Tümü” seçer → kategori seçer → tarif kartını açar → porsiyon miktarını ayarlar → tarifi kaydeder veya pişirme modunu açar.

### Tarif oluşturma

Kullanıcı tarif oluşturmayı seçer → ülke ve grup seçer → ad, süre ve porsiyon bilgilerini girer → malzemeleri miktar/birim/ad olarak ekler → yapılış ve püf noktalarını yazar veya OCR ile aktarır → fotoğraf/video ekler → önizlemeyi kontrol eder → yayınlar.

### Alışveriş listesi

Kullanıcı tarif detayında porsiyonu seçer → tüm malzemeleri alışveriş listesine ekler → liste ekranında alınanları işaretler → Market modunu açar veya sistem paylaşım menüsüyle listeyi başka uygulamaya gönderir.

### Tarif arama

Kullanıcı arama sekmesine geçer → yemek adı veya en fazla beş malzeme girer → eşleşen tarifleri inceler → bir tarifi açar → eksik malzemeleri alışveriş listesine ekler.

### Moderasyon

Admin giriş yapar → raporlar veya kullanıcılar ekranını açar → içeriği inceler → uyarı, gizleme, silme veya engelleme işlemini seçer → işlem nedeni girer → sistem audit kaydı oluşturur.

## Bilgi mimarisi ve ortak gezinme

Alt sekme çubuğu şu beş ana bölümü içerecektir: **Ana Sayfa, Gruplar, Ara, Favoriler ve Zamanlayıcı**. Profil ve ayarlar üst sağdan açılacaktır. Tüm ikincil ekranlarda geri dönüş ve ana sayfaya dönme erişimi bulunacak; ancak iOS standardına uygun olarak geri davranışı öncelikle sistem gezinmesine bırakılacaktır.

## Erişilebilirlik ve güvenilirlik

Dokunma alanları en az yaklaşık 44 pt olacak, metinler sistem yazı büyütmesine mümkün olduğunca uyum sağlayacak, renk tek başına anlam taşımayacak ve görsellere alternatif metin eklenecektir. OCR, otomatik çeviri ve porsiyon dönüşümü kullanıcıya doğrulama imkânı sunacaktır. Kullanıcı içeriği yayınlanmadan önce form doğrulaması, medya boyutu/süre sınırı ve kötüye kullanım sınırlamaları uygulanacaktır.
