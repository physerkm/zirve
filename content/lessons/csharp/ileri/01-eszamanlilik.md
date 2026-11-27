---
title: C#'ta Eşzamanlılık
summary: Yarış durumu ve atomiklik, lock ve yeni Lock tipi, Interlocked, SemaphoreSlim ile async kilitleme, eşzamanlı koleksiyonlar ve tuzakları, Channel ile üretici–tüketici, Parallel.ForEachAsync, thread havuzu açlığı ve kilitlenmeler.
minutes: 24
level: advanced
---

Microsoft'un dağıtık sistem ilanları "concurrency" bilgisini açıkça ister. Senior .NET rol tanımları "Task Parallel Library: kilitlenmeden kaçınma, SemaphoreSlim, CancellationTokenSource" der. `async/await` dersinde asenkron programlamayı gördük. Bu ders, aynı veriye **aynı anda** birden fazla thread eriştiğinde ne olduğunu ve bunun nasıl doğru yönetileceğini anlatır.

## Yarış durumu

```csharp
var counter = 0;
Parallel.For(0, 100_000, _ => counter++);
Console.WriteLine(counter);   // 100000 değil: 61 842, 73 105...
```

`counter++` tek bir işlem gibi görünür ama üç adımdır: **oku, bir ekle, yaz**. İki thread aynı değeri okur, ikisi de bir ekler, ikisi de aynı sonucu yazar ve bir artış kaybolur. Bu bir **yarış durumudur** (race condition): sonuç, thread'lerin zamanlamasına bağlıdır. Testte görünmeyip yük altında ortaya çıkar.

Çözüm, işlemi **atomik** yapmak ya da paylaşılan veriye erişimi **karşılıklı dışlama** (mutual exclusion) ile sıraya sokmaktır.

## Interlocked: kilitsiz atomik işlemler

Tek bir sayı ya da referans üzerindeki basit işlemler için en hızlı yol:

```csharp
Interlocked.Increment(ref counter);
Interlocked.Add(ref total, amount);
var previous = Interlocked.Exchange(ref current, newValue);
Interlocked.CompareExchange(ref state, newValue, expected);   // yalnızca beklenen değerdeyse değiştir (CAS)
```

`CompareExchange` (compare-and-swap), kilitsiz veri yapılarının temel taşıdır.

## lock

Birden fazla alanı birlikte tutarlı değiştirmek gerektiğinde:

```csharp
public sealed class Account
{
    private readonly Lock _gate = new();       // C# 13 / .NET 9: özel Lock tipi
    private decimal _balance;

    public bool TryWithdraw(decimal amount)
    {
        lock (_gate)
        {
            if (_balance < amount) return false;   // kontrol ve değişiklik aynı kilit içinde
            _balance -= amount;
            return true;
        }
    }
}
```

- Kontrol ve değişiklik **aynı kilit içinde** olmalıdır. "Önce kontrol et, sonra kilitle" yarış durumunu çözmez (check-then-act hatası).
- Kilit nesnesi `private readonly` olmalıdır. `lock (this)` ya da `lock (typeof(X))` dışarıdaki kodun da aynı nesneyi kilitlemesine izin verir.
- .NET 9 ile gelen `System.Threading.Lock` tipi, eski `object` kilidinden daha hızlıdır ve niyeti açıkça gösterir. Eski kodda `private readonly object _gate = new();` görürsünüz.
- Kilit içinde **olabildiğince az iş** yapın. Ağ ve disk çağrısı yapmayın.

### lock içinde await olmaz

```csharp
lock (_gate)
{
    await SaveAsync();   // derleme hatası
}
```

Bu hata bilinçlidir. `lock` thread'e bağlıdır. `await` sonrası kod başka bir thread'de devam edebilir ve kilidi başka thread bırakmaya çalışır. Asenkron kodda kilit için `SemaphoreSlim` kullanılır.

## SemaphoreSlim

İki kullanımı vardır: **async kilit** (sayaç 1) ve **eşzamanlılık sınırı** (sayaç N).

```csharp
public sealed class TokenProvider(IdentityClient identity)
{
    private readonly SemaphoreSlim _refreshGate = new(1, 1);
    private AccessToken? _token;

    public async Task<string> GetAsync(CancellationToken ct)
    {
        if (_token is { IsExpired: false }) return _token.Value;

        await _refreshGate.WaitAsync(ct);
        try
        {
            if (_token is { IsExpired: false }) return _token.Value;   // çift kontrol: başkası yenilemiş olabilir
            _token = await identity.RequestTokenAsync(ct);
            return _token.Value;
        }
        finally
        {
            _refreshGate.Release();   // her durumda bırak
        }
    }
}
```

