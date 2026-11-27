---
title: Modern C# (C# 9–14)
summary: Record'lar ve with ifadesi, init ve required, desen eşleme ve switch ifadeleri, nullable reference types, primary constructor, collection expression, raw string literal, dosya kapsamlı namespace ve global using, field anahtar kelimesi ve extension üyeleri.
minutes: 22
level: intermediate
---

İlanlar ".NET 8+", ".NET 9", ".NET 10" der. Codemotion'un ilanı "C# 12/13: primary constructor, collection expression" diye açıkça yazar. Mülakatta görüşmeci modern sözdizimini okuyabilmeni bekler, canlı kodlamada da kullanırsan kodun daha kısa ve niyeti daha açık olur. Bu ders C# 9'dan C# 14'e (.NET 10 ile gelen sürüm) kadar en çok kullanılan özellikleri toplar.

## Record'lar (C# 9, 10)

```csharp
public sealed record OrderPlaced(Guid OrderId, decimal Total, DateTimeOffset At);

var a = new OrderPlaced(id, 250m, now);
var b = a with { Total = 300m };     // kopya, yalnızca Total farklı (non-destructive mutation)

Console.WriteLine(a == b);           // False: değer eşitliği
Console.WriteLine(a);                // OrderPlaced { OrderId = ..., Total = 250, At = ... }
```

Record'ların sağladıkları: **değer eşitliği** (`Equals`, `GetHashCode`, `==`), okunur `ToString`, `with` ile kopyalama ve konumsal (positional) sözdiziminde yapıbozum (`var (id, total, _) = a;`).

- `record` (ya da `record class`) referans tipidir. `record struct` değer tipidir.
- Konumsal record'ların özellikleri `init` erişimcilidir: oluşturulduktan sonra değiştirilemez.
- Kullanım yerleri: DTO'lar, komutlar, olaylar, value object'ler.
- Dikkat: record içindeki bir `List<T>` alanı yine referanstır. İki record'un eşitliği listelerin **referans** eşitliğine bakar ve `with` listeyi kopyalamaz (sığ kopya).

## init ve required (C# 9, 11)

```csharp
public sealed class CreateUserRequest
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public string? Phone { get; init; }
}

var request = new CreateUserRequest { Email = "ada@example.com", Name = "Ada" };   // Name unutulursa derleme hatası
```

- `init`: yalnızca nesne oluşturulurken atanabilir.
- `required`: nesne başlatıcıda atanması **zorunludur**. Kurucu yazmadan geçersiz nesne oluşumunu derleme zamanında engeller.

## Desen eşleme (C# 7–11)

```csharp
decimal Shipping(Order order) => order switch
{
    { Total: >= 500m }                          => 0m,
    { Address.Country: "TR", Items.Count: <= 2 } => 29.90m,
    { Address.Country: "TR" }                   => 49.90m,
    { Address.Country: not null }               => 149m,
    _ => throw new ArgumentException("Adres eksik", nameof(order)),
};
```

Desen türleri:

