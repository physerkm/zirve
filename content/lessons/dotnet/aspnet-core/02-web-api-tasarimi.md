---
title: ASP.NET Core ile Web API Tasarımı
summary: Minimal API ve controller seçimi, kaynak odaklı URL'ler, doğru durum kodları, doğrulama, ProblemDetails, sayfalama, versiyonlama, idempotency ve hız sınırlama. İlanlardaki "RESTful API tasarımı" maddesinin karşılığı.
minutes: 22
level: intermediate
---

İş ilanlarının neredeyse hepsinde "RESTful API tasarımı ve geliştirme" maddesi geçer. Mülakatta bu genellikle iki şekilde sorulur: "Şu kaynak için bir API tasarla" ya da "Bu uç noktada ne yanlış?". Bu ders iki soruya da cevap verecek alışkanlıkları kazandırır.

## Minimal API mi, controller mı?

| | Minimal API | Controller (MVC) |
| --- | --- | --- |
| Yapı | Uç noktalar `MapGet`/`MapPost` ile tanımlanır | Sınıflar ve action metotları |
| Başlangıç maliyeti | Az kod, hızlı açılış | Daha fazla tören |
| Filtreler | Endpoint filter | Action, result, exception filter |
| Native AOT | Destekler | Desteklemez |
| Ne zaman | Yeni servisler, mikroservisler, dikey dilimler | Büyük ve eski kod tabanları, MVC'ye alışık ekipler |

İkisi aynı altyapıyı (routing, model bağlama, DI, kimlik doğrulama) kullanır. Mülakatta "hangisi daha iyi" sorusunun doğru cevabı ödünleşimleri saymaktır. Yeni projelerde Microsoft'un varsayılanı Minimal API'dir.

Minimal API'de uç noktaları gruplamak düzeni korur:

```csharp
var orders = app.MapGroup("/api/v1/orders")
    .WithTags("Orders")
    .RequireAuthorization();

orders.MapGet("/{id:guid}", GetOrder).WithName("GetOrder");
orders.MapPost("/", CreateOrder);
orders.MapDelete("/{id:guid}", CancelOrder);

static async Task<Results<Ok<OrderDto>, NotFound>> GetOrder(
    Guid id, AppDbContext db, CancellationToken ct)
{
    var order = await db.Orders.AsNoTracking()
        .Where(o => o.Id == id)
        .Select(o => new OrderDto(o.Id, o.Status, o.Total))
        .FirstOrDefaultAsync(ct);

    return order is null ? TypedResults.NotFound() : TypedResults.Ok(order);
}
```

`Results<Ok<OrderDto>, NotFound>` dönüş tipi hem derleyiciye hem OpenAPI belgesine uç noktanın hangi yanıtları verebileceğini söyler. `TypedResults` kullanmak birim testinde sonucu tipine göre doğrulamayı da kolaylaştırır.

## Kaynak odaklı URL ve doğru HTTP fiilleri

REST'te URL bir **kaynağı**, fiil ise **yapılacak işi** anlatır. URL'de fiil olmaz.

| Kötü | İyi |
| --- | --- |
| `POST /api/getOrders` | `GET /api/orders` |
| `POST /api/orders/delete/5` | `DELETE /api/orders/5` |
| `GET /api/orders/5/cancel` | `POST /api/orders/5/cancellation` ya da `POST /api/orders/5:cancel` |
| `GET /api/user-orders?userId=7` | `GET /api/users/7/orders` |

Fiillerin anlamı:

| Fiil | Anlam | Güvenli mi? | Idempotent mi? |
| --- | --- | --- | --- |
| `GET` | Oku | Evet | Evet |
| `POST` | Oluştur ya da bir işlem başlat | Hayır | **Hayır** |
| `PUT` | Kaynağı bütünüyle değiştir | Hayır | Evet |
| `PATCH` | Kısmi güncelle | Hayır | Genellikle hayır |
| `DELETE` | Sil | Hayır | Evet |

**Idempotent**, aynı isteği bir kez de göndersen on kez de göndersen sunucudaki son durumun aynı olması demektir. `DELETE /orders/5` iki kez çağrılınca sipariş yine silinmiş durumdadır (ikinci çağrı 404 dönebilir, ama durum değişmez).

## Durum kodları

Mülakatta en çok karıştırılanlar:

