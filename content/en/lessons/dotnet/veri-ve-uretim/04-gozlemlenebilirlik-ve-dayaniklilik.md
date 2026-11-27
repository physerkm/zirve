---
title: Observability and Resilience
summary: Structured logging with ILogger, log levels, Serilog, traces and metrics with OpenTelemetry, correlation, health checks, IHttpClientFactory, and retry, timeout and circuit breaker with Microsoft.Extensions.Resilience.
---

Microsoft's job postings are full of words like "live site", "telemetry", and "monitoring and alerting". Postings in Europe ask for Elasticsearch/Kibana, Grafana, and Prometheus. They all share one question: **When something goes wrong in production, do you notice it, or does the customer?** We covered the concepts in the System Design track. This lesson is their counterpart in .NET.

## Three signals

| Signal | The question it answers | .NET tooling |
| --- | --- | --- |
| **Log** | What exactly happened? | `ILogger`, Serilog |
| **Metric** | How much, how often? (requests/s, error rate, p99 latency) | `System.Diagnostics.Metrics`, OpenTelemetry |
| **Trace** | Which services did the request pass through, and where was the time spent? | `System.Diagnostics.Activity`, OpenTelemetry |

## Structured logging

```csharp
// Bad: string concatenation. Not searchable, and a string is built on every call.
logger.LogInformation($"Order {orderId} paid with {amount} TL");

// Good: a message template. OrderId and Amount are stored as separate fields.
logger.LogInformation("Order {OrderId} paid with {Amount} TL", orderId, amount);
```

Structured logs let you search and group by `OrderId = "8412"` in your logging system. Because the template stays constant, all logs of the same kind can be counted as a single "event type".

On hot paths, **source-generated logging** is both fast and harder to get wrong:

```csharp
public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Warning, Message = "Payment provider {Provider} did not respond, attempt {Attempt}")]
    public static partial void ProviderTimeout(this ILogger logger, string provider, int attempt);
}
```

### Log levels

| Level | When |
| --- | --- |
| `Trace`/`Debug` | Development detail. Off in production |
| `Information` | An event that matters to the business: order created, job completed |
| `Warning` | An unexpected but recovered situation: a retry, falling back to a backup path |
| `Error` | The operation failed; intervention may be needed |
| `Critical` | The application or an important subsystem is down |

Rules:

- **Never log secrets:** passwords, tokens, card numbers, personal data (KVKK/GDPR).
- **Don't log the same error again at every layer.** Either catch and log it, or throw it. Doing both shows the same error five times.
- **Pass the exception as the first parameter:** `logger.LogError(ex, "...")`. The stack trace is stored in a separate field.

**Serilog** is a popular provider that plugs in behind `ILogger`. It has rich sinks (Elasticsearch, Seq, file) and enrichers. Application code still uses `ILogger`.

## Correlation and distributed tracing

A user request goes from the API gateway to the order service, from there to the payment service, and onto a queue. If the error occurs in the payment service, how do you find out which user request it belongs to?

The answer is the **W3C Trace Context** standard: each request gets a `trace-id`, which is carried to every service in the `traceparent` HTTP header. In .NET, `Activity` handles this, and `HttpClient`, ASP.NET Core, EF Core, and most messaging libraries propagate it automatically. Once `TraceId` is added to your logs, a single query finds every log for a request.

## OpenTelemetry

OpenTelemetry (OTel) collects logs, metrics, and traces using a vendor-neutral standard and sends them to whatever backend you choose (Jaeger, Grafana Tempo/Loki, Prometheus, Azure Monitor, Datadog, Elastic). Application code isn't tied to the backend.

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("orders-api"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource("Orders"))                 // our own Activities
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()           // GC, thread pool
        .AddMeter("Orders"))                   // our own metrics
    .UseOtlpExporter();                         // send to the collector via OTLP

