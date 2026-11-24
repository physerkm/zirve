---
title: Performans ve Bellek
summary: Ölçmeden optimize etmemek, BenchmarkDotNet, tahsisleri azaltmak, Span ve Memory, stackalloc, ArrayPool, string işlemleri, kutulama, struct tasarımı, GC nesilleri ve LOH, sunucu GC ve DATAS, kaynak üreteçleri ve Native AOT.
minutes: 24
level: advanced
---

90 000 işlem/gün işleyen bir servisin performansı genellikle algoritmadan çok **gereksiz bellek tahsisinden** ve ona bağlı çöp toplama (GC) baskısından etkilenir. Senior rol tanımları "GC tuning, LOH tahsisinden kaçınma, pooling, value type yerleşimi" ister. Microsoft ilanları "performans ayarlama" der. `Değer ve Referans Tipleri` dersinde yığın ve heap'i gördük. Bu ders o temelin üzerine pratik performans araçlarını koyar.

## Kural bir: önce ölç

Sezgi performans konusunda sık yanılır. Sıra şöyledir:

1. **Sorunu ölçün:** hangi uç nokta, hangi yüzdelik (p99), ne kadar yavaş?
2. **Darboğazı bulun:** profil çıkarın (`dotnet-trace`, `dotnet-counters`, Visual Studio profiler, PerfView). Çoğu zaman sorun veritabanı sorgusu ya da ağ çağrısıdır, C# kodu değil.
3. **Mikro düzeyde ölçün:** BenchmarkDotNet ile.
4. **Düzeltin ve tekrar ölçün.**

```csharp
[MemoryDiagnoser]
public class ParsingBenchmarks
{
    private const string Line = "2026-11-24;ORD-8412;3;249.90";

    [Benchmark(Baseline = true)]
    public decimal Split() => decimal.Parse(Line.Split(';')[3], CultureInfo.InvariantCulture);

    [Benchmark]
    public decimal Span()
    {
        var span = Line.AsSpan();
        return decimal.Parse(span[(span.LastIndexOf(';') + 1)..], CultureInfo.InvariantCulture);
    }
}
// BenchmarkRunner.Run<ParsingBenchmarks>();   Release modunda çalıştırın
```

`[MemoryDiagnoser]` her çağrının kaç bayt tahsis ettiğini gösterir. `Split` dört dizgi ve bir dizi tahsis eder. `Span` hiç tahsis etmez.

`Stopwatch` ile elle ölçüm yanıltıcıdır: JIT ısınması, katmanlı derleme ve GC gürültüsü sonucu bozar. BenchmarkDotNet bunları yönetir.

## Tahsis neden önemli?

Her `new` (referans tipi), managed heap'te yer ayırır. Ayırmak ucuzdur, ama **toplamak** değildir: GC çalışırken uygulama thread'leri kısa süre durabilir ve CPU harcanır. Sık çağrılan bir yolda (her istekte, her mesajda) gereksiz tahsisler, gecikme dağılımının kuyruğunu (p99) büyütür.

Gizli tahsis kaynakları:

- Dizgi birleştirme, `Substring`, `Split`, `ToString`, `string.Format`.
- LINQ: her operatör bir yineleyici nesnesi ve çoğu zaman bir delege tahsis eder.
- Değer tipinin `object`'e ya da arayüze dönüştürülmesi (**kutulama**, boxing).
- Değişken yakalayan lambda'lar (closure nesnesi).
- `params` dizileri, `async` durum makineleri (senkron tamamlanan yolda `ValueTask` bunu azaltır).

## Span ve Memory

`Span<T>`, bir bellek bölgesine (dizi, dizgi, `stackalloc` ile yığın belleği, yönetilmeyen bellek) **kopyalamadan** bakan bir görünümdür.

```csharp
ReadOnlySpan<char> line = "ORD-8412;3;249.90";
var firstSemicolon = line.IndexOf(';');
ReadOnlySpan<char> orderNo = line[..firstSemicolon];   // yeni dizgi yok, yalnızca görünüm
```

Kısıtları:

- `Span<T>` bir `ref struct`'tır: **yalnızca yığında** yaşar. Bir sınıfın alanı olamaz, `async` metot içinde `await`'i aşamaz, lambda'da yakalanamaz.
- Bu kısıtların sebebi güvenliktir: yığın belleğine bakan bir görünümün, o bellek geçersiz olduktan sonra yaşamasını engeller.

`Memory<T>` ise heap'te saklanabilen kardeşidir. `async` metotlarda ve alanlarda tutulur, kullanırken `.Span` ile Span'e dönüştürülür.

