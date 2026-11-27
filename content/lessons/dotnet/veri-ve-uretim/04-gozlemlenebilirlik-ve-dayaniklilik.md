---
title: Gözlemlenebilirlik ve Dayanıklılık
summary: ILogger ile yapılandırılmış loglama, log seviyeleri, Serilog, OpenTelemetry ile iz ve metrik, korelasyon, health check'ler, IHttpClientFactory, Microsoft.Extensions.Resilience ile retry, timeout ve circuit breaker.
minutes: 22
level: intermediate
---

Microsoft'un ilanları "live site", "telemetry", "monitoring and alerting" gibi kelimelerle doludur. Avrupa'daki ilanlar Elasticsearch/Kibana, Grafana ve Prometheus ister. Hepsinin ortak sorusu şudur: **Üretimde bir şey ters gittiğinde bunu sen mi fark edersin, müşteri mi?** Sistem Tasarımı yolunda kavramları gördük. Bu ders bunların .NET'teki karşılığıdır.

## Üç sinyal

| Sinyal | Cevapladığı soru | .NET aracı |
| --- | --- | --- |
| **Log** | Tam olarak ne oldu? | `ILogger`, Serilog |
| **Metrik** | Ne kadar, ne sıklıkla? (istek/sn, hata oranı, p99 gecikme) | `System.Diagnostics.Metrics`, OpenTelemetry |
| **İz (trace)** | İstek hangi servislerden geçti, zaman nerede harcandı? | `System.Diagnostics.Activity`, OpenTelemetry |

## Yapılandırılmış loglama

```csharp
// Kötü: dizgi birleştirme. Arama yapılamaz, her çağrıda dizgi oluşturulur.
logger.LogInformation($"Sipariş {orderId} {amount} TL ile ödendi");

// İyi: mesaj şablonu. OrderId ve Amount ayrı alanlar olarak saklanır.
logger.LogInformation("Sipariş {OrderId} {Amount} TL ile ödendi", orderId, amount);
```

Yapılandırılmış log, log sisteminde `OrderId = "8412"` ile arama yapmayı ve gruplamayı mümkün kılar. Şablon sabit kaldığı için aynı türdeki bütün loglar tek bir "olay türü" olarak sayılabilir.

Sık çağrılan yollarda **kaynak üretilen (source-generated) loglama** hem hızlıdır hem de hata yapmayı zorlaştırır:

```csharp
public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Warning, Message = "Ödeme sağlayıcısı {Provider} yanıt vermedi, deneme {Attempt}")]
    public static partial void ProviderTimeout(this ILogger logger, string provider, int attempt);
}
```

### Log seviyeleri

| Seviye | Ne zaman |
| --- | --- |
| `Trace`/`Debug` | Geliştirme ayrıntısı. Üretimde kapalı |
| `Information` | İş açısından anlamlı olay: sipariş oluşturuldu, iş tamamlandı |
| `Warning` | Beklenmeyen ama kurtarılan durum: yeniden deneme, yedek yola düşme |
| `Error` | İşlem başarısız oldu, müdahale gerekebilir |
| `Critical` | Uygulama ya da önemli bir alt sistem çalışmıyor |

Kurallar:

- **Gizli veri loglanmaz:** parola, token, kart numarası, kişisel veri (KVKK/GDPR).
- **Aynı hatayı her katmanda tekrar loglamayın.** Ya yakalayıp loglayın ya da fırlatın. İkisini birden yapmak aynı hatayı beş kez gösterir.
- **İstisnayı ilk parametre olarak geçin:** `logger.LogError(ex, "...")`. Yığın izi ayrı alanda saklanır.

**Serilog**, `ILogger`'ın arkasına takılan popüler bir sağlayıcıdır. Zengin hedefleri (Elasticsearch, Seq, dosya) ve zenginleştiricileri (enricher) vardır. Uygulama kodu yine `ILogger` kullanır.