builder.Logging.AddOpenTelemetry(o => o.IncludeScopes = true);
```

Adding your own business metric and span:

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

**Avoid high cardinality** in metric tags: tags that can take millions of distinct values, such as a user ID or order number, blow up the memory of your metrics system. Those belong in logs and traces.

### What to measure: RED and USE

- **RED** (for services): **R**ate (requests/s), **E**rrors (error rate), **D**uration (latency distribution, especially p95/p99).
- **USE** (for resources): **U**tilization, **S**aturation (queue length), **E**rrors.

Average latency is misleading. If ninety-nine out of a hundred requests take 10 ms and one takes 5 seconds, the average looks like 60 ms. Percentiles (p99) describe the user experience.

## Health checks

```csharp
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, tags: ["ready"])
    .AddRedis(redisConnection, tags: ["ready"]);

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });   // is the process up?
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready") });
```

- **Liveness:** is the process responding? If it fails, the orchestrator (Kubernetes) restarts the process. It should not check dependencies. Restarting every instance because the database is down doesn't fix the situation; it makes it worse.
- **Readiness:** is it ready to receive traffic? If it fails, the load balancer stops sending requests to that instance.

(`AddNpgSql` and `AddRedis` come from the community-developed `AspNetCore.HealthChecks.*` packages.)

## Resilience: handling transient faults

The network drops, a service returns 503 for a moment, the database slows down under load. In a distributed system these are not exceptions; they are normal.

### IHttpClientFactory

```csharp
builder.Services.AddHttpClient<PaymentClient>(c =>
{
    c.BaseAddress = new Uri("https://payments.internal");
})
.AddStandardResilienceHandler();    // Microsoft.Extensions.Http.Resilience
```

`AddStandardResilienceHandler` (built on Polly v8) adds these layers with sensible defaults: a total timeout, retries (with exponential backoff and jitter), a circuit breaker, a per-attempt timeout, and a concurrency limit.

### Patterns

| Pattern | What it does | Watch out |
| --- | --- | --- |
| **Timeout** | Caps how long you wait when no response comes | A call with no timeout ties up threads and connections |
| **Retry** | Tries again on a transient fault | Only for **idempotent** operations. Exponential backoff + jitter. A limited number of attempts |
| **Circuit breaker** | Stops making calls entirely for a while once the error rate crosses a threshold | Stops piling load on a failing service and fails fast |
| **Bulkhead** | Limits the number of concurrent calls allotted to a dependency | A slow dependency can't consume all resources |
| **Fallback** | A backup response on failure | Stale data from the cache, a default value |

**Retry storm:** if every layer retries 3 times and the call chain is 3 services deep, the bottom service receives 3 × 3 × 3 = 27 times the load. Retry at a single layer only, and combine it with a circuit breaker.

Before retrying non-idempotent calls such as payments, make sure the server supports idempotency keys.

## Asked in interviews

- **"A request is slow in production. Where do you start?"** I find the request in the distributed trace and look at which span the time was spent in. Then I move on to that service's metrics and logs.
- **"What's the difference between liveness and readiness?"** If liveness fails, the process is restarted. If readiness fails, only traffic is cut off. Dependency checks belong to readiness.
- **"Should we put retries everywhere?"** No. Only for transient faults, on idempotent operations, a limited number of times, with jittered backoff, and at a single layer.
- **"What does a circuit breaker solve?"** It stops piling load onto a failing dependency, protects the caller's resources, and lets you fail fast.
- **"Why shouldn't you use string concatenation in logs?"** You lose the structured fields, so you can't search or group.

## Summary

- Logs tell you what happened, metrics how much, and traces where.
- Write structured logs with message templates. Don't log secrets, and log an error once.
- OpenTelemetry gives you backend-neutral collection. `traceparent` links requests across services.
- Measure latency with percentiles. Avoid high cardinality in metric tags.
- Liveness governs the process; readiness governs traffic.
- Every external call should have a timeout. Use retries only on idempotent operations and together with a circuit breaker.
