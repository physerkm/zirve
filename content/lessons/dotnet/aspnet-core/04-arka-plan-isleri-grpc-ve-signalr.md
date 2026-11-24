---
title: Arka Plan İşleri, gRPC ve SignalR
summary: IHostedService ve BackgroundService, zamanlanmış işler için Hangfire ve Quartz.NET, Channel ile süreç içi kuyruk, servisler arası iletişimde gRPC ve tarayıcıya gerçek zamanlı bildirim için SignalR.
minutes: 20
level: intermediate
---

Bir web API'nin işi yalnızca isteğe cevap vermek değildir. E-posta göndermek, başarısız ödemeleri yeniden denemek, raporu gece hazırlamak, başka servislerle hızlı konuşmak ve kullanıcıya anlık bildirim göndermek de backend geliştiricisinin işidir. İlanlarda bunlar "worker service", "scheduled jobs", "gRPC" ve "real-time (SignalR)" olarak geçer.

## İstek içinde yapılmaması gerekenler

Kullanıcının beklemesi gerekmeyen her iş istekten ayrılmalıdır:

- Sipariş kaydedildi, onay e-postası **sonra** gidebilir.
- Rapor üretmek 40 saniye sürüyor. İstek `202 Accepted` dönmeli ve iş arka planda yapılmalı.

Ama "arka plan" kelimesi tuzak içerir: `Task.Run(() => SendEmailAsync())` ile isteği bırakıp gitmek, süreç yeniden başlarsa işin **sessizce kaybolması** demektir. Kaybolmaması gereken işler kalıcı bir yerde (veritabanı tablosu, mesaj kuyruğu) saklanmalıdır.

## IHostedService ve BackgroundService

.NET'te uzun yaşayan arka plan işleri `IHostedService` ile tanımlanır. Pratikte onu saran `BackgroundService` sınıfı kullanılır:

```csharp
public sealed class PaymentRetryWorker(
    IServiceScopeFactory scopes,
    ILogger<PaymentRetryWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var service = scope.ServiceProvider.GetRequiredService<PaymentRetryService>();
                await service.RetryFailedAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Ödeme yeniden deneme turu başarısız oldu");   // döngü ölmesin
            }
        }
    }
}

builder.Services.AddHostedService<PaymentRetryWorker>();
```

Dikkat edilecekler:

- **Hosted service singleton'dır.** Scoped servisleri (`DbContext`) her turda açılan kapsamdan alın.
- **İstisnayı yakalayın.** .NET 6'dan beri `ExecuteAsync`'ten kaçan istisna varsayılan olarak **bütün uygulamayı durdurur** (`BackgroundServiceExceptionBehavior.StopHost`).
- **`stoppingToken`'ı dinleyin.** Kapanışta işin yarıda düzgünce bırakılmasını sağlar. Kapanış için varsayılan süre 30 saniyedir (`HostOptions.ShutdownTimeout`).
- **Birden fazla örnek çalışıyorsa** her örnek aynı işi yapar. Tek örneğin çalışması gereken işler için dağıtık kilit (Redis, veritabanı `advisory lock`) ya da aşağıdaki kütüphaneler kullanılır.

Web uygulamasından bağımsız çalışacak işler için `dotnet new worker` şablonuyla ayrı bir **Worker Service** oluşturulur. Aynı hosting, DI ve loglama altyapısını kullanır.

## Süreç içi kuyruk: Channel

İstekten hızlıca bir iş bırakmak ve bunu arka planda sırayla işlemek için `System.Threading.Channels` idealdir:

```csharp
builder.Services.AddSingleton(Channel.CreateBounded<EmailJob>(new BoundedChannelOptions(1_000)
{
    FullMode = BoundedChannelFullMode.Wait,   // kuyruk doluysa yazan bekler (geri basınç)
}));

// İstekte:
await channel.Writer.WriteAsync(new EmailJob(order.Email, order.Id), ct);

// Worker'da:
await foreach (var job in channel.Reader.ReadAllAsync(stoppingToken))
{
    await emailSender.SendAsync(job, stoppingToken);
}
```

Channel **bellektedir**: süreç ölürse içindekiler kaybolur. Kaybı kabul edilebilir işler için uygundur (önbellek ısıtma, metrik). Kabul edilemezse **outbox tablosu** ya da gerçek bir mesaj kuyruğu gerekir.

## Zamanlanmış ve kalıcı işler: Hangfire ve Quartz.NET

| | Hangfire | Quartz.NET |
| --- | --- | --- |
| Depolama | SQL Server, PostgreSQL, Redis | Bellek ya da veritabanı (ADO.NET job store) |
| Öne çıkan | Hazır panel, otomatik yeniden deneme, "fire-and-forget" işler | Güçlü takvim ifadeleri, cluster modunda tek çalıştırma |
| Tipik kullanım | Kalıcı arka plan işleri ve basit cron | Karmaşık zamanlama gerektiren kurumsal işler |

```csharp
// Hangfire
BackgroundJob.Enqueue<IEmailSender>(s => s.SendWelcomeAsync(userId));             // bir kez, hemen
RecurringJob.AddOrUpdate<ReportJob>("daily-report", j => j.RunAsync(), Cron.Daily(3)); // her gece 03:00
```

Her ikisi de işi veritabanına yazar. Süreç çökerse iş kaybolmaz, başka örnek devralır. Ödünleşim: ek bir altyapı ve tablo yönetimi. İşler **idempotent** yazılmalıdır, çünkü yeniden deneme bir işi iki kez çalıştırabilir.

