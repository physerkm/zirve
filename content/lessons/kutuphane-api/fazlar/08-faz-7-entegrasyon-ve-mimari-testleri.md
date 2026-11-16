---
title: Faz 7 — Entegrasyon ve mimari testleri
summary: Gerçek veritabanına karşı uçtan uca testler, eşzamanlılık testi ve kod kapsamı.
minutes: 3
level: advanced
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | API'yi gerçek bir veritabanına karşı, uçtan uca ve otomatik olarak test etmek. |
| **Öğreneceklerin** | WebApplicationFactory, test ortamı yapılandırması, servis değiştirme, test izolasyonu, xUnit fixture'ları, FakeTimeProvider ile zaman yolculuğu, eşzamanlılık testi, kod kapsamı. |
| **Faz sonunda elinde olacak** | Tek komutla çalışan, sıra bağımsız ve kararlı (flaky olmayan) bir test paketi. |

## Görevler

### 7.1 Test sunucusu

- `WebApplicationFactory<Program>`'dan türeyen bir `LibraryApiFactory` yaz.
- Ortamı `Testing` yap; bağlantı dizesini ayrı bir LocalDB veritabanına (`LibraryDb_Tests`) yönlendir.
- `TimeProvider`'ı bir `FakeTimeProvider` ile değiştir (test servislerini yapılandırma yöntemiyle) ve testlerin erişebileceği şekilde dışarı aç.
- Test başlangıcında veritabanını sil ve migration'ları uygula. `EnsureCreated` değil migration kullan; böylece migration'ların kendisi de test edilmiş olur.
- Fabrikayı xUnit'in fixture mekanizmasıyla testler arasında paylaş; her test için yeni sunucu kaldırma.

> **İpucu:** Test projesinin `Program` sınıfına erişememesi klasik bir sorundur. Hata alırsan araştır: “WebApplicationFactory Program class accessibility”.

### 7.2 Kimlik doğrulama yardımcıları

Testlerde token'ı gerçek register ve login endpoint'lerinden alan yardımcı metotlar yaz (ör. “yeni bir üye oluştur ve token'ını döndür”). Böylece kimlik akışı da test edilmiş olur.

### 7.3 Test izolasyonu

- Her test kendi verisini üretsin: rastgele ISBN (geçerli kontrol hanesiyle!) ve rastgele e-posta üreten yardımcılar yaz.
- Testler birbirinin verisine ya da çalışma sırasına bağlı olmasın.
- Bonus: Respawn paketiyle testler arasında tabloları hızlıca temizle.

### 7.4 Senaryolar

- Faz 4 ve Faz 5 test tablolarındaki her satır için en az bir entegrasyon testi.
- **Gecikme akışı:** ödünç al → `FakeTimeProvider`'ı 17 gün ileri al → gecikmiş listesinde görün → yeni ödünç reddedilsin → iade cezası 15,00 olsun.
- **Eşzamanlılık:** tek kopyası olan bir kitaba iki farklı üyeden aynı anda (paralel) ödünç isteği at. Biri 201, diğeri 409 almalı ve kitabın stoğu asla eksiye düşmemeli. Bu test RowVersion'ın gerçekten işe yaradığının kanıtıdır.
- Yanıt gövdelerini yalnızca status koduyla değil, içerikleriyle de doğrula (hata kodu, alanlar).

### 7.5 Mimari testleri genişlet

- Handler'lar sealed ve isimleri `Handler` ile bitiyor.
- Api'deki endpoint sınıfları Infrastructure'a bağımlı değil.
- Domain entity'lerinin public setter'ı yok (NetArchTest ya da düz reflection ile).
- Infrastructure'daki repository'ler public değil.

### 7.6 Kod kapsamı

```bash
dotnet test --collect:"XPlat Code Coverage"
```

Hedefler: Domain %90+, Application %80+. Raporu okunur hale getirmek için ReportGenerator aracını araştırabilirsin. Kapsam bir hedef değil, göstergedir: test edilmeyen önemli bir yolu bulmak için kullan.

## Kabul kriterleri

- [ ] `dotnet test` tek komutla tüm testleri (unit, mimari, entegrasyon) çalıştırıyor ve hepsi yeşil.
- [ ] Test paketi üst üste 3 kez çalıştırıldığında da yeşil (flaky test yok).
- [ ] Eşzamanlılık testi geçiyor.
- [ ] Hiçbir test gerçek saate bağlı değil.

## Review'da bakacaklarım

- Testler arası veri bağımlılığı
- Sadece status koduna bakan yüzeysel testler
- `Task.Delay` ile bekleme yapan testler
- Paylaşılan durumun (static) testleri kirletmesi
- Test isimlerinin okunabilirliği
