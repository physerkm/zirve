---
title: Concurrency in C#
summary: Race conditions and atomicity, lock and the new Lock type, Interlocked, async locking with SemaphoreSlim, concurrent collections and their pitfalls, producer–consumer with Channel, Parallel.ForEachAsync, thread pool starvation, and deadlocks.
---

Microsoft's distributed systems job postings explicitly ask for concurrency knowledge. Senior .NET role descriptions say "Task Parallel Library: avoiding deadlocks, SemaphoreSlim, CancellationTokenSource." In the `async/await` lesson we covered asynchronous programming. This lesson explains what happens when more than one thread accesses the same data **at the same time**, and how to manage it correctly.

## Race conditions

```csharp
var counter = 0;
Parallel.For(0, 100_000, _ => counter++);
Console.WriteLine(counter);   // not 100000: 61 842, 73 105...
```

`counter++` looks like a single operation, but it is three steps: **read, add one, write**. Two threads read the same value, both add one, both write the same result, and one increment is lost. This is a **race condition**: the result depends on the timing of the threads. It stays invisible in tests and shows up under load.

The fix is to make the operation **atomic**, or to serialize access to the shared data with **mutual exclusion**.

## Interlocked: lock-free atomic operations

The fastest way for simple operations on a single number or reference:

```csharp
Interlocked.Increment(ref counter);
Interlocked.Add(ref total, amount);
var previous = Interlocked.Exchange(ref current, newValue);
Interlocked.CompareExchange(ref state, newValue, expected);   // change only if it holds the expected value (CAS)
```

`CompareExchange` (compare-and-swap) is the cornerstone of lock-free data structures.

## lock

When you need to change several fields together consistently:

```csharp
public sealed class Account
{
    private readonly Lock _gate = new();       // C# 13 / .NET 9: the dedicated Lock type
    private decimal _balance;

    public bool TryWithdraw(decimal amount)
    {
        lock (_gate)
        {
            if (_balance < amount) return false;   // check and change inside the same lock
            _balance -= amount;
            return true;
        }
    }
}
```

- The check and the change must be **inside the same lock**. "Check first, then lock" does not fix the race (the check-then-act bug).
- The lock object should be `private readonly`. `lock (this)` or `lock (typeof(X))` lets outside code lock the same object too.
- The `System.Threading.Lock` type introduced in .NET 9 is faster than the old `object` lock and states the intent clearly. In older code you'll see `private readonly object _gate = new();`.
- Do **as little work as possible** inside a lock. Don't make network or disk calls.

### No await inside lock

```csharp
lock (_gate)
{
    await SaveAsync();   // compile error
}
```

This error is deliberate. `lock` is tied to a thread. The code after `await` may continue on a different thread, and that other thread would try to release the lock. For locking in asynchronous code, use `SemaphoreSlim`.

## SemaphoreSlim

It has two uses: an **async lock** (count 1) and a **concurrency limit** (count N).

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
            if (_token is { IsExpired: false }) return _token.Value;   // double check: someone else may have refreshed it
            _token = await identity.RequestTokenAsync(ct);
            return _token.Value;
        }
        finally
        {
            _refreshGate.Release();   // always release
        }
    }
}
```

As a concurrency limit: if an external API allows at most 5 concurrent requests, use `new SemaphoreSlim(5)` and wrap each call in `WaitAsync`/`Release`.

`Release` must always be in a `finally` block. Otherwise an exception leaves the lock closed forever.

## Concurrent collections

`List<T>` and `Dictionary<TKey, TValue>` are **not safe** for concurrent writes. If two threads write to a `Dictionary` at the same time, its internal structure can get corrupted, and it can even end up in an infinite loop.

| Collection | Use |
| --- | --- |
| `ConcurrentDictionary<TKey, TValue>` | Shared cache, counter table |
| `ConcurrentQueue<T>` / `ConcurrentStack<T>` | Lock-free queue and stack |
| `ConcurrentBag<T>` | Unordered collection (fast when the same thread adds and removes) |
| `ImmutableDictionary`, `FrozenDictionary` | Data that never changes or is rarely replaced wholesale. Reads are lock-free |

### ConcurrentDictionary pitfalls

```csharp
var cache = new ConcurrentDictionary<string, Report>();
var report = cache.GetOrAdd(key, k => BuildExpensiveReport(k));
```

`GetOrAdd` is atomic **from the dictionary's point of view**, but under a race the factory function **can run more than once**. It stores only one result and discards the others. That's a problem if the factory is expensive or has side effects (writing to a database). The fix is to wrap the value in `Lazy<T>`:

```csharp
var cache = new ConcurrentDictionary<string, Lazy<Task<Report>>>();
var report = await cache.GetOrAdd(key, k => new Lazy<Task<Report>>(() => BuildReportAsync(k))).Value;
```

Another pitfall: `if (!dict.ContainsKey(k)) dict[k] = v;` is two separate operations, and another thread can slip in between. Use the atomic methods (`TryAdd`, `AddOrUpdate`, `GetOrAdd`).

## Channel: producer–consumer

`System.Threading.Channels` is an asynchronous producer–consumer queue. It manages locking and signaling itself:

```csharp
var channel = Channel.CreateBounded<Order>(new BoundedChannelOptions(500)
{
    FullMode = BoundedChannelFullMode.Wait,   // when full, the producer waits: backpressure
    SingleReader = false,
});

