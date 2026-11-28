---
title: "Proje 2: Dağıtık Hız Sınırlayıcı"
summary: Önce yarış durumu olan saf bir sürüm yazıp kırılmasını izle, sonra Redis ve Lua ile atomik token bucket ve kayan pencere sayacı kur. Çok örnekli testler, ek gecikme ölçümü, açık/kapalı başarısızlık ve standart başlıklar.
minutes: 25
level: intermediate
---

Bu projede [Dağıtık Hız Sınırlayıcı](/tracks/sistem-tasarimi/hiz-sinirlayici) dersindeki tasarımı bir ASP.NET Core ara katmanı (middleware) olarak yazacaksın. Projenin en değerli anı, ilk sürümün **yük altında sınırı aştığını kendi testinle yakaladığın** andır: yarış durumları kitapta okunduğunda soyuttur, testte kırmızıya döndüğünde unutulmaz.

## Hedef

```csharp
builder.Services.AddDistributedRateLimiter(options =>
{
    options.AddRule("ucretsiz-plan", key: ctx => ctx.User.FindFirst("sub")?.Value, limit: 100, per: TimeSpan.FromMinutes(1));
    options.AddRule("giris", key: ctx => ctx.Connection.RemoteIpAddress?.ToString(), limit: 5, per: TimeSpan.FromMinutes(1),
        appliesTo: "/v1/login", failureMode: FailureMode.Closed);
});

app.UseDistributedRateLimiter();
```

Sınır aşılınca `429` ve `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` başlıkları dönmeli.

## Aşama 1: neden yerleşik sınırlayıcı yetmez?

ASP.NET Core'un yerleşik `Microsoft.AspNetCore.RateLimiting` ara katmanıyla dakikada 100 sınırı koy, servisi **üç örnekle** nginx arkasında çalıştır ve 300 istek gönder. Kaç tanesi geçti? Yerleşik sınırlayıcı **süreç içi** bellekte sayar; üç örnek varsa gerçek sınır üç katıdır. Bu gözlemi README'ye yaz: dağıtık sınırlayıcıya neden ihtiyaç olduğunun kanıtı budur.

## Aşama 2: saf Redis sürümü ve yarış durumu

İlk denemeyi bilerek yanlış yaz: "oku, karşılaştır, yaz".

```csharp
// YANLIŞ: üç ayrı komut, araya başka istek girebilir.
var count = (int?)await redis.StringGetAsync(key) ?? 0;
if (count >= limit) return Denied();
await redis.StringSetAsync(key, count + 1, window);
return Allowed();
```

Şimdi testi yaz: üç örneğe paralel olarak 1.000 istek gönder (ör. 50 eşzamanlı istemci), sınır 100. Geçen istek sayısını say. Yük arttıkça 100'ün ne kadar üstüne çıkıyor? Bu testi projenin sonuna kadar sakla; her yeni sürüm bu testten geçmeli.

```csharp
[Fact]
public async Task Limit_is_never_exceeded_under_concurrency()
{
    var tasks = Enumerable.Range(0, 1_000).Select(_ => client.GetAsync("/v1/ping"));
    var responses = await Task.WhenAll(tasks);

    var allowed = responses.Count(r => r.StatusCode == HttpStatusCode.OK);
    Assert.InRange(allowed, 1, 100);
}
```

## Aşama 3: sabit pencere, atomik

En basit doğru sürüm: `INCR` atomiktir.

```text
MULTI
INCR   rl:{anahtar}:{pencere_no}
EXPIRE rl:{anahtar}:{pencere_no} 60 NX
EXEC
```

Testin artık yeşil olmalı. Sonra **pencere sınırı sorununu** göster: 59. saniyede 100, 61. saniyede 100 istek gönderen bir test yaz; iki saniyede 200 istek geçtiğini doğrula.

## Aşama 4: token bucket ve kayan pencere sayacı (Lua)

İki algoritmayı da Lua betiği olarak yaz ve `ScriptEvaluateAsync` ile çalıştır. Betiği her çağrıda göndermek yerine bir kez yükle (`SCRIPT LOAD`) ve özetiyle çağır (`EVALSHA`); StackExchange.Redis'in `LuaScript.Prepare(...).Load(server)` yardımcısı bunu yapar.