| Kod | Ne zaman |
| --- | --- |
| `200 OK` | Başarılı okuma ya da güncelleme, gövde var |
| `201 Created` | Kaynak oluşturuldu. `Location` başlığı yeni kaynağı göstermeli |
| `202 Accepted` | İş kuyruğa alındı, daha sonra tamamlanacak |
| `204 No Content` | Başarılı, gövde yok (ör. silme) |
| `400 Bad Request` | İstek biçimi ya da doğrulama hatalı |
| `401 Unauthorized` | Kimlik doğrulanmamış ("kimsin?") |
| `403 Forbidden` | Kimlik belli ama yetki yok ("bunu yapamazsın") |
| `404 Not Found` | Kaynak yok |
| `409 Conflict` | Durum çakışması: eşzamanlı güncelleme, tekrar eden benzersiz değer |
| `412 Precondition Failed` | `If-Match` ile gönderilen ETag artık geçerli değil |
| `422 Unprocessable Content` | Biçim doğru ama iş kuralı ihlal edildi |
| `429 Too Many Requests` | Hız sınırı aşıldı |
| `500` / `503` | Sunucu hatası / servis geçici olarak kullanılamıyor |

```csharp
static async Task<Created<OrderDto>> CreateOrder(CreateOrderRequest request, OrderService service, CancellationToken ct)
{
    var order = await service.CreateAsync(request, ct);
    return TypedResults.Created($"/api/v1/orders/{order.Id}", order);
}
```

## Doğrulama ve ProblemDetails

Hatalar istemciye **tek bir standart biçimde** dönmelidir. ASP.NET Core bunun için RFC 9457 `ProblemDetails` biçimini kullanır:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "quantity": ["Adet 1 ile 100 arasında olmalı."] },
  "traceId": "00-3f9c…-01"
}
```

.NET 10 ile Minimal API'lerde DataAnnotations tabanlı yerleşik doğrulama geldi:

```csharp
builder.Services.AddProblemDetails();
builder.Services.AddValidation();   // .NET 10: Minimal API parametrelerini doğrular

public sealed record CreateOrderRequest(
    [property: Required] Guid ProductId,
    [property: Range(1, 100)] int Quantity);
```

Daha karmaşık kurallar için yaygın tercih **FluentValidation** kütüphanesidir. Kural nerede olursa olsun ayrım şudur:

- **Girdi doğrulama** (alan boş mu, aralıkta mı) uç noktada yapılır ve `400` döner.
- **İş kuralı** (stokta yeterli ürün var mı) domain ya da uygulama katmanında yapılır ve `409`/`422` döner.

## Sayfalama, filtreleme ve sıralama

Liste uç noktaları **hiçbir zaman** sınırsız sonuç dönmemelidir.

**Offset sayfalama** (`?page=3&pageSize=20`): basittir, sayfaya atlamaya izin verir. Ama `OFFSET 100000` veritabanının yüz bin satırı okuyup atması demektir ve sayfa değiştirirken araya kayıt eklenirse satırlar kayar.

**Cursor (keyset) sayfalama** (`?after=2026-11-20T10:00:00Z_8412&limit=20`): son görülen anahtarın sonrasını ister. İndeksle doğrudan konumlanır, büyük tablolarda sabit hızdadır. Sonsuz kaydırma ve akışlar için doğru seçimdir.

```csharp
var page = await db.Orders
    .Where(o => o.CreatedAt < cursor.CreatedAt
             || (o.CreatedAt == cursor.CreatedAt && o.Id < cursor.Id))
    .OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
    .Take(limit + 1)                  // bir fazla oku: sonraki sayfa var mı?
    .ToListAsync(ct);
