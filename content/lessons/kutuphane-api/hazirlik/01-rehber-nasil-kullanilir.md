---
title: Bu rehber nasıl kullanılır?
summary: Fazların yapısı, çalışma döngüsü, bulgu seviyeleri ve projenin yol haritası.
minutes: 3
level: beginner
---
> **Uçtan uca .NET 10 Minimal API — Clean Architecture, Clean Code ve best practice'lerle.** Bu rehberde tek satır C# kodu yok. Ne yapacağını, neden yapacağını ve nasıl test edeceğini anlatır; kodu sen yazacaksın.

> **Bilgi:** Rehber, kodunu inceleyen birinin ağzından yazıldı. Metindeki “ben”, review'ı yapacak kişidir: bir mentor, bir ekip arkadaşı ya da kodunu okuyabilen bir yapay zekâ asistanı. Tek başına çalışıyorsan her fazın kabul kriterlerini ve “Review'da bakacaklarım” listesini kendi kendini denetlemek için kullan.

Bu belge, sıfırdan çalışan bir Web API'yi senin yazman için hazırlanmış bir yol haritasıdır. **İçinde C# kodu bulunmaz.** Her adımda ne inşa edeceğini, hangi kurallara uyacağını, nasıl test edeceğini ve review'da neye bakacağımı bulacaksın. Yalnızca proje oluşturma, paket ekleme ve migration gibi kurulum adımları için terminal komutları verildi; bunlar uygulama kodu değildir.

## 1.1 Her fazın yapısı

| Bölüm | İçerik |
| --- | --- |
| Amaç / Öğreneceklerin | Fazın neden var olduğu ve sana hangi kavramları kazandıracağı |
| Görevler | Yazman gereken sınıflar, sorumlulukları ve kuralları. Sınıf ve metot adları önerilir, gövdeleri sana kalır |
| Kabul kriterleri | Fazı “bitti” saymak için sağlanması gereken koşullar (işaretleyebileceğin kutular) |
| Kendin test et | Elle ya da otomatik deneyeceğin senaryolar ve beklenen sonuçlar |
| Review'da bakacaklarım | Kontrol ederken özellikle dikkat edeceğim noktalar. Önceden bilmen hata yapmanı azaltır |

## 1.2 Çalışma döngüsü

1. Fazın tamamını baştan sona oku; kodlamaya başlamadan önce ne inşa edeceğini kafanda canlandır.
2. Kodu yaz. Takılırsan önce Microsoft Learn dokümanına bak ([Kaynaklar](/tracks/kutuphane-api/kaynaklar)). Sonra bana kavramı sorabilirsin: kod değil, açıklama ve yön isteyebilirsin.
3. `dotnet build` **sıfır uyarı, sıfır hata** ile bitmeli; `dotnet test` tamamen yeşil olmalı.
4. Değişikliklerini commit'le. Mesaj önerisi: `feat(faz-1): domain katmani ve unit testler`.
5. Bana **“Faz 1 bitti, kontrol et”** yaz. Kodunu okuyup build ve testleri çalıştırırım, bulgularımı yazarım.
6. Bulguları düzelt, tekrar kontrol iste. Kritik ve Önemli bulgu kalmayınca bir sonraki faza geç.

> **Bilgi:** Review sırasında kodunu ben düzeltmem ve hazır kod vermem. Her bulgu için dosya ve satır, sorunun ne olduğu, neden sorun olduğu ve hangi yöne gitmen gerektiğine dair bir ipucu yazarım. “Daha fazla ipucu ver” ya da “sadece hangi dosyada olduğunu söyle” diyerek seviyeyi ayarlayabilirsin.

## 1.3 Bulgu seviyeleri

| Seviye | Anlamı | Ne yapmalısın? |
| --- | --- | --- |
| **Kritik** | Hata, güvenlik açığı, veri kaybı ya da bozuk iş kuralı | Düzeltmeden sonraki faza geçme |
| **Önemli** | Mimari ihlali, katman sızıntısı, best practice dışı kullanım | Düzelt; gerekçen varsa tartışalım |
| **Öneri** | Okunabilirlik, isimlendirme, küçük sadeleştirmeler | İsteğe bağlı |

## 1.4 Yol haritası

| Faz | Konu | Faz sonunda elinde olan |
| --- | --- | --- |
| 0 | Çözüm iskeleti | Kuralları sıkı, derlenen boş çözüm; test projeleri hazır |
| 1 | Domain katmanı | İş kurallarını koruyan zengin model, unit testler, mimari testler |
| 2 | Application katmanı | Tüm use case'ler, validasyon ve log decorator'ları, handler testleri |
| 3 | Infrastructure katmanı | EF Core, migration'lar, seed verisi, şifre ve token altyapısı |
| 4 | API katmanı (Minimal API) | Yazar ve kitap endpoint'leri, tutarlı hata yanıtları, OpenAPI ve Scalar |
| 5 | Kimlik ve yetkilendirme | JWT girişi, roller, rate limiting, uçtan uca ödünç akışı |
| 6 | Cross-cutting konular | Yapısal loglama, health check, CORS, output cache |
| 7 | Entegrasyon ve mimari testleri | Gerçek veritabanına karşı uçtan uca testler, eşzamanlılık testi, kapsam raporu |
| 8 | Bonus | Docker, CI, Outbox, strongly-typed ID, PostgreSQL'e geçiş… |