## gRPC: servisler arası hızlı iletişim

gRPC, HTTP/2 üzerinde çalışan, sözleşmesi `.proto` dosyasıyla tanımlanan ve mesajları ikili **Protocol Buffers** ile kodlayan bir RPC çerçevesidir.

```protobuf
syntax = "proto3";
option csharp_namespace = "Inventory.Grpc";

service Inventory {
  rpc Reserve (ReserveRequest) returns (ReserveReply);
  rpc WatchStock (WatchRequest) returns (stream StockChanged);   // sunucudan akış
}

message ReserveRequest { string product_id = 1; int32 quantity = 2; }
message ReserveReply   { bool ok = 1; string reservation_id = 2; }
```

```csharp
public sealed class InventoryService(StockRepository stock) : Inventory.InventoryBase
{
    public override async Task<ReserveReply> Reserve(ReserveRequest request, ServerCallContext context)
    {
        var id = await stock.ReserveAsync(request.ProductId, request.Quantity, context.CancellationToken);
        return new ReserveReply { Ok = id is not null, ReservationId = id ?? "" };
    }
}

builder.Services.AddGrpc();
app.MapGrpcService<InventoryService>();
```

| | REST + JSON | gRPC |
| --- | --- | --- |
| Biçim | Metin (JSON) | İkili (Protobuf), daha küçük ve hızlı |
| Sözleşme | OpenAPI (isteğe bağlı) | `.proto` zorunlu, istemci kodu üretilir |
| Akış | Sınırlı (SSE, WebSocket ayrı) | Sunucu, istemci ve çift yönlü akış yerleşik |
| Tarayıcı | Doğrudan | Doğrudan değil (gRPC-Web ya da JSON transcoding gerekir) |
| En uygun | Dış dünyaya açık API'ler | İç servisler arası yoğun trafik |

Protobuf'ta alan numaraları sözleşmedir: **numarayı asla değiştirmeyin ya da yeniden kullanmayın**. Silinen alanın numarasını `reserved` ile kilitleyin. Böylece eski ve yeni istemciler birlikte çalışabilir.

## SignalR: tarayıcıya gerçek zamanlı bildirim

SignalR, sunucudan istemciye anlık mesaj göndermeyi sağlar. Altta WebSocket kullanır, desteklenmiyorsa Server-Sent Events'e ya da long polling'e otomatik düşer.

```csharp
public sealed class OrderHub : Hub
{
    public Task Follow(Guid orderId) => Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderId}");
}

builder.Services.AddSignalR();
app.MapHub<OrderHub>("/hubs/orders");

// Uygulamanın herhangi bir yerinden:
public sealed class OrderNotifier(IHubContext<OrderHub> hub)
{
    public Task StatusChangedAsync(Guid orderId, string status) =>
        hub.Clients.Group($"order-{orderId}").SendAsync("statusChanged", orderId, status);
}
```

```ts
const connection = new HubConnectionBuilder().withUrl('/hubs/orders').withAutomaticReconnect().build();
connection.on('statusChanged', (id: string, status: string) => updateOrder(id, status));
await connection.start();
await connection.invoke('Follow', orderId);
```

**Ölçekleme sorunu:** Kullanıcı A, 1 numaralı sunucuya bağlı. Sipariş durumu 2 numaralı sunucuda değişti. 2 numara A'ya mesajı nasıl iletir? Bağlantılar sunucuya bağlı olduğu için örnekler arasında bir **backplane** gerekir: Redis backplane (`AddStackExchangeRedis`) ya da yönetilen **Azure SignalR Service**. Ayrıca yük dengeleyicide yapışkan oturum (sticky session) gerekebilir (WebSocket dışı geçişlerde).

## Mülakatta sorulur

- **"Kullanıcının beklemesini istemediğin bir işi nasıl arka plana atarsın?"** Kaybı kabul edilebilirse Channel ve BackgroundService. Kabul edilemezse outbox tablosu, mesaj kuyruğu ya da Hangfire.
- **"BackgroundService içinde `DbContext` nasıl kullanılır?"** `IServiceScopeFactory` ile her iş için kapsam açılır.
- **"Uygulama 3 örnekle çalışıyor ve gece raporu üç kez üretiliyor. Neden ve çözüm?"** Her örnek kendi zamanlayıcısını çalıştırıyor. Dağıtık kilit, Quartz cluster modu ya da Hangfire kullanırım.
- **"gRPC'yi ne zaman REST'e tercih edersin?"** İç servisler arasında yüksek hacim, düşük gecikme ve akış gerektiğinde. Dış ve tarayıcı istemcileri için REST.
- **"SignalR'ı birden fazla sunucuda nasıl çalıştırırsın?"** Redis backplane ya da Azure SignalR Service.

## Özet

- Beklenmesi gerekmeyen iş istekten ayrılır. Kaybolmaması gerekiyorsa kalıcı bir yerde saklanır.
- `BackgroundService` singleton'dır. Kapsam açarak scoped servis kullanır, istisnayı yakalar ve iptal belirtecini dinler.
- Channel bellekte hızlı bir kuyruktur. Hangfire ve Quartz kalıcı ve zamanlanmış işler içindir.
- gRPC iç servisler arası hızlı ve sözleşmeli iletişim sağlar. Alan numaraları değişmez.
- SignalR gerçek zamanlı bildirim sağlar. Çok örnekte backplane gerekir.