| Desen | Örnek |
| --- | --- |
| Tip | `shape is Circle c` |
| Özellik | `{ Status: OrderStatus.Paid, Total: > 0 }` |
| İlişkisel | `>= 500m`, `< 0` |
| Mantıksal | `and`, `or`, `not` (`not null`, `>= 1 and <= 5`) |
| Konumsal | `(0, 0)` (yapıbozumla) |
| Liste (C# 11) | `[]`, `[var first, ..]`, `[_, _, ..var rest]` |

```csharp
string Describe(int[] values) => values switch
{
    [] => "boş",
    [var single] => $"tek eleman: {single}",
    [var first, .., var last] => $"{first} ile başlıyor, {last} ile bitiyor",
};
```

Switch ifadesi bir **ifadedir** (değer döner), derleyici kapsanmayan durumlar için uyarı verir. Bayrak kontrolleriyle dolu `if/else` zincirlerinin yerini alır.

Kapalı bir tip hiyerarşisinde her durumun ele alınması, domain modellemede güçlü bir araçtır:

```csharp
public abstract record PaymentResult;
public sealed record Approved(string TransactionId) : PaymentResult;
public sealed record Declined(string Reason) : PaymentResult;
public sealed record RequiresAction(Uri RedirectUrl) : PaymentResult;

IResult ToHttp(PaymentResult result) => result switch
{
    Approved a       => TypedResults.Ok(a),
    Declined d       => TypedResults.Problem(d.Reason, statusCode: 402),
    RequiresAction r => TypedResults.Accepted(r.RedirectUrl),
    _ => throw new UnreachableException(),
};
```

## Nullable reference types (C# 8)

`<Nullable>enable</Nullable>` açıkken derleyici, referans tiplerinin `null` olup olamayacağını izler:

```csharp
public string Name { get; set; } = "";     // asla null değil
public string? MiddleName { get; set; }    // null olabilir

int Length(string? text) => text.Length;           // uyarı: olası null başvuru
int SafeLength(string? text) => text?.Length ?? 0; // doğru
```

- Bu bir **derleme zamanı** analizidir. Çalışma zamanında hiçbir şey değişmez. Dışarıdan (JSON, veritabanı) gelen veri yine `null` olabilir.
- `!` (null-forgiving) operatörü uyarıyı susturur. "Ben biliyorum" demektir. Sık kullanılıyorsa tasarımda sorun vardır.
- `[NotNullWhen(true)]` gibi öznitelikler derleyiciye akış bilgisi verir: `TryGetValue(key, [NotNullWhen(true)] out var value)`.
- Yeni projelerde varsayılan olarak açıktır. Uyarıları hata olarak ele almak (`TreatWarningsAsErrors`) `NullReferenceException` sınıfındaki hataların çoğunu derleme zamanına taşır.

## Primary constructor (C# 12)

```csharp
public sealed class OrderService(IOrderRepository orders, ILogger<OrderService> logger)
{
    public async Task CancelAsync(Guid id, CancellationToken ct)
    {
        var order = await orders.GetAsync(id, ct);
        logger.LogInformation("Sipariş iptal ediliyor: {OrderId}", id);
        order.Cancel();
    }
}
```

DI ile alınan bağımlılıklar için alan tanımlama ve atama törenini kaldırır. Bilmen gerekenler:

- Parametreler **alan değildir**, sınıf boyunca yakalanan parametrelerdir ve `readonly` **değildir**: sınıf içinde yeniden atanabilirler. Bunu engellemek isteyen ekipler `private readonly IOrderRepository _orders = orders;` yazar ya da analizör kuralı kullanır.
- Record'lardaki konumsal parametrelerden farklı olarak sınıflarda **genel özellik üretmez**.

## Collection expression (C# 12)

```csharp
int[] numbers = [1, 2, 3];
List<string> names = ["Ada", "Alan"];
ReadOnlySpan<char> separators = [',', ';'];
int[] all = [..numbers, 4, 5];           // yayılım (spread)
List<Order> empty = [];
```

Hedef tipe göre en verimli oluşturma yolunu derleyici seçer. Dizi, liste, span ve immutable koleksiyonlar için tek bir sözdizimi sağlar.

## Diğer sık kullanılanlar

```csharp
// Dosya kapsamlı namespace (C# 10): bir girinti seviyesi kazanır
namespace Orders.Api;

// Global using (C# 10): bir kez yazılır, bütün projede geçerli
global using Microsoft.EntityFrameworkCore;

// Raw string literal (C# 11): kaçış karakteri yok, JSON ve SQL için ideal
var sql = """
    SELECT "Id", "Total"
    FROM "Orders"
    WHERE "Status" = 'Paid'
    """;

// Hedef tipli new (C# 9)
Dictionary<string, List<int>> map = new();

// Static anonim fonksiyon (C# 9): yanlışlıkla değişken yakalamayı engeller
var adults = people.Where(static p => p.Age >= 18);

// Generic matematik (C# 11): sayısal tiplerden bağımsız algoritma
static T Sum<T>(IEnumerable<T> values) where T : INumber<T> => values.Aggregate(T.Zero, (a, b) => a + b);
```

## C# 13 ve 14

- **`params` koleksiyonlar (C# 13):** `params ReadOnlySpan<int> values` gibi tanımlar. Çağrıda dizi tahsisi olmadan değişken sayıda argüman.
- **Yeni `Lock` tipi (C# 13 / .NET 9):** `lock` ifadesiyle kullanıldığında daha verimli kilit.
- **`field` anahtar kelimesi (C# 14):** özelliğin arka alanını elle tanımlamadan erişimciye mantık eklemek:

```csharp
public string Name
{
    get;
    set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
}
```

- **Extension üyeleri (C# 14):** genişletme metotlarının yanında genişletme **özellikleri** ve statik üyeler tanımlamak için yeni `extension` blokları:

```csharp
public static class StringExtensions
{
    extension(string text)
    {
        public bool IsBlank => string.IsNullOrWhiteSpace(text);
        public string Truncate(int max) => text.Length <= max ? text : text[..max] + "…";
    }
}

if (input.IsBlank) { /* ... */ }
```

- **Null koşullu atama (C# 14):** `customer?.Address = newAddress;` müşteri `null` değilse atar.

Yeni bir sürümün her özelliğini kullanmak zorunlu değildir. Ekip içinde ortak bir stil (`.editorconfig` ve analizörler) daha önemlidir.

## Mülakatta sorulur

- **"Record ile class farkı?"** Record değer eşitliği, `with` ile kopyalama ve otomatik `ToString` sağlar. Değişmez veri taşıyıcıları için uygundur.
- **"Record içindeki liste neden sorun olabilir?"** Eşitlik ve `with` sığdır: liste referansı paylaşılır ve referansla karşılaştırılır.
- **"Nullable reference types çalışma zamanında koruma sağlar mı?"** Hayır, yalnızca derleme zamanı analizidir. Dış veriyi yine doğrularım.
- **"Primary constructor parametreleri readonly mu?"** Hayır. Sınıf içinde yeniden atanabilirler. Gerekirse readonly alana kopyalarım.
- **"`required` ile kurucu parametresi farkı?"** İkisi de zorunlu atama sağlar. `required` nesne başlatıcı sözdizimiyle çalışır ve çok alanlı DTO'larda daha okunurdur.

## Özet

- Record'lar değer eşitliği ve `with` ile değişmez veri modellemeyi kolaylaştırır. Eşitlikleri sığdır.
- `init` ve `required` geçersiz nesne oluşumunu derleme zamanında engeller.
- Switch ifadeleri ve desenler (özellik, ilişkisel, liste) dallanmayı okunur ve eksiksiz kılar.
- Nullable reference types derleme zamanında null hatalarını yakalar, çalışma zamanı koruması değildir.
- Primary constructor ve collection expression törenleri azaltır. Primary constructor parametreleri readonly değildir.
- C# 14: `field` anahtar kelimesi, extension üyeleri ve null koşullu atama.