```csharp
public async Task ProcessAsync(Memory<byte> buffer, Stream stream)
{
    var read = await stream.ReadAsync(buffer);
    Parse(buffer.Span[..read]);
}
```

## stackalloc ve ArrayPool

Kısa ömürlü küçük tamponlar için yığında yer ayırmak heap'i hiç kullanmaz:

```csharp
Span<byte> hash = stackalloc byte[32];
SHA256.HashData(payload, hash);
```

Yığın sınırlıdır (genellikle 1 MB). Büyük ya da boyutu girdiye bağlı tamponlarda `stackalloc` yığın taşmasına yol açabilir. Kural olarak birkaç yüz baytı aşmayın.

Büyük tamponlar için **havuz**:

```csharp
var buffer = ArrayPool<byte>.Shared.Rent(64 * 1024);   // en az bu boyutta, belki daha büyük
try
{
    var read = await stream.ReadAsync(buffer.AsMemory(0, 64 * 1024), ct);
    Process(buffer.AsSpan(0, read));                     // Length değil, okunan kadar
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}
```

Dikkat: `Rent` istenenden **büyük** bir dizi dönebilir ve dizi **temizlenmemiştir** (önceki kullanıcının verisi içinde olabilir). İade edilen diziyi kullanmaya devam etmek ciddi bir hatadır. Gizli veri taşıyan tamponlar `Return(buffer, clearArray: true)` ile temizlenir.

Nesne havuzu için `Microsoft.Extensions.ObjectPool` vardır (ör. `StringBuilder` havuzu).

## Dizgiler

- Dizgiler **değişmezdir**. Döngüde `+=` her adımda yeni dizgi oluşturur: O(n²) kopya. `StringBuilder` kullanın.
- Karşılaştırmada kültür bilinçli olun: `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)`. `a.ToLower() == b.ToLower()` iki dizgi tahsis eder ve Türkçe "I/ı" sorununa açıktır.
- Interpolated string handler'lar sayesinde `$"..."` modern .NET'te verimlidir. Log çağrılarında şablon kullanmak yine de daha iyidir (log seviyesi kapalıyken hiç biçimlendirme yapılmaz).
- `string.Create` ve `TryFormat` ile ara dizgi oluşturmadan biçimlendirme yapılabilir.

## Kutulama ve struct tasarımı

```csharp
int count = 42;
object boxed = count;              // heap'te yeni nesne
IComparable comparable = count;    // yine kutulama
```

Generic'ler kutulamayı önler: `List<int>` kutulamaz, eski `ArrayList` kutular.

Struct yazarken:

- **Küçük** tutun (birkaç alan, ~16 bayt civarı). Büyük struct'lar her geçirilişte kopyalanır.
- **Değişmez** yapın: `readonly struct`. Değişebilir struct'lar kopya üzerinde değişiklik yapıldığını fark etmeden şaşırtıcı hatalar üretir.
- Büyük struct'ları kopyasız geçirmek için `in` parametresi kullanılır.
- `Equals` ve `GetHashCode`'u geçersiz kılın (ya da `record struct` kullanın). Varsayılan uygulama yansıma (reflection) kullanabilir ve yavaştır.

## Çöp toplayıcı

.NET GC **nesilseldir**: çoğu nesne genç ölür.

| Nesil | İçerik | Toplama |
| --- | --- | --- |
| **Gen 0** | Yeni nesneler | Çok sık, çok hızlı |
| **Gen 1** | Gen 0'dan sağ çıkanlar (tampon) | Daha seyrek |
| **Gen 2** | Uzun yaşayanlar | Seyrek ve pahalı (tam toplama) |
| **LOH** | 85 000 bayt ve üzeri nesneler | Gen 2 ile birlikte. Varsayılan olarak sıkıştırılmaz |

Sonuçları:

- **Kısa ömürlü küçük nesneler ucuzdur**, Gen 0'da ölürler.
- **Orta yaşta ölen nesneler** pahalıdır: Gen 2'ye terfi edip orada ölürler ve tam toplama gerektirirler. Örnek: istek başına oluşturulup bir önbellekte birkaç dakika tutulan büyük nesneler.
- **LOH** parçalanabilir. Sık oluşturulan büyük diziler (ör. her istekte 100 KB tampon) LOH baskısı yaratır. Çözüm: `ArrayPool`.

GC modları:

- **Workstation GC:** masaüstü uygulamaları için. Düşük gecikme, daha az bellek.
- **Server GC:** ASP.NET Core'da varsayılan. Çekirdek başına bir heap, yüksek verim, ama daha çok bellek.
- **DATAS** (Dynamic Adaptation To Application Sizes): .NET 9'dan beri Server GC'de varsayılan açıktır. Heap sayısını yüke göre dinamik ayarlar. Konteynerlerde bellek kullanımını belirgin şekilde azaltır.
- `<ConcurrentGarbageCollection>` arka plan GC'yi, `GCSettings.LatencyMode` gecikme hassas bölümleri yönetir.