// Producer
await channel.Writer.WriteAsync(order, ct);
channel.Writer.Complete();                     // production is done

// 4 parallel consumers
var consumers = Enumerable.Range(0, 4).Select(async _ =>
{
    await foreach (var o in channel.Reader.ReadAllAsync(ct))
    {
        await ProcessAsync(o, ct);
    }
});
await Task.WhenAll(consumers);
```

Prefer a **bounded** channel. An unbounded channel keeps filling memory indefinitely if the consumer is slow.

## Parallel processing

| Kind of work | Tool |
| --- | --- |
| CPU-bound, independent pieces | `Parallel.For`, `Parallel.ForEach`, PLINQ (`AsParallel`) |
| I/O-bound (HTTP, database), limited parallelism | `Parallel.ForEachAsync` or `SemaphoreSlim` + `Task.WhenAll` |
| Start everything at once, wait for everything | `Task.WhenAll` |

```csharp
await Parallel.ForEachAsync(customerIds, new ParallelOptions { MaxDegreeOfParallelism = 8, CancellationToken = ct },
    async (id, token) => await SyncCustomerAsync(id, token));
```

Starting 10,000 HTTP requests with an unbounded `Task.WhenAll` overwhelms both the other side and your own connection pool. Always limit parallelism.

## Thread pool starvation

ASP.NET Core requests run on thread pool threads. **Synchronously waiting** on asynchronous code (`.Result`, `.Wait()`, `GetAwaiter().GetResult()`) blocks a thread, doing nothing, until the work finishes:

```csharp
public IActionResult Get() => Ok(_client.GetStringAsync(url).Result);   // sync-over-async
```

Under load, every thread in the pool ends up waiting like this, the pool grows slowly (it adds a few threads per second), and new requests pile up in the queue. The symptom: CPU is low, but latency is very high and the thread count keeps climbing. With `dotnet-counters` you'll see `ThreadPool Queue Length` rising. The fix: **async all the way**.

## Deadlock

If two threads each wait for the lock the other holds, both wait forever:

```csharp
// Thread 1                      // Thread 2
lock (a) { lock (b) { ... } }    lock (b) { lock (a) { ... } }
```

Ways to prevent it:

- **Always acquire locks in the same order.**
- Don't call external code (events, virtual methods, callbacks) inside a lock. That code may take another lock.
- Use locks with timeouts (`SemaphoreSlim.WaitAsync(timeout)`, `Monitor.TryEnter`).
- Reduce shared state: immutable data, messaging (Channel), per-thread state.

The classic .NET Framework deadlock (`.Result` with a `SynchronizationContext` in UI apps or old ASP.NET) doesn't happen in ASP.NET Core, because there is no `SynchronizationContext`. But if the same code is used in a desktop application, or as a library in an older application, it does happen. That's why `ConfigureAwait(false)` is still recommended in library code.

## volatile and the memory model

The compiler and the CPU may reorder operations in ways that don't change the result from a single thread's point of view. A flag written by one thread may never be seen by another. A `volatile` field or `Volatile.Read/Write` prevents this. In practice you rarely need it in application code: `lock`, `Interlocked`, `Channel`, and the concurrent collections already insert the necessary memory barriers. Unless you're writing a lock-free algorithm yourself, use these tools.

## Asked in interviews

- **"Why isn't `counter++` thread-safe?"** Read–modify–write is three steps. You need `Interlocked.Increment` or `lock`.
- **"Why can't you use `await` inside `lock`?"** The lock is tied to a thread, and after `await` execution may continue on a different thread. Use `SemaphoreSlim.WaitAsync`.
- **"How many times does the `ConcurrentDictionary.GetOrAdd` factory run?"** Under a race it can run more than once. If it must run only once, I wrap it in `Lazy<T>`.
- **"CPU is low but the API is very slow. What could it be?"** Thread pool starvation, most likely sync-over-async. Or it's waiting on a dependency.
- **"How do you prevent deadlocks?"** Acquire locks in the same order, don't call external code inside a lock, use timeouts, and reduce shared state.
- **"How do you send 10,000 requests in parallel?"** With limited parallelism via `Parallel.ForEachAsync` or `SemaphoreSlim`.

## Summary

- Shared mutable state is the source of race conditions. You need atomic operations or mutual exclusion.
- `Interlocked` for simple counters, `lock` for multiple fields, `SemaphoreSlim` for asynchronous code.
- Use concurrent collections through their atomic methods. The `GetOrAdd` factory can run more than once.
- A bounded `Channel` for producer–consumer, limited parallelism for I/O.
- Sync-over-async starves the thread pool. Acquire locks in the same order.
