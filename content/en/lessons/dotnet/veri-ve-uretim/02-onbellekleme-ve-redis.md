---
title: Caching and Redis in .NET
summary: The differences between IMemoryCache, IDistributedCache and HybridCache, the cache-aside pattern, TTL and invalidation strategies, cache stampede, Redis data structures, and using StackExchange.Redis correctly.
---

Redis is one of the infrastructure components that shows up most often in .NET job postings, both in Turkey and abroad. In the System Design track we covered the concepts behind caching. This lesson shows how the same ideas are applied in .NET code and where they go wrong in real projects.

## Three options

| | `IMemoryCache` | `IDistributedCache` | `HybridCache` |
| --- | --- | --- | --- |
| Where | In the process's memory | In an external store (Redis, SQL Server) | Both: L1 memory + L2 distributed |
| Speed | Nanoseconds | A network round trip (~0.5–1 ms) | Memory speed on an L1 hit |
| Shared across instances | No | Yes | Yes (via L2) |
| What it stores | Any object | `byte[]` (you handle serialization) | Objects (serialization built in) |
| Stampede protection | No | No | **Yes** |

`HybridCache` (`Microsoft.Extensions.Caching.Hybrid`) arrived with .NET 9 and should be the default choice in new code. It manages both tiers, collapses concurrent requests for the same key into a single call to the data source, and supports bulk removal by tag.

```csharp
builder.Services.AddStackExchangeRedisCache(o => o.Configuration = builder.Configuration.GetConnectionString("Redis"));
builder.Services.AddHybridCache(o =>
{
    o.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(10),          // L2 (Redis) lifetime
        LocalCacheExpiration = TimeSpan.FromMinutes(1), // L1 (memory) lifetime
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
            tags: ["products"],                 // RemoveByTagAsync("products") removes all of them at once
            cancellationToken: ct);
}
```

## The cache-aside pattern

This is the most common pattern, and the `GetOrCreateAsync` call above implements it:

1. Look in the cache. If the value is there, return it.
2. If not, read it from the database.
3. Write the result to the cache and return it.

On the write side you have two options:

- **Update and then remove the cache entry (invalidate):** the safest choice. The next read loads fresh data.
- **Update and then write the new value to the cache:** with two concurrent writes, a stale value can end up in the cache. Removing produces fewer race conditions.

```csharp
await db.SaveChangesAsync(ct);
await cache.RemoveAsync($"product:{product.Id}", ct);
```

Order matters: **database first, then cache.** In the reverse order, a read that arrives between the removal and the save writes the old data back into the cache.

## TTL and invalidation

"There are only two hard things in computer science: cache invalidation and naming things." Practical rules:

- **Give every entry a TTL.** Even if your removal code has a bug, stale data won't stay forever.
- **Choose the TTL based on how stale the data is allowed to be.** Product description: hours. Stock count: seconds, or no cache at all. Price: whatever the business accepts.
- **Use tags or a version key for bulk invalidation.** If you tag entries with something like `category:42` when you write them, you can remove every product in that category with `RemoveByTagAsync("category:42")`. The alternative: put a version in the key (`products:v7:...`) and bump the version.
- **Add randomness to the TTL (jitter).** This prevents thousands of entries written at the same moment from expiring in the same second.

## Cache stampede

When a popular key expires, the hundreds of requests arriving at that moment all miss the cache and **all of them at once** go to the database. The database load multiplies instantly. This is called a *cache stampede* or *thundering herd*.

Solutions:

- **Request coalescing:** only one load runs for a given key, and the others wait for its result. `HybridCache` does this on its own. `IMemoryCache.GetOrCreateAsync` **does not**.
- **Early refresh:** refresh in the background before the entry expires.
- **Distributed lock:** guarantees a single load across multiple servers. It is expensive.

## Getting to know Redis

Redis is a single-threaded (in terms of command processing), in-memory data structure server. It is not just a key-value store:

| Structure | Use |
| --- | --- |
| String | Cache value, counter (`INCR`), distributed lock (`SET key val NX PX 30000`) |
| Hash | Object fields (`HSET user:7 name Ada`) |
| List | Simple queue |
| Set | Unique members, tags |
| Sorted Set | Leaderboard, time-ordered data, sliding-window rate limiting |
| Stream | Durable event stream with consumer groups |
| Pub/Sub | Real-time broadcast (not durable; if nobody is listening, the message is lost) |

### Using StackExchange.Redis correctly

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

- **`ConnectionMultiplexer` must be a singleton.** It is designed to share and multiplex the connection. Opening a new connection on every request is a serious performance bug.
- **Never use `KEYS *` in production.** It scans the entire keyspace and blocks the single-threaded server. Use `SCAN` if you need to.
- **Avoid large values.** Values of several megabytes slow down both the network and the server.
- The `INCR` + `EXPIRE` above are two separate commands. If the process dies in between, the key is left without an expiry. If it has to be atomic, use a Lua script or a transaction (`MULTI`).

### Persistence and high availability

- **RDB:** snapshots at fixed intervals. Fast restarts, but anything after the last snapshot can be lost.
- **AOF:** every write command is appended to a file. Less data loss, larger file.
- **Replication + Sentinel:** if the primary goes down, a replica is promoted to primary automatically.
- **Redis Cluster:** data is split into 16384 hash slots and distributed across multiple nodes.

If you use Redis as a cache, losing it must not be a disaster: the application should keep working without Redis (even if more slowly). Catching cache errors and falling back to the database is a resilience decision.

## What not to cache

- User-specific and sensitive data: if the key is built wrong, it can be shown to another user. Put the user ID in the key.
- Data that changes often and where consistency is critical (balances, stock). The right tools for these are the database and a correct transaction.
- Data that is rarely read. If the hit ratio is low, the cache only adds complexity.

## Asked in interviews

- **"What's the difference between IMemoryCache and IDistributedCache?"** One lives inside the process and isn't shared across instances. The other lives in an external store and is shared, but has network latency. HybridCache combines the two.
- **"What if the cache and the database become inconsistent?"** I bound it with a TTL. On writes, I update the database first and then remove the cache entry.
- **"What is a cache stampede?"** All requests piling onto the database when a popular key expires. I prevent it with request coalescing, early refresh, or a lock.
- **"How do you take a distributed lock with Redis?"** `SET key token NX PX ttl`. To release it, a Lua script that checks the token. In the design, I think about what happens if the work outlasts the lock's lifetime.
- **"Why is `ConnectionMultiplexer` a singleton?"** It multiplexes the connection and is designed to be shared. Opening a new connection every time is expensive.

## Summary

- In new code, use `HybridCache`: two tiers, built-in serialization, and stampede protection.
- Cache-aside: read; if it's missing, load and write it. On updates, database first, then remove the cache entry.
- Give every entry a TTL. Add jitter to the TTL. Use tags or a version key for bulk removal.
- Redis offers rich data structures. The connection is a singleton, and `KEYS` is off-limits.
- If the cache goes down, the system should slow down, not crash.
