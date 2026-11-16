---
title: Clean Code kontrol listesi
summary: Her fazda kodunu gözden geçirirken kullanacağın kurallar.
minutes: 3
level: intermediate
---
Her fazda kodunu bu listeye göre gözden geçir. Review'da da bu kurallara bakacağım.

| Konu | Kural |
| --- | --- |
| İsimlendirme | Tipler ve metotlar PascalCase, yerel değişkenler camelCase, private alanlar `_camelCase`. Async metotlar `Async` ile biter. Boolean'lar `Is`, `Has`, `Can` ile başlar. Kısaltma yok (`cnt` değil `count`) |
| Sınıflar | Varsayılan olarak `sealed`; kalıtım gerçekten gerekiyorsa açılır. Görünürlük mümkün olan en dar seviyede (`internal`, `private`) |
| Veri tipleri | DTO, command, query ve event'ler `record`. Value object'ler değer eşitliğine sahip |
| Dosyalar | Bir dosyada bir tip; dosya adı tip adıyla aynı. Dosya kapsamlı namespace. Namespace klasör yolunu takip eder |
| Sabitler | Sihirli sayı ve string yok: sabit, enum ya da Options kullan |
| Metotlar | Kısa ve tek işli. Guard clause ile erken dönüş; iç içe derin `if` yok. 3–4'ten fazla parametre varsa bir tipe topla |
| Primitive obsession | Anlamı olan değerler (ISBN, e-posta) kendi tipinde |
| Null güvenliği | Nullable uyarılarını bastırmak için `!` operatörünü gerekçesiz kullanma |
| Async | `.Result`, `.Wait()` ve `async void` yok. `CancellationToken` her katmanda iletiliyor |
| Hatalar | Beklenen durumlar `Result`, beklenmeyen durumlar exception. Exception'ı yutma (boş `catch` yok) |
| Bağımlılıklar | Constructor injection (primary constructor). Service locator yok. `new` ile servis oluşturma yok |
| Zaman | `DateTime.Now` / `UtcNow` yok; her zaman `TimeProvider` |
| Yorumlar | “Ne” yapıldığını değil “neden” yapıldığını anlatır. Kod kendini açıklamalı; yorum satırına alınmış ölü kod yok |
| Loglama | Mesaj şablonu kullan, hassas veri loglama, doğru seviye seç |
| Testler | Arrange / Act / Assert; test başına tek davranış; açıklayıcı isim; testler birbirinden bağımsız |
| Modern C# | Primary constructor, collection expression, pattern matching, `required` üyeler: okunurluğu artırdığı yerde kullan |