Dikkat edilecekler:

- **Zaman kaynağı:** her sunucunun saati farklıdır. Zamanı betiğin içinde `redis.call('TIME')` ile Redis'ten al.
- **Anahtar süresi:** kova dolduktan sonra anahtarın kendiliğinden silinmesi için `PEXPIRE` (kapasite / hız kadar).
- **Redis Cluster:** bir betiğin eriştiği bütün anahtarlar aynı slotta olmalı. Birden çok kuralı aynı betikte denetleyeceksen anahtarlarda **hash etiketi** kullan: `rl:{kullanici:42}:dakika`, `rl:{kullanici:42}:gun`.
- Token bucket'ta ani yükü test et: kova doluyken 100 istek anında geçmeli, sonrakiler saniyede `r` hızında.

## Aşama 5: ek gecikmeyi ölç

Sınırlayıcı her isteğin yolundadır. k6 ile sınırlayıcılı ve sınırlayıcısız p50/p99'u karşılaştır. Hedef: < 1 ms ek gecikme.

| Sürüm | p50 ek gecikme | p99 ek gecikme | Redis işlem/saniye |
| --- | --- | --- | --- |
| Sabit pencere (MULTI) | | | |
| Token bucket (EVALSHA) | | | |
| Kayan pencere sayacı | | | |
| + yerel "engellendi" önbelleği | | | |

Son satırdaki iyileştirme: bir anahtar `429` aldığında `Retry-After` süresince sonucu süreç içi bellekte tut; bu sürede Redis'e hiç sorma. Kötüye kullanan bir istemci Redis'i boğamaz.

## Aşama 6: başarısızlık modları

- `docker compose stop redis` ve iste: **açık** modda istekler geçiyor mu, **kapalı** modda (giriş uç noktası) `503` dönüyor mu?
- Redis çağrısına kısa zaman aşımı (ör. 10 ms) koy; Redis yavaşladığında (`redis-cli DEBUG SLEEP 2`) API'nin kilitlenmediğini doğrula. (Redis 7+ `DEBUG` komutunu varsayılan olarak engeller: sunucuyu `--enable-debug-command local` ile başlat ve komutu konteyner içinden çalıştır: `docker compose exec redis redis-cli DEBUG SLEEP 2`.)
- Redis uzun süre düşükse devre kesici açılsın ve süreç içi yerel sınırlayıcıya geri düşülsün (sınır / örnek sayısı). Bunun doğruluk bedelini README'de açıkla.

## Aşama 7: kurallar ve gözlemlenebilirlik

- Kuralları yapılandırma dosyasından oku; değişiklikte yeniden başlatmadan yükle (`IOptionsMonitor`).
- Metrikler: kural başına izin verilen ve reddedilen istek sayısı, Redis gecikmesi, açık-başarısızlık sayısı. Bir panoda, saldırı benzetimi sırasında `429` oranının yükseldiğini gör.

## Bonus görevler

- **Maliyet temelli sınır:** istek başına 1 yerine uç noktaya göre farklı jeton (`/search` = 5).
- **Kademeli sınırlar:** saniyede 10 **ve** dakikada 300 **ve** günde 10.000; tek Lua çağrısında üç kova.
- **Yerel ön sayaç:** her örnek küçük bir jeton payını yerel harcasın, Redis ile toplu eşitlesin. Doğruluk kaybını ölç.
- Algoritmaları bir benzetim aracında görselleştir: aynı trafik deseni (ani yük, sabit yük) farklı algoritmalarda nasıl sonuç veriyor?

## Teslim ölçütleri

- [ ] Yarış durumunu yakalayan ve son sürümde yeşil olan eşzamanlılık testi.
- [ ] En az iki algoritmanın (token bucket + bir pencere yöntemi) Lua ile atomik uygulaması.
- [ ] Ek gecikme ölçüm tablosu.
- [ ] Açık/kapalı başarısızlık testleri ve README'de ödünleşimlerin açıklaması.
