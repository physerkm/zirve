---
title: Background Jobs, gRPC and SignalR
summary: IHostedService and BackgroundService, Hangfire and Quartz.NET for scheduled jobs, in-process queues with Channel, gRPC for service-to-service communication, and SignalR for real-time notifications to the browser.
---

A web API's job is not only to answer requests. Sending emails, retrying failed payments, preparing reports overnight, talking to other services quickly and sending users instant notifications are all part of a backend developer's work too. In job postings these appear as "worker service", "scheduled jobs", "gRPC" and "real-time (SignalR)".

## What not to do inside a request

Any work the user does not need to wait for should be separated from the request:

- The order is saved; the confirmation email can go out **later**.
- Generating a report takes 40 seconds. The request should return `202 Accepted`, and the work should be done in the background.

But the word "background" hides a trap: firing off `Task.Run(() => SendEmailAsync())` and leaving the request means the work **silently disappears** if the process restarts. Work that must not be lost has to be stored somewhere durable (a database table, a message queue).

## IHostedService and BackgroundService

In .NET, long-running background work is defined with `IHostedService`. In practice, you use the `BackgroundService` class that wraps it:

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
                logger.LogError(ex, "Payment retry round failed");   // don't let the loop die
            }
        }
    }
}

builder.Services.AddHostedService<PaymentRetryWorker>();
```

Things to watch out for:

- **A hosted service is a singleton.** Get scoped services (`DbContext`) from a scope opened on each round.
- **Catch exceptions.** Since .NET 6, an exception escaping `ExecuteAsync` **stops the whole application** by default (`BackgroundServiceExceptionBehavior.StopHost`).
- **Honor `stoppingToken`.** It lets work stop cleanly midway during shutdown. The default shutdown timeout is 30 seconds (`HostOptions.ShutdownTimeout`).
- **If several instances are running**, each instance does the same work. For work that only one instance should run, use a distributed lock (Redis, a database `advisory lock`) or the libraries below.

For work that should run independently of the web application, create a separate **Worker Service** with the `dotnet new worker` template. It uses the same hosting, DI and logging infrastructure.

## An in-process queue: Channel

To hand off work quickly from a request and process it in order in the background, `System.Threading.Channels` is ideal:

```csharp
builder.Services.AddSingleton(Channel.CreateBounded<EmailJob>(new BoundedChannelOptions(1_000)
{
    FullMode = BoundedChannelFullMode.Wait,   // if the queue is full, the writer waits (backpressure)
}));

// In the request:
await channel.Writer.WriteAsync(new EmailJob(order.Email, order.Id), ct);

// In the worker:
await foreach (var job in channel.Reader.ReadAllAsync(stoppingToken))
{
    await emailSender.SendAsync(job, stoppingToken);
}
```

A channel lives **in memory**: if the process dies, its contents are lost. It suits work where loss is acceptable (cache warming, metrics). If it isn't, you need an **outbox table** or a real message queue.

## Scheduled and durable jobs: Hangfire and Quartz.NET

| | Hangfire | Quartz.NET |
| --- | --- | --- |
| Storage | SQL Server, PostgreSQL, Redis | Memory or a database (ADO.NET job store) |
| Highlights | Built-in dashboard, automatic retries, "fire-and-forget" jobs | Powerful schedule expressions, single execution in cluster mode |
| Typical use | Durable background jobs and simple cron | Enterprise jobs that need complex scheduling |

```csharp
// Hangfire
BackgroundJob.Enqueue<IEmailSender>(s => s.SendWelcomeAsync(userId));             // once, right away
RecurringJob.AddOrUpdate<ReportJob>("daily-report", j => j.RunAsync(), Cron.Daily(3)); // every night at 03:00
```

Both write the job to the database. If the process crashes, the job is not lost; another instance takes over. The trade-off: extra infrastructure and table management. Jobs must be written to be **idempotent**, because a retry can run a job twice.

## gRPC: fast service-to-service communication

gRPC is an RPC framework that runs over HTTP/2, defines its contract in a `.proto` file and encodes messages in binary **Protocol Buffers**.

```protobuf
syntax = "proto3";
option csharp_namespace = "Inventory.Grpc";

service Inventory {
  rpc Reserve (ReserveRequest) returns (ReserveReply);
  rpc WatchStock (WatchRequest) returns (stream StockChanged);   // server streaming
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
| Format | Text (JSON) | Binary (Protobuf), smaller and faster |
| Contract | OpenAPI (optional) | `.proto` required, client code is generated |
| Streaming | Limited (SSE, WebSocket separately) | Server, client and bidirectional streaming built in |
| Browser | Directly | Not directly (needs gRPC-Web or JSON transcoding) |
| Best fit | Public-facing APIs | Heavy traffic between internal services |

In Protobuf, field numbers are the contract: **never change or reuse a number**. Lock the number of a deleted field with `reserved`. That way old and new clients can work together.

## SignalR: real-time notifications to the browser

SignalR lets the server push messages to the client instantly. Under the hood it uses WebSocket, and if that isn't supported, it automatically falls back to Server-Sent Events or long polling.

```csharp
public sealed class OrderHub : Hub
{
    public Task Follow(Guid orderId) => Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderId}");
}

builder.Services.AddSignalR();
app.MapHub<OrderHub>("/hubs/orders");

// From anywhere in the application:
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

**The scaling problem:** User A is connected to server 1. The order status changed on server 2. How does server 2 deliver the message to A? Because connections are tied to a server, you need a **backplane** between instances: the Redis backplane (`AddStackExchangeRedis`) or the managed **Azure SignalR Service**. You may also need sticky sessions on the load balancer (for non-WebSocket transports).

## Asked in interviews

- **"How do you move work the user shouldn't have to wait for into the background?"** If loss is acceptable, Channel and BackgroundService. If not, an outbox table, a message queue or Hangfire.
- **"How do you use `DbContext` inside a BackgroundService?"** Open a scope for each job with `IServiceScopeFactory`.
- **"The app runs on 3 instances and the nightly report is generated three times. Why, and what's the fix?"** Each instance runs its own timer. I use a distributed lock, Quartz cluster mode or Hangfire.
- **"When would you choose gRPC over REST?"** When internal services need high volume, low latency and streaming. REST for external and browser clients.
- **"How do you run SignalR on more than one server?"** A Redis backplane or Azure SignalR Service.

## Summary

- Work nobody needs to wait for is separated from the request. If it must not be lost, it is stored somewhere durable.
- `BackgroundService` is a singleton. It uses scoped services by opening a scope, catches exceptions and honors the cancellation token.
- Channel is a fast in-memory queue. Hangfire and Quartz are for durable and scheduled jobs.
- gRPC provides fast, contract-based communication between internal services. Field numbers never change.
- SignalR provides real-time notifications. With multiple instances you need a backplane.