## Korelasyon ve dağıtık iz

Bir kullanıcı isteği API ağ geçidinden sipariş servisine, oradan ödeme servisine ve kuyruğa gider. Hata ödeme servisinde çıkarsa, o hatanın hangi kullanıcı isteğine ait olduğunu nasıl bulursunuz?

Cevap **W3C Trace Context** standardıdır: her isteğe bir `trace-id` verilir ve `traceparent` HTTP başlığıyla bütün servislere taşınır. .NET'te bunu `Activity` yapar ve `HttpClient`, ASP.NET Core, EF Core ve çoğu mesajlaşma kütüphanesi bunu otomatik yayar. Loglara `TraceId` eklenince bir isteğin bütün logları tek sorguyla bulunur.

## OpenTelemetry

OpenTelemetry (OTel), log, metrik ve izleri üreticiden bağımsız bir standartla toplar ve istediğiniz arka uca (Jaeger, Grafana Tempo/Loki, Prometheus, Azure Monitor, Datadog, Elastic) gönderir. Uygulama kodu arka uca bağlanmaz.

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("orders-api"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource("Orders"))                 // kendi Activity'lerimiz
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()           // GC, thread havuzu
        .AddMeter("Orders"))                   // kendi metriklerimiz
    .UseOtlpExporter();                         // OTLP ile toplayıcıya gönder

builder.Logging.AddOpenTelemetry(o => o.IncludeScopes = true);
```

Kendi iş metriğinizi ve iz aralığınızı (span) eklemek:

```csharp
public sealed class CheckoutMetrics
{
    public static readonly ActivitySource Source = new("Orders");
    private readonly Counter<long> _orders;
    private readonly Histogram<double> _amount;

    public CheckoutMetrics(IMeterFactory meters)
    {
        var meter = meters.Create("Orders");
        _orders = meter.CreateCounter<long>("orders.placed");
        _amount = meter.CreateHistogram<double>("orders.amount", unit: "TRY");
    }

    public void Placed(decimal amount, string channel)
    {
        _orders.Add(1, new KeyValuePair<string, object?>("channel", channel));
        _amount.Record((double)amount);
    }
}

