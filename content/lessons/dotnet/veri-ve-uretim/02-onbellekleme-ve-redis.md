---
title: .NET'te Önbellekleme ve Redis
summary: IMemoryCache, IDistributedCache ve HybridCache farkları, cache-aside deseni, TTL ve invalidation stratejileri, cache stampede, Redis veri yapıları ve StackExchange.Redis ile doğru kullanım.
minutes: 20
level: intermediate
---

Redis, Türkiye ve yurt dışındaki .NET ilanlarında en sık geçen altyapı bileşenlerinden biridir. Sistem Tasarımı yolunda önbelleğin kavramlarını gördük. Bu ders aynı fikirlerin .NET kodunda nasıl uygulandığını ve gerçek projelerde nerede ters gittiğini anlatır.

## Üç seçenek

| | `IMemoryCache` | `IDistributedCache` | `HybridCache` |
| --- | --- | --- | --- |
| Nerede | Sürecin belleğinde | Dış depoda (Redis, SQL Server) | İkisi birden: L1 bellek + L2 dağıtık |
| Hız | Nanosaniyeler | Ağ gidiş-dönüşü (~0,5–1 ms) | L1 vurursa bellek hızında |
| Örnekler arası paylaşım | Yok | Var | Var (L2 üzerinden) |
| Ne saklar | Herhangi bir nesne | `byte[]` (serileştirme sizde) | Nesne (serileştirme yerleşik) |
| Stampede koruması | Yok | Yok | **Var** |

`HybridCache` (`Microsoft.Extensions.Caching.Hybrid`) .NET 9 ile geldi ve yeni kodda varsayılan tercih olmalıdır. İki katmanı yönetir, aynı anahtar için gelen eşzamanlı istekleri tek bir veri kaynağı çağrısında birleştirir ve etiketle toplu silmeyi destekler.

```csharp
builder.Services.AddStackExchangeRedisCache(o => o.Configuration = builder.Configuration.GetConnectionString("Redis"));
builder.Services.AddHybridCache(o =>
{
    o.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(10),          // L2 (Redis) süresi
        LocalCacheExpiration = TimeSpan.FromMinutes(1), // L1 (bellek) süresi
    };
});

public sealed class ProductQueries(HybridCache cache, AppDbContext db)
{
    public ValueTask<ProductDto?> GetAsync(Guid id, CancellationToken ct) =>
        cache.GetOrCreateAsync(
            $"product:{id}",
            async token => await db.Products.AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new ProductDto(p.Id, p.Name, p.Price))
                .FirstOrDefaultAsync(token),
            tags: ["products"],                 // RemoveByTagAsync("products") hepsini birden siler
            cancellationToken: ct);
}
```

## Cache-aside deseni

En yaygın desendir ve yukarıdaki `GetOrCreateAsync` bunu uygular:

1. Önbelleğe bak. Varsa dön.
2. Yoksa veritabanından oku.
3. Sonucu önbelleğe yaz ve dön.

Yazma tarafında iki seçenek vardır:

- **Güncelleyip önbelleği silmek (invalidate):** en güvenlisidir. Bir sonraki okuma taze veriyi yükler.
- **Güncelleyip önbelleğe yeni değeri yazmak:** iki eşzamanlı yazmada önbellekte eski değer kalabilir. Silmek daha az yarış durumu üretir.

```csharp
await db.SaveChangesAsync(ct);
await cache.RemoveAsync($"product:{product.Id}", ct);
```

Sıra önemlidir: **önce veritabanı, sonra önbellek.** Ters sırada, silme ile kayıt arasında gelen bir okuma eski veriyi tekrar önbelleğe yazar.

## TTL ve invalidation

"Bilgisayar biliminde iki zor şey vardır: önbelleği geçersiz kılmak ve isimlendirme." Pratik kurallar:

- **Her girdinin bir TTL'i olsun.** Silme kodunda bir hata olsa bile bayat veri sonsuza dek kalmaz.
- **TTL, verinin ne kadar bayat olabileceğine göre seçilir.** Ürün açıklaması: saatler. Stok adedi: saniyeler ya da hiç önbellek yok. Fiyat: iş biriminin kabul ettiği süre.
- **Toplu geçersiz kılma için etiket ya da sürüm anahtarı kullanın.** Girdileri yazarken `category:42` gibi bir etiket verirseniz o kategorinin bütün ürünlerini `RemoveByTagAsync("category:42")` ile silebilirsiniz. Alternatif: anahtara bir sürüm ekleyin (`products:v7:...`) ve sürümü artırın.
- **TTL'e rastgelelik ekleyin (jitter).** Aynı anda yazılan binlerce girdinin aynı saniyede düşmesini önler.

## Cache stampede

Popüler bir anahtarın süresi dolduğunda, o anda gelen yüzlerce istek önbellekte veriyi bulamaz ve **hepsi birden** veritabanına gider. Veritabanı yükü bir anda katlanır. Buna *cache stampede* ya da *thundering herd* denir.

Çözümler:

- **İstek birleştirme (request coalescing):** aynı anahtar için tek bir yükleme çalışır, diğerleri onun sonucunu bekler. `HybridCache` bunu kendiliğinden yapar. `IMemoryCache.GetOrCreateAsync` **yapmaz**.
- **Erken yenileme:** süre dolmadan arka planda yenile.
- **Dağıtık kilit:** birden fazla sunucu arasında tek yüklemeyi garanti eder. Maliyeti yüksektir.