```

`pageSize` için üst sınır koyun (ör. 100). Yoksa birisi `pageSize=1000000` gönderir.

## Versiyonlama

Yayımlanmış bir API'yi kıran değişiklik (alan silmek, tipini değiştirmek, zorunlu alan eklemek) yeni bir sürüm gerektirir. Kırmayan değişiklik (yeni isteğe bağlı alan, yeni uç nokta) gerektirmez.

| Yöntem | Örnek | Not |
| --- | --- | --- |
| URL yolu | `/api/v2/orders` | En yaygın, en görünür |
| Sorgu dizgisi | `/api/orders?api-version=2.0` | Azure API'lerinin tercihi |
| Başlık | `Api-Version: 2` | URL temiz kalır, keşfi zordur |

`Asp.Versioning.Http` paketi sürümleri tanımlamayı ve eski sürümleri "deprecated" olarak işaretlemeyi sağlar. İyi uygulama: eski sürümü hemen kapatmayın, kullanım ölçün ve bir kaldırma takvimi duyurun.

## Idempotency anahtarı

Ödeme gibi `POST` isteklerinde ağ koparsa istemci isteğin işlenip işlenmediğini bilemez ve tekrar dener. Çözüm, istemcinin her işlem için benzersiz bir anahtar göndermesidir:

```http
POST /api/payments
Idempotency-Key: 6f1c2b7e-1d3a-4c55-9a0e-2f7b8f9d1c44
```

Sunucu anahtarı ilk istekte sonucuyla birlikte saklar (benzersiz indeksli bir tabloda ya da Redis'te). Aynı anahtarla gelen ikinci istekte işlemi tekrar yapmaz, saklanan yanıtı döner. Stripe ve diğer ödeme sağlayıcıları bu deseni kullanır. Kuyruktaki mesajlar için aynı fikrin karşılığı **idempotent tüketicidir** (Mimari bölümüne bakın).

## Eşzamanlı güncelleme: ETag

İki kullanıcı aynı kaydı okuyup ikisi de güncellerse sonradan yazan öncekinin değişikliğini sessizce ezer (kayıp güncelleme). HTTP'nin çözümü koşullu istektir:

1. `GET` yanıtı kaydın sürümünü `ETag: "17"` başlığıyla döner.
2. İstemci güncellerken `If-Match: "17"` gönderir.
3. Sunucu sürüm hâlâ 17 ise günceller, değilse `412 Precondition Failed` döner.

Veritabanı tarafında bunun karşılığı EF Core'daki iyimser eşzamanlılık belirtecidir (EF Core dersine bakın).

## Hız sınırlama

ASP.NET Core'da yerleşik hız sınırlayıcı vardır:

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("per-user", context =>
        RateLimitPartition.GetTokenBucketLimiter(
            context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 20,
                TokensPerPeriod = 10,
                ReplenishmentPeriod = TimeSpan.FromSeconds(1),
            }));
});

app.UseRateLimiter();
orders.MapPost("/", CreateOrder).RequireRateLimiting("per-user");
```

Bu sınırlayıcı **tek süreç içindedir**. Birden fazla örnek çalışıyorsa sınır örnek sayısıyla çarpılır. Dağıtık sınır için Redis tabanlı bir çözüm ya da API ağ geçidi gerekir (Sistem Tasarımı › Dağıtık Hız Sınırlayıcı).

## OpenAPI belgesi

.NET 9 ve sonrasında şablonlar Swashbuckle yerine yerleşik OpenAPI üretimini kullanır:

```csharp
builder.Services.AddOpenApi();
app.MapOpenApi();          // /openapi/v1.json
```

Belge, `TypedResults` dönüş tipleri ve `WithName`, `WithSummary`, `Produces` gibi meta verilerle zenginleşir. Arayüz için Scalar ya da Swagger UI eklenebilir. Belgeyi yalnızca geliştirmede açmak ya da kimlik doğrulamanın arkasına koymak iyi bir alışkanlıktır.

## Mülakatta sorulur

- **"PUT ile PATCH farkı?"** PUT kaynağın tamamını değiştirir ve idempotenttir. PATCH yalnızca gönderilen alanları değiştirir.
- **"401 ile 403 farkı?"** 401 kimliğin doğrulanmadığını, 403 kimliğin bilindiğini ama yetkinin olmadığını söyler.
- **"Ödeme uç noktasında istemci tekrar denerse çift ödeme nasıl önlenir?"** Idempotency anahtarı. Sunucu anahtarı sonucuyla saklar ve tekrar gelen isteğe aynı yanıtı döner.
- **"Milyonlarca satırlık listeyi nasıl sayfalarsın?"** Cursor (keyset) sayfalama. Offset büyük değerlerde yavaşlar ve kayma yapar.
- **"API'de kıran değişiklik yapman gerekiyor. Ne yaparsın?"** Yeni sürüm açarım, eskisini deprecated işaretlerim, kullanımı izlerim ve takvimli kaldırırım.

## Özet

- URL kaynağı, HTTP fiili işi anlatır. Doğru durum kodu API'nin sözleşmesinin parçasıdır.
- Hatalar `ProblemDetails` biçiminde döner. Girdi doğrulaması `400`, iş kuralı ihlali `409`/`422` üretir.
- Listeler daima sayfalanır. Büyük veride cursor sayfalama kullanılır.
- Tekrar denenebilecek `POST`'lar idempotency anahtarıyla, eşzamanlı güncellemeler ETag ile korunur.
- Versiyonlama yalnızca kıran değişiklikler içindir. Hız sınırlama tek örnekte yerleşik, çok örnekte dağıtık olmalıdır.