`GC.Collect()`'i elle çağırmak neredeyse her zaman yanlıştır. GC'nin kendi sezgilerini bozar.

### Bellek sızıntısı

Managed ortamda "sızıntı", artık gerekmeyen nesnelere **hâlâ referans tutulmasıdır**. Yaygın sebepler:

- Statik koleksiyonlara eklenip hiç çıkarılmayan nesneler (sınırsız önbellek).
- Abonelikten çıkılmayan olaylar (`+=` var, `-=` yok): yayıncı aboneyi canlı tutar.
- Singleton'ın scoped nesneyi tutması (tutsak bağımlılık).
- `IDisposable` nesnelerin atılmaması (bağlantı, dosya tanıtıcısı: yönetilmeyen kaynak sızıntısı).

Teşhis: `dotnet-counters` ile heap büyümesini izleyin, `dotnet-dump` ile döküm alın ve hangi kökün (GC root) nesneleri tuttuğunu inceleyin.

## Derleme zamanı optimizasyonları

- **Kaynak üreteçleri (source generators):** çalışma zamanı yansıması yerine derleme zamanında kod üretir.
  - `System.Text.Json`: `[JsonSerializable(typeof(OrderDto))]` ile serileştirme kodu üretilir.
  - `[GeneratedRegex]`: düzenli ifade derleme zamanında koda dönüşür.
  - `[LoggerMessage]`: tahsissiz loglama.
- **FrozenDictionary / FrozenSet** (.NET 8): bir kez oluşturulup hiç değişmeyen arama tabloları için okuma hızı optimize edilmiş koleksiyonlar.
- **Native AOT:** uygulamayı JIT olmadan doğrudan makine koduna derler. Çok hızlı açılış ve düşük bellek (serverless ve CLI araçları için ideal). Kısıtlar: çalışma zamanı yansıması, dinamik kod üretimi ve bazı kütüphaneler (EF Core'un bazı özellikleri, MVC controller'ları) desteklenmez. Minimal API ve kaynak üreteçli JSON ile çalışır.
- **Katmanlı derleme ve Dynamic PGO** (.NET 8'den beri varsayılan): JIT, sık çalışan kodu çalışma zamanı profiline göre yeniden ve daha iyi derler. Bu yüzden ölçümden önce ısınma gerekir.

## Mülakatta sorulur

- **"Span<T> nedir, neden async metotta kullanılamaz?"** Kopyasız bellek görünümüdür. `ref struct` olduğu için yalnızca yığında yaşar ve `await`'i aşamaz. Async kodda `Memory<T>` kullanılır.
- **"GC nesilleri neden var?"** Çoğu nesne genç ölür. Genç nesneleri sık ve ucuz toplamak, eskileri seyrek toplamak verimlidir.
- **"LOH nedir, neden sorun olur?"** 85 000 bayt üstü nesneler. Pahalı toplanır ve parçalanır. Büyük tamponları havuzlarım.
- **"ArrayPool kullanırken nelere dikkat edersin?"** Dönen dizi istenenden büyük ve kirli olabilir. Uzunluğu kendim takip ederim, mutlaka iade ederim, iade sonrası kullanmam.
- **"Managed dilde bellek sızıntısı olur mu?"** Olur: gereksiz referanslar (statik koleksiyon, olay aboneliği) ve atılmayan yönetilmeyen kaynaklar.
- **"Bir uç nokta yavaş. Nereden başlarsın?"** Ölçerim. Çoğu zaman veritabanı ya da ağdır. Kod sıcak noktaysa profil çıkarır, BenchmarkDotNet ile tahsisleri ölçerim.

## Özet

- Önce ölç: profil, sonra BenchmarkDotNet ve `[MemoryDiagnoser]`.
- Sıcak yollarda gereksiz tahsis GC baskısı ve p99 gecikmesi demektir.
- `Span<T>` kopyasız görünüm, `Memory<T>` async dostu kardeşi. Küçük tamponlar için `stackalloc`, büyükler için `ArrayPool`.
- Struct'lar küçük ve değişmez olsun. Generic'ler kutulamayı önler.
- GC nesilseldir. Orta yaşta ölen ve büyük nesneler pahalıdır. ASP.NET Core'da Server GC ve DATAS varsayılandır.
- Kaynak üreteçleri, frozen koleksiyonlar ve Native AOT derleme zamanında kazanç sağlar.