## Redis'i tanımak

Redis tek thread'li (komut işleme açısından), bellekte çalışan bir veri yapısı sunucusudur. Yalnızca anahtar-değer deposu değildir:

| Yapı | Kullanım |
| --- | --- |
| String | Önbellek değeri, sayaç (`INCR`), dağıtık kilit (`SET key val NX PX 30000`) |
| Hash | Nesne alanları (`HSET user:7 name Ada`) |
| List | Basit kuyruk |
| Set | Benzersiz üyeler, etiketler |
| Sorted Set | Lider tablosu, zaman sıralı veri, kayan pencereli hız sınırı |
| Stream | Tüketici gruplu, kalıcı olay akışı |
| Pub/Sub | Anlık yayın (kalıcı değil, dinleyen yoksa mesaj kaybolur) |

### StackExchange.Redis ile doğru kullanım

```csharp
builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis")!));

public sealed class LoginAttempts(IConnectionMultiplexer redis)
{
    public async Task<bool> IsBlockedAsync(string user)
    {
        var db = redis.GetDatabase();
        var key = $"login-fail:{user}";
        var count = await db.StringIncrementAsync(key);
        if (count == 1) await db.KeyExpireAsync(key, TimeSpan.FromMinutes(15));
        return count > 5;
    }
}
```

- **`ConnectionMultiplexer` singleton olmalıdır.** Bağlantıyı paylaşmak ve çoğullamak için tasarlanmıştır. Her istekte yeni bağlantı açmak ciddi bir performans hatasıdır.
- **`KEYS *` üretimde kullanılmaz.** Bütün anahtar uzayını tarar ve tek thread'li sunucuyu kilitler. Gerekirse `SCAN` kullanılır.
- **Büyük değerlerden kaçının.** Megabaytlarca değer ağı ve sunucuyu yavaşlatır.
- Yukarıdaki `INCR` + `EXPIRE` iki ayrı komuttur. Arada süreç ölürse anahtar süresiz kalır. Atomik olması gerekiyorsa Lua betiği ya da transaction (`MULTI`) kullanılır.

### Kalıcılık ve yüksek erişilebilirlik

- **RDB:** belirli aralıklarla anlık görüntü. Hızlı yeniden açılış, son görüntüden sonrası kaybolabilir.
- **AOF:** her yazma komutu dosyaya eklenir. Daha az kayıp, daha büyük dosya.
- **Replikasyon + Sentinel:** ana sunucu düşerse kopya otomatik olarak ana olur.
- **Redis Cluster:** veri 16384 hash slot'a bölünüp birden fazla düğüme dağıtılır.

Redis önbellek olarak kullanılıyorsa kaybolması felaket olmamalıdır: uygulama Redis olmadan da (yavaş da olsa) çalışmalıdır. Önbellek hatasını yakalayıp veritabanına düşmek bir dayanıklılık kararıdır.

## Ne önbelleğe alınmaz

- Kullanıcıya özel ve hassas veri, anahtar yanlış kurulursa başka kullanıcıya gösterilebilir. Anahtara kullanıcı kimliğini koyun.
- Sık değişen ve tutarlılığı kritik veri (bakiye, stok). Bunlar için doğru araç veritabanı ve doğru transaction'dır.
- Okunma oranı düşük veri. İsabet oranı (hit ratio) düşükse önbellek yalnızca karmaşıklık ekler.

## Mülakatta sorulur

- **"IMemoryCache ile IDistributedCache farkı?"** Biri süreç içinde ve örnekler arasında paylaşılmaz. Diğeri dış depoda ve paylaşılır ama ağ gecikmesi vardır. HybridCache ikisini birleştirir.
- **"Önbellek ve veritabanı tutarsız kalırsa?"** TTL ile sınırlarım. Yazmada önce veritabanını güncelleyip sonra önbelleği silerim.
- **"Cache stampede nedir?"** Popüler anahtar düştüğünde bütün isteklerin veritabanına yığılması. İstek birleştirme, erken yenileme ya da kilitle önlerim.
- **"Redis ile dağıtık kilit nasıl alınır?"** `SET key token NX PX ttl`. Bırakırken token'ı kontrol eden Lua betiği. Kilit süresi işi aşarsa ne olacağını tasarımda düşünürüm.
- **"Neden `ConnectionMultiplexer` singleton?"** Bağlantıyı çoğullar ve paylaşmak için tasarlanmıştır. Her seferinde yeni bağlantı açmak pahalıdır.

## Özet

- Yeni kodda `HybridCache`: iki katman, yerleşik serileştirme ve stampede koruması.
- Cache-aside: oku, yoksa yükle ve yaz. Güncellemede önce veritabanı, sonra önbelleği sil.
- Her girdinin TTL'i olsun. TTL'e jitter ekleyin. Toplu silme için etiket ya da sürüm anahtarı kullanın.
- Redis zengin veri yapıları sunar. Bağlantı singleton olur, `KEYS` kullanılmaz.
- Önbellek düşerse sistem yavaşlamalı ama çökmemelidir.
