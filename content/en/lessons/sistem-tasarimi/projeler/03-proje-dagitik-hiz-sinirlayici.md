---
title: "Project 2: Distributed Rate Limiter"
summary: First write a naive version with a race condition and watch it break, then build an atomic token bucket and a sliding window counter with Redis and Lua. Multi-instance tests, overhead latency measurement, fail-open/fail-closed, and standard headers.
---

In this project you'll write the design from the [Distributed Rate Limiter](/tracks/sistem-tasarimi/hiz-sinirlayici) lesson as ASP.NET Core middleware. The most valuable moment of the project is when **your own test catches the first version exceeding the limit under load**: race conditions are abstract when you read about them in a book, and unforgettable when they turn a test red.

## Goal

```csharp
builder.Services.AddDistributedRateLimiter(options =>
{
    options.AddRule("free-plan", key: ctx => ctx.User.FindFirst("sub")?.Value, limit: 100, per: TimeSpan.FromMinutes(1));
    options.AddRule("login", key: ctx => ctx.Connection.RemoteIpAddress?.ToString(), limit: 5, per: TimeSpan.FromMinutes(1),
        appliesTo: "/v1/login", failureMode: FailureMode.Closed);
});

app.UseDistributedRateLimiter();
```

When the limit is exceeded, it must return `429` along with the `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers.

## Stage 1: why isn't the built-in limiter enough?

Set a limit of 100 per minute with ASP.NET Core's built-in `Microsoft.AspNetCore.RateLimiting` middleware, run the service with **three instances** behind nginx, and send 300 requests. How many got through? The built-in limiter counts in **in-process** memory; with three instances, the real limit is three times higher. Write this observation in the README: it is the proof of why you need a distributed limiter.

## Stage 2: a naive Redis version and the race condition

Write the first attempt deliberately wrong: "read, compare, write".

```csharp
// WRONG: three separate commands, another request can slip in between.
var count = (int?)await redis.StringGetAsync(key) ?? 0;
if (count >= limit) return Denied();
await redis.StringSetAsync(key, count + 1, window);
return Allowed();
```

Now write the test: send 1,000 requests in parallel to the three instances (e.g., 50 concurrent clients), with a limit of 100. Count how many requests get through. As load grows, how far above 100 does it go? Keep this test until the end of the project; every new version must pass it.

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

## Stage 3: fixed window, atomic

The simplest correct version: `INCR` is atomic.

```text
MULTI
INCR   rl:{key}:{window_no}
EXPIRE rl:{key}:{window_no} 60 NX
EXEC
```

Your test should now be green. Then demonstrate the **window boundary problem**: write a test that sends 100 requests at second 59 and 100 at second 61; verify that 200 requests get through in two seconds.

## Stage 4: token bucket and sliding window counter (Lua)

Write both algorithms as Lua scripts and run them with `ScriptEvaluateAsync`. Instead of sending the script on every call, load it once (`SCRIPT LOAD`) and call it by its hash (`EVALSHA`); StackExchange.Redis's `LuaScript.Prepare(...).Load(server)` helper does this.

Things to watch for:

- **Time source:** every server's clock is different. Get the time from Redis inside the script with `redis.call('TIME')`.
- **Key expiry:** `PEXPIRE` (capacity / rate) so that the key deletes itself once the bucket is full.
- **Redis Cluster:** all keys a script touches must be in the same slot. If you'll check multiple rules in the same script, use a **hash tag** in the keys: `rl:{user:42}:minute`, `rl:{user:42}:day`.
- Test bursts with the token bucket: when the bucket is full, 100 requests should get through instantly, and subsequent ones at a rate of `r` per second.

## Stage 5: measure the overhead latency

The limiter sits on the path of every request. Use k6 to compare p50/p99 with and without the limiter. Target: < 1 ms of added latency.

| Version | p50 added latency | p99 added latency | Redis ops/second |
| --- | --- | --- | --- |
| Fixed window (MULTI) | | | |
| Token bucket (EVALSHA) | | | |
| Sliding window counter | | | |
| + local "blocked" cache | | | |

The improvement in the last row: when a key gets a `429`, keep the result in in-process memory for the `Retry-After` duration; don't ask Redis at all during that time. An abusive client can't overwhelm Redis.

## Stage 6: failure modes

- Run `docker compose stop redis` and send requests: in **open** mode, do requests get through; in **closed** mode (the login endpoint), does it return `503`?
- Put a short timeout (e.g., 10 ms) on the Redis call; verify that the API doesn't hang when Redis slows down (`redis-cli DEBUG SLEEP 2`).
- If Redis is down for a long time, have a circuit breaker open and fall back to an in-process local limiter (limit / number of instances). Explain the accuracy cost of this in the README.

## Stage 7: rules and observability

- Read the rules from a configuration file; reload them on change without restarting (`IOptionsMonitor`).
- Metrics: allowed and rejected request counts per rule, Redis latency, fail-open count. On a dashboard, watch the `429` rate rise during a simulated attack.

## Bonus tasks

- **Cost-based limits:** instead of 1 per request, a different number of tokens per endpoint (`/search` = 5).
- **Tiered limits:** 10 per second **and** 300 per minute **and** 10,000 per day; three buckets in a single Lua call.
- **Local pre-counter:** let each instance spend a small share of tokens locally and sync with Redis in batches. Measure the accuracy loss.
- Visualize the algorithms in a simulation tool: how does the same traffic pattern (burst, steady load) play out under different algorithms?

## Completion criteria

- [ ] A concurrency test that catches the race condition and is green on the final version.
- [ ] An atomic Lua implementation of at least two algorithms (token bucket + one window method).
- [ ] The overhead latency measurement table.
- [ ] Fail-open/fail-closed tests and an explanation of the trade-offs in the README.
