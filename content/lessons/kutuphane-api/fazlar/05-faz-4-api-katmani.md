---
title: Faz 4 — API katmanı (Minimal API)
summary: "Yazar ve kitap endpoint'leri, ProblemDetails ile tutarlı hata yanıtları, OpenAPI ve Scalar."
minutes: 4
level: intermediate
---
| Faz özeti |  |
| --- | --- |
| **Amaç** | Use case'leri HTTP üzerinden açmak; tutarlı, standartlara uygun yanıtlar üretmek. |
| **Öğreneceklerin** | Route group'lar, TypedResults, IEndpoint ile endpoint organizasyonu, `[AsParameters]`, route constraint'ler, ProblemDetails, IExceptionHandler, OpenAPI, Scalar, `.http` dosyaları. |
| **Faz sonunda elinde olacak** | Yazar ve kitap endpoint'leri çalışan, Scalar arayüzünden denenebilen bir API. |

## Görevler

### 4.1 Program.cs'i temiz tut

`Program.cs` yalnızca üç kayıt çağrısı (`AddApplication`, `AddInfrastructure`, `AddPresentation`) ve middleware hattını içersin. Hedef: 40 satırın altı. Api'ye özgü kayıtları (ProblemDetails, exception handler, OpenAPI, JSON ayarları) Api projesindeki `AddPresentation` extension'ına koy.

### 4.2 Endpoint organizasyonu

- `IEndpoint` arayüzü: tek metot, `MapEndpoint(IEndpointRouteBuilder app)`.
- Her endpoint ayrı bir sınıf (ör. `Endpoints/Books/CreateBook.cs`).
- Reflection ile assembly'deki tüm `IEndpoint`'leri DI'a kaydeden bir extension ve hepsini `/api/v1` route group'u altında map'leyen başka bir extension yaz.
- Her endpoint'e isim (`WithName`), etiket (`WithTags`) ve özet (`WithSummary`) ver; bunlar OpenAPI dokümanına yansır.
- Handler'ı endpoint delegate'ine parametre olarak enjekte et; minimal API onu DI'dan otomatik çözer. `CancellationToken`'ı da parametre olarak al.
- Route parametrelerinde tip kısıtı kullan (`{id:guid}`).
- Liste parametrelerini tek tek değil, bir record'a toplayıp `[AsParameters]` ile al.
- İstek gövdesi için Api katmanında ayrı bir request record'u tanımla ve onu command'a dönüştür.

> **Neden?** Request ile command'ı ayırmak API sözleşmesini use case'ten bağımsız kılar. Örneğin güncellemede `id` route'tan, diğer alanlar gövdeden gelir; command ikisini birleştirir. API sözleşmesi değişse bile use case değişmek zorunda kalmaz.

### 4.3 Result'tan HTTP yanıtına

- Başarısız bir `Result`'ı ProblemDetails'e çeviren tek bir yardımcı yaz (ör. `CustomResults.Problem`). Status kodu [Bölüm 3.4](/tracks/kutuphane-api/proje-tanimi)'teki tabloya göre seçilsin. `title` = hata kodu, `detail` = açıklama.
- `ValidationError` geldiğinde alan bazlı `errors` sözlüğü içeren bir ValidationProblem dön.
- Başarılı yanıtlar: oluşturmada `TypedResults.Created` (Location başlığıyla), güncelleme ve silmede `NoContent`, okumada `Ok`.

> **İpucu:** `Result` tipine `Match(onSuccess, onFailure)` adında bir metot eklersen her endpoint tek satırlık bir ifadeye iner.

### 4.4 Global exception handler

- `IExceptionHandler` arayüzünü uygulayan bir `GlobalExceptionHandler`: exception'ı Error seviyesinde loglar, 500 ProblemDetails döner. Exception mesajı ve stack trace yalnızca Development'ta görünür.
- `ConcurrencyException` için 409 Conflict dön.
- `AddProblemDetails` ve `UseExceptionHandler` kayıtlarını unutma. ProblemDetails'e `traceId` eklemek için ProblemDetails özelleştirme seçeneğini kullan.