Eşzamanlılık sınırı olarak: dış bir API aynı anda en fazla 5 isteğe izin veriyorsa `new SemaphoreSlim(5)` ve her çağrının etrafında `WaitAsync`/`Release`.

`Release` her zaman `finally` içinde olmalıdır. Aksi halde bir istisna kilidi sonsuza dek kapalı bırakır.

## Eşzamanlı koleksiyonlar

`List<T>` ve `Dictionary<TKey, TValue>` eşzamanlı yazmaya **dayanıklı değildir**. Aynı anda iki thread `Dictionary`'ye yazarsa iç yapı bozulabilir ve sonsuz döngüye bile girilebilir.

| Koleksiyon | Kullanım |
| --- | --- |
| `ConcurrentDictionary<TKey, TValue>` | Paylaşılan önbellek, sayaç tablosu |
| `ConcurrentQueue<T>` / `ConcurrentStack<T>` | Kilitsiz kuyruk ve yığın |
| `ConcurrentBag<T>` | Sırasız toplama (aynı thread'in ekleyip çıkardığı senaryolarda hızlı) |
| `ImmutableDictionary`, `FrozenDictionary` | Hiç değişmeyen ya da nadiren tümden değiştirilen veri. Okuma kilitsizdir |

### ConcurrentDictionary tuzakları

```csharp
var cache = new ConcurrentDictionary<string, Report>();
var report = cache.GetOrAdd(key, k => BuildExpensiveReport(k));
```

`GetOrAdd` **sözlük açısından** atomiktir ama fabrika fonksiyonu yarışta **birden fazla kez çalışabilir**. Yalnızca bir sonucu saklar, diğerlerini atar. Fabrika pahalıysa ya da yan etkisi varsa (veritabanına yazma) sorun olur. Çözüm, değeri `Lazy<T>` ile sarmaktır:

```csharp
var cache = new ConcurrentDictionary<string, Lazy<Task<Report>>>();
var report = await cache.GetOrAdd(key, k => new Lazy<Task<Report>>(() => BuildReportAsync(k))).Value;
```

Bir diğer tuzak: `if (!dict.ContainsKey(k)) dict[k] = v;` iki ayrı işlemdir ve arada başka thread araya girer. Atomik metotları (`TryAdd`, `AddOrUpdate`, `GetOrAdd`) kullanın.

## Channel: üretici–tüketici

`System.Threading.Channels` asenkron üretici–tüketici kuyruğudur. Kilitleri ve sinyalleşmeyi kendisi yönetir:

```csharp
var channel = Channel.CreateBounded<Order>(new BoundedChannelOptions(500)
{
    FullMode = BoundedChannelFullMode.Wait,   // dolunca üretici bekler: geri basınç
    SingleReader = false,
});

// Üretici
await channel.Writer.WriteAsync(order, ct);
channel.Writer.Complete();                     // üretim bitti

// 4 paralel tüketici
var consumers = Enumerable.Range(0, 4).Select(async _ =>
{
    await foreach (var o in channel.Reader.ReadAllAsync(ct))
    {
        await ProcessAsync(o, ct);
    }
});
await Task.WhenAll(consumers);
```

**Sınırlı (bounded)** kanal tercih edin. Sınırsız kanal, tüketici yavaşsa belleği sonsuza kadar doldurur.

## Paralel işlem

| İş türü | Araç |
| --- | --- |
| CPU yoğun, bağımsız parçalar | `Parallel.For`, `Parallel.ForEach`, PLINQ (`AsParallel`) |
| G/Ç yoğun (HTTP, veritabanı), sınırlı paralellik | `Parallel.ForEachAsync` ya da `SemaphoreSlim` + `Task.WhenAll` |
| Hepsini aynı anda başlat, hepsini bekle | `Task.WhenAll` |

```csharp
await Parallel.ForEachAsync(customerIds, new ParallelOptions { MaxDegreeOfParallelism = 8, CancellationToken = ct },
    async (id, token) => await SyncCustomerAsync(id, token));
```

10 000 HTTP isteğini sınırsız `Task.WhenAll` ile başlatmak hem karşı tarafı hem kendi bağlantı havuzunuzu boğar. Paralelliği her zaman sınırlayın.

## Thread havuzu açlığı

ASP.NET Core istekleri thread havuzundaki thread'lerde çalışır. Asenkron kodu **senkron beklemek** (`.Result`, `.Wait()`, `GetAwaiter().GetResult()`) bir thread'i, iş bitene kadar hiçbir şey yapmadan bloklar:

```csharp
public IActionResult Get() => Ok(_client.GetStringAsync(url).Result);   // sync-over-async
```

Yük altında havuzdaki bütün thread'ler bu şekilde bekler, havuz yavaş büyür (saniyede birkaç thread ekler) ve yeni istekler kuyrukta birikir. Belirti: CPU düşük ama gecikme çok yüksek ve thread sayısı sürekli artıyor. `dotnet-counters` ile `ThreadPool Queue Length` artışı görülür. Çözüm: **baştan sona async** (async all the way).

## Kilitlenme (deadlock)

İki thread birbirinin tuttuğu kilidi beklerse ikisi de sonsuza kadar bekler:

```csharp
// Thread 1                      // Thread 2
lock (a) { lock (b) { ... } }    lock (b) { lock (a) { ... } }
```

Önleme yolları:

- **Kilitleri her zaman aynı sırayla alın.**
- Kilit içinde dış koda (olay, sanal metot, geri çağırma) çağrı yapmayın. O kod başka bir kilit alabilir.
- Zaman aşımlı kilit kullanın (`SemaphoreSlim.WaitAsync(timeout)`, `Monitor.TryEnter`).
- Paylaşılan durumu azaltın: değişmez veri, mesajlaşma (Channel), thread başına durum.

Klasik .NET Framework kilitlenmesi (UI ya da eski ASP.NET'te `SynchronizationContext` ile `.Result`) ASP.NET Core'da `SynchronizationContext` olmadığı için oluşmaz. Ama aynı kod masaüstü uygulamasında ya da kütüphane olarak eski bir uygulamada kullanılırsa oluşur. Kütüphane kodunda `ConfigureAwait(false)` bu yüzden hâlâ önerilir.

## volatile ve bellek modeli

Derleyici ve işlemci, tek thread açısından sonucu değiştirmeyen yeniden sıralamalar yapabilir. Bir thread'in yazdığı bayrağı başka thread hiç görmeyebilir. `volatile` alan ya da `Volatile.Read/Write` bunu önler. Pratikte uygulama kodunda nadiren gerekir: `lock`, `Interlocked`, `Channel` ve eşzamanlı koleksiyonlar gerekli bellek bariyerlerini zaten koyar. Kendiniz kilitsiz algoritma yazmıyorsanız bu araçları kullanın.

## Mülakatta sorulur

- **"`counter++` neden thread güvenli değil?"** Oku–değiştir–yaz üç adımdır. `Interlocked.Increment` ya da `lock` gerekir.
- **"`lock` içinde neden `await` kullanılamaz?"** Kilit thread'e bağlıdır, `await` sonrası farklı thread'de devam edilebilir. `SemaphoreSlim.WaitAsync` kullanılır.
- **"`ConcurrentDictionary.GetOrAdd` fabrikası kaç kez çalışır?"** Yarışta birden fazla kez çalışabilir. Tek çalışması gerekiyorsa `Lazy<T>` ile sararım.
- **"CPU düşük ama API çok yavaş. Ne olabilir?"** Thread havuzu açlığı, büyük ihtimalle sync-over-async. Ya da bir bağımlılık bekleniyor.
- **"Deadlock'u nasıl önlersin?"** Kilitleri aynı sırayla almak, kilit içinde dış kod çağırmamak, zaman aşımı ve paylaşılan durumu azaltmak.
- **"10 000 isteği paralel nasıl gönderirsin?"** `Parallel.ForEachAsync` ya da `SemaphoreSlim` ile sınırlı paralellik.

## Özet

- Paylaşılan değiştirilebilir durum yarış durumunun kaynağıdır. Atomik işlem ya da karşılıklı dışlama gerekir.
- Basit sayaçlar için `Interlocked`, birden fazla alan için `lock`, asenkron kod için `SemaphoreSlim`.
- Eşzamanlı koleksiyonları atomik metotlarıyla kullanın. `GetOrAdd` fabrikası birden fazla kez çalışabilir.
- Üretici–tüketici için sınırlı `Channel`, G/Ç için sınırlı paralellik.
- Sync-over-async thread havuzunu aç bırakır. Kilitleri aynı sırayla alın.
