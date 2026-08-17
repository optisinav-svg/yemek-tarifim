# Rakip Analizi ve Eksik Özellikler Raporu

Yüksek puanlı ve milyonlarca kullanıcıya sahip benzer yemek tarifi platformları (**Paprika Recipe Manager 3**, **Mealime** ve **SuperCook**) incelenmiş, kullanıcıların App Store ve Google Play değerlendirmelerinde en çok beğendiği özellikler doğrulanmıştır [1] [2] [3]. Bu analiz temel alınarak, **Yemek Tarifim** uygulamasında henüz bulunmayan ancak kullanıcı memnuniyetini en üst düzeye çıkaran üç temel özellik aşağıda detaylandırılmıştır.

## 1. Web Sitelerinden Tek Tuşla Akıllı Tarif İçe Aktarma (Bookmarklet & Web Scraper)
* **Rakip Örneği (Paprika Recipe Manager 3 - 4.9/5 Puan / 53K+ Değerlendirme):** Paprika, herhangi bir web sitesindeki tarif sayfasından tek tuşla (tarayıcı uzantısı veya paylaşımla) tüm malzemeleri, yönergeleri ve fotoğrafları otomatik olarak ayıklayıp uygulamaya kaydeder [3]. Kullanıcılar sıfırdan form doldurmak zorunda kalmadığı için bu özelliği en yüksek puanla ödüllendirmektedir.
* **Yemek Tarifim Durumu:** Uygulamamızda görsel yükleyerek çalışan OCR tabanlı tarif aktarımı mevcuttur; ancak internet sitelerindeki tarif URL'lerini doğrudan okuyup biçimlendiren bir web kazıma (scraper) aracı henüz yer almamaktadır.

## 2. Takvim Tabanlı Haftalık Yemek Planlayıcı ve Otomatik Alışveriş Listesi Senkronizasyonu
* **Rakip Örneği (Mealime - 4.8/5 Puan / 54K+ Değerlendirme & Paprika):** Kullanıcılar haftanın günlerine (Pazartesi, Salı vb.) istedikleri tarifleri takvim üzerinden yerleştirir [3]. Uygulama, seçilen bu haftalık menüdeki tüm malzemeleri tek bir listede otomatik olarak birleştirir ve süpermarket reyonlarına göre sıralar [3]. 
* **Yemek Tarifim Durumu:** Uygulamamızda tariflere göre alışveriş listesine ekleme ve reyon sınıflandırması bulunmaktadır; ancak takvim tabanlı haftalık/aylık öğün planlama modülü ve planlanan tüm öğünlerin toplu alışveriş listesine yansıtılması henüz geliştirilmemiştir.

## 3. Akıllı Eller Serbest (Hands-Free) Sesli Komut ve Ekran Koruma Modu
* **Rakip Örneği (Mealime & Paprika):** Yemek yaparken ellerin hamurlu veya ıslak olması nedeniyle telefon ekranına dokunmak zordur. Mealime, eller serbest modda ekrana dokunmadan sesli komutlar veya el hareketleriyle tarif adımlarının ilerletilmesini sağlar [2]. Paprika ise pişirme esnasında ekranın otomatik olarak kapanmasını engelleyerek adımları vurgular [3].
* **Yemek Tarifim Durumu:** Adım adım pişirme modumuz ve zamanlayıcımız mevcuttur; ancak pişirme sırasında ekranın açık kalmasını sağlayan sistem seviyesinde kilitleme ve sesli komutla adım ilerletme özellikleri eksiktir.

---

## Referanslar
[1] App Store. *SuperCook Recipe By Ingredient*. https://apps.apple.com/us/app/supercook-recipe-by-ingredient/id1477747816
[2] Mealime. *Mealime - Meal Planning App for Healthy Eating*. https://www.mealime.com/ ve https://apps.apple.com/us/app/mealime-meal-plans-recipes/id1079999103
[3] App Store. *Paprika Recipe Manager 3*. https://apps.apple.com/us/app/paprika-recipe-manager-3/id1303222868