### 4.5 UserContext

Api katmanında `IUserContext`'i uygula: `IHttpContextAccessor` ile `sub` claim'inden `MemberId`'yi okur. Claim yoksa exception fırlatır; bu bir programcı hatasıdır (yetki gerektiren endpoint yetkisiz çağrılmış demektir). Bu fazda henüz kullanılmayacak ama DI kaydı şimdiden hazır olsun.

### 4.6 JSON, OpenAPI ve Scalar

- Enum'ları string olarak serileştir (HTTP JSON seçeneklerine string enum converter ekle).
- OpenAPI dokümanını ve Scalar arayüzünü yalnızca Development ortamında map'le. Scalar'ı tarayıcıda `/scalar` adresinden aç.

### 4.7 .http dosyası

`Library.Api.http` dosyasına bu fazdaki her endpoint için örnek istekler yaz. `@baseUrl` gibi değişkenler kullan. Bu dosya, API'nin yaşayan elle-test senaryosu olacak.

> **Bilgi:** Bu fazda kimlik doğrulama yok; Librarian endpoint'leri şimdilik herkese açık. Faz 5'te kilitleyeceksin.

## Kendin test et

| # | İstek | Beklenen sonuç |
| --- | --- | --- |
| 1 | GET /api/v1/books | 200; seed kitapları ve sayfalama alanları |
| 2 | GET /api/v1/books?pageSize=500 | 400; `errors` içinde PageSize |
| 3 | GET /api/v1/books/{rastgele-guid} | 404; title = `Books.NotFound` |
| 4 | GET /api/v1/books/abc | 404 (route constraint eşleşmedi) |
| 5 | POST /api/v1/books, kontrol hanesi yanlış ISBN | 400; `Books.InvalidIsbn` (domain'den gelen Validation türünde hata) |
| 6 | POST /api/v1/books, var olan ISBN | 409; `Books.DuplicateIsbn` |
| 7 | POST /api/v1/books, geçerli veri | 201 ve Location başlığı; o adrese GET → 200 |
| 8 | PUT /api/v1/books/{id} | 204; tekrar GET → değişiklik görünür, UpdatedAt dolu |
| 9 | GET /api/v1/books?search=…&sortBy=year&sortOrder=desc | Filtrelenmiş ve doğru sıralanmış sonuç |
| 10 | GET /api/v1/books?sortBy=hack | 400 |
| 11 | DELETE /api/v1/authors/{kitabı-olan-yazar} | 409; `Authors.HasBooks` |
| 12 | DELETE /api/v1/books/{id}, ardından GET | 204, ardından 404 (soft delete + query filter) |
| 13 | Geçici olarak exception fırlatan bir test endpoint'i (sonra sil) | 500 ProblemDetails; Production ortamında stack trace yok |

> **İpucu:** Ortamı değiştirerek denemek için uygulamayı `ASPNETCORE_ENVIRONMENT` ortam değişkeni `Production` olacak şekilde başlat.

## Kabul kriterleri

- [ ] Endpoint'lerde iş mantığı yok; yalnızca HTTP → command/query → HTTP dönüşümü var.
- [ ] Tüm hata yanıtları ProblemDetails formatında ve `traceId` içeriyor.
- [ ] Oluşturma endpoint'leri Location başlığı dönüyor.
- [ ] Scalar'da tüm endpoint'ler doğru isim, etiket ve yanıt tipleriyle görünüyor.
- [ ] Yukarıdaki 13 senaryonun hepsi beklendiği gibi çalışıyor.

## Review'da bakacaklarım

- Şişmiş `Program.cs`
- Yanlış status kodları
- Endpoint'te DbContext veya repository kullanımı
- Eksik route constraint
- Eksik `CancellationToken`
- Exception detaylarının Production'da sızması
- Middleware sırası
