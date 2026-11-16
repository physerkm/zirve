---
title: Faz 5 — Kimlik doğrulama ve yetkilendirme
summary: "JWT girişi, rol bazlı policy'ler, rate limiting ve uçtan uca ödünç akışı."
minutes: 4
level: advanced
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | JWT ile giriş, rol bazlı erişim ve ödünç akışının tamamını hayata geçirmek. |
| **Öğreneceklerin** | JWT Bearer doğrulaması, claim'ler, authorization policy'leri, user secrets, rate limiting, OpenAPI güvenlik şeması. |
| **Faz sonunda elinde olacak** | [Bölüm 3.3](/tracks/kutuphane-api/proje-tanimi)'teki tüm endpoint'lerin doğru yetkilerle çalıştığı, uçtan uca test edilmiş bir API. |

## Görevler

### 5.1 JWT doğrulaması

- JwtBearer kimlik doğrulamasını ekle: issuer, audience, lifetime ve imza anahtarı doğrulansın. Değerleri yine `JwtOptions`'tan oku; aynı ayarları iki yerde tekrar etme.
- `ClockSkew` varsayılanı 5 dakikadır; neden var olduğunu araştır ve küçült.
- Gelen claim adlarının .NET tarafından uzun URI'lere dönüştürülmemesi için `MapInboundClaims` ayarını incele.

### 5.2 Yetkilendirme policy'leri

- İki policy: `Librarian` (rolü Librarian olan) ve `Member` (rolü Member olan). Policy adlarını sabitlerde tut.
- Yetkiyi tek tek endpoint'lere değil, mümkün olduğunca route group seviyesinde uygula. Anonim kalması gerekenleri açıkça `AllowAnonymous` ile işaretle.
- Yetki matrisi [Bölüm 3.3](/tracks/kutuphane-api/proje-tanimi)'teki tabloyla birebir aynı olmalı.

### 5.3 Auth, Members ve Loans endpoint'leri

[Bölüm 3.3](/tracks/kutuphane-api/proje-tanimi)'te Faz 5'e ayrılmış tüm endpoint'leri yaz. Register 201 ile `Location: /api/v1/members/me` dönebilir.

### 5.4 Rate limiting

- Login endpoint'ine IP adresine göre bölümlenmiş (partitioned) sabit pencere (fixed window) limiti uygula: dakikada 5 deneme.
- Limit aşıldığında 429 Too Many Requests dönsün.
- `UseRateLimiter`'ın middleware hattındaki yerine dikkat et.

### 5.5 OpenAPI'de Bearer şeması

Scalar'dan token girerek korumalı endpoint'leri deneyebilmek için OpenAPI dokümanına Bearer güvenlik şeması ekleyen bir document transformer yaz. Araştır: “ASP.NET Core OpenAPI document transformer bearer”.

### 5.6 .http dosyasını genişlet

Login isteğinin yanıtındaki token'ı bir değişkende yakalayıp sonraki isteklerde kullan (REST Client bunu destekler).

## Kendin test et (uçtan uca senaryo)

Bu senaryoyu sırasıyla uygula. Her adımın sonucunu not et:

| # | Adım | Beklenen |
| --- | --- | --- |
| 1 | Token olmadan POST /books | 401 |
| 2 | Member token'ı ile POST /books | 403 |
| 3 | Register: zayıf şifre / aynı e-posta ikinci kez / geçerli | 400 / 409 / 201 |
| 4 | Login: yanlış şifre; ardından aynı dakikada 6. deneme | 401; ardından 429 |
| 5 | Librarian ile giriş yap; Member ile giriş yap | İki ayrı token |
| 6 | Member olarak 3 farklı kitap ödünç al | 201 × 3 |
| 7 | 4. kitabı ödünç almayı dene | 409 `Members.LoanLimitReached` |
| 8 | Elindeki bir kitabı tekrar ödünç almayı dene | 409 `Members.AlreadyBorrowedThisBook` |
| 9 | Tek kopyası olan ve başkasında duran kitabı almayı dene | 409 `Books.NoCopiesAvailable` |
| 10 | Bir ödüncü uzat; aynısını tekrar uzat | 204; ardından 409 |
| 11 | Başka bir üyenin ödüncünü uzatmayı dene | 404 ya da 403 (Faz 2'deki kararın) |
| 12 | Librarian ile bir ödüncü iade al | 200, `lateFee: 0`, kitabın stoğu bir arttı |
| 13 | SQL ile bir ödüncün DueAt değerini geçmişe çek; GET /loans/overdue | Ödünç listede |
| 14 | O üyeyle yeni bir kitap almayı dene | 409 `Members.HasOverdueLoans` |
| 15 | Gecikmiş ödüncü iade al | 200, ceza gecikme günü × 5,00 |
| 16 | Aktif ödüncü olan üyeyi pasifleştir; iadelerden sonra tekrar dene | 409; ardından 204 |
| 17 | Pasif üyeyle ödünç almayı dene | 409 `Members.Inactive` |
| 18 | Süresi dolmuş bir token ile istek at (test için süreyi geçici olarak 1 dakika yap) | 401 |

## Kabul kriterleri

- [ ] Repoda hiçbir sır yok; `appsettings.json`'daki Jwt bölümünde Secret alanı yok.
- [ ] Veritabanındaki şifreler hash'li.
- [ ] Hiçbir yanıtta PasswordHash dönmüyor.
- [ ] Yetki matrisi endpoint tablosuyla birebir aynı.
- [ ] Yukarıdaki 18 adımın hepsi beklendiği gibi çalışıyor.

## Review'da bakacaklarım

- Sır sızıntısı
- Claim adlarının tutarlılığı
- Policy'lerin yanlış gruplara uygulanması
- User enumeration açığı
- Middleware sırası (authentication, authorization, rate limiter)
- Token doğrulama parametrelerinin eksikliği