using var activity = CheckoutMetrics.Source.StartActivity("ReserveStock");
activity?.SetTag("order.id", orderId);
```

Metrik etiketlerinde (tag) **yüksek kardinaliteden kaçının**: kullanıcı kimliği ya da sipariş numarası gibi milyonlarca farklı değer alabilen etiketler metrik sisteminin belleğini patlatır. Bunlar loglarda ve izlerde durur.

### Neyi ölçmeli: RED ve USE

- **RED** (servisler için): **R**ate (istek/sn), **E**rrors (hata oranı), **D**uration (gecikme dağılımı, özellikle p95/p99).
- **USE** (kaynaklar için): **U**tilization (kullanım), **S**aturation (doygunluk, kuyruk uzunluğu), **E**rrors.

Ortalama gecikme yanıltır. Yüz isteğin doksan dokuzu 10 ms, biri 5 saniye sürerse ortalama 60 ms görünür. Kullanıcı deneyimini yüzdelikler (p99) anlatır.

## Health check'ler

```csharp
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, tags: ["ready"])
    .AddRedis(redisConnection, tags: ["ready"]);

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });   // süreç ayakta mı
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready") });
```

- **Liveness:** süreç yanıt veriyor mu? Başarısızsa orkestratör (Kubernetes) süreci yeniden başlatır. Bağımlılıkları kontrol etmemelidir. Veritabanı düştü diye bütün örnekleri yeniden başlatmak durumu düzeltmez, kötüleştirir.
- **Readiness:** trafik almaya hazır mı? Başarısızsa yük dengeleyici o örneğe istek göndermez.

(`AddNpgSql` ve `AddRedis`, topluluk tarafından geliştirilen `AspNetCore.HealthChecks.*` paketlerinden gelir.)

## Dayanıklılık: geçici hataları yönetmek

Ağ kopar, servis bir anlığına 503 döner, veritabanı yük altında yavaşlar. Dağıtık sistemde bunlar istisna değil, normaldir.

### IHttpClientFactory

```csharp
builder.Services.AddHttpClient<PaymentClient>(c =>
{
    c.BaseAddress = new Uri("https://payments.internal");
})
.AddStandardResilienceHandler();    // Microsoft.Extensions.Http.Resilience
```

`AddStandardResilienceHandler` (Polly v8 üzerine kurulu) makul varsayılanlarla şu katmanları ekler: toplam zaman aşımı, yeniden deneme (üstel bekleme ve jitter ile), circuit breaker, deneme başına zaman aşımı ve eşzamanlılık sınırı.

### Kalıplar

| Kalıp | Ne yapar | Dikkat |
| --- | --- | --- |
| **Timeout** | Yanıt gelmezse bekleme süresini sınırlar | Zaman aşımı olmayan çağrı thread'leri ve bağlantıları tüketir |
| **Retry** | Geçici hatada yeniden dener | Yalnızca **idempotent** işlemlerde. Üstel bekleme + jitter. Deneme sayısı sınırlı |
| **Circuit breaker** | Hata oranı eşiği aşınca çağrıları bir süre hiç yapmaz | Çöken servise yüklenmeyi durdurur, hızlı başarısız olur |
| **Bulkhead** | Bir bağımlılığa ayrılan eşzamanlı çağrı sayısını sınırlar | Yavaş bir bağımlılık bütün kaynakları tüketemez |
| **Fallback** | Başarısızlıkta yedek cevap | Önbellekteki eski veri, varsayılan değer |

**Yeniden deneme fırtınası:** Her katman 3 kez yeniden denerse ve çağrı zinciri 3 servis derinliğindeyse en alttaki servis 3 × 3 × 3 = 27 kat yük alır. Yeniden denemeyi tek bir katmanda yapın ve circuit breaker ile birleştirin.

Ödeme gibi idempotent olmayan çağrıları yeniden denemeden önce sunucunun idempotency anahtarı desteği olduğundan emin olun.

## Mülakatta sorulur

- **"Üretimde bir istek yavaş. Nereden başlarsın?"** Dağıtık izde isteği bulurum, zamanın hangi aralıkta (span) harcandığına bakarım. Sonra o servisin metriklerine ve loglarına geçerim.
- **"Liveness ile readiness farkı?"** Liveness başarısızsa süreç yeniden başlatılır. Readiness başarısızsa yalnızca trafik kesilir. Bağımlılık kontrolü readiness'a aittir.
- **"Retry'ı her yere koyalım mı?"** Hayır. Yalnızca geçici hatalarda, idempotent işlemlerde, sınırlı sayıda, jitter'lı beklemeyle ve tek katmanda.
- **"Circuit breaker neyi çözer?"** Çöken bir bağımlılığa yüklenmeyi durdurur, çağıranın kaynaklarını korur ve hızlı başarısız olmayı sağlar.
- **"Loglarda neden dizgi birleştirme kullanmamalı?"** Yapılandırılmış alanlar kaybolur, arama ve gruplama yapılamaz.

## Özet

- Log ne olduğunu, metrik ne kadar olduğunu, iz nerede olduğunu anlatır.
- Mesaj şablonlarıyla yapılandırılmış log yazın. Gizli veriyi loglamayın, hatayı bir kez loglayın.
- OpenTelemetry arka uçtan bağımsız toplama sağlar. `traceparent` istekleri servisler arasında bağlar.
- Gecikmeyi yüzdeliklerle ölçün. Metrik etiketlerinde yüksek kardinaliteden kaçının.
- Liveness süreci, readiness trafiği yönetir.
- Her dış çağrının zaman aşımı olsun. Retry yalnızca idempotent işlemde ve circuit breaker ile birlikte kullanılır.
