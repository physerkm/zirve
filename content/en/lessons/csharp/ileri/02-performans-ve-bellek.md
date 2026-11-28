---
title: Performance and Memory
summary: Not optimizing without measuring, BenchmarkDotNet, reducing allocations, Span and Memory, stackalloc, ArrayPool, string operations, boxing, struct design, GC generations and the LOH, server GC and DATAS, source generators, and Native AOT.
---

The performance of a service that handles 90,000 transactions a day usually suffers less from its algorithms than from **unnecessary memory allocations** and the garbage collection (GC) pressure that comes with them. Senior role descriptions ask for "GC tuning, avoiding LOH allocations, pooling, value type layout." Microsoft postings say "performance tuning." In the `Value and Reference Types` lesson we covered the stack and the heap. This lesson builds practical performance tools on that foundation.

## Rule one: measure first

Intuition is often wrong about performance. The order is:

1. **Measure the problem:** which endpoint, which percentile (p99), how slow?
2. **Find the bottleneck:** profile it (`dotnet-trace`, `dotnet-counters`, the Visual Studio profiler, PerfView). Most of the time the problem is a database query or a network call, not C# code.
3. **Measure at the micro level:** with BenchmarkDotNet.
4. **Fix it and measure again.**

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
// BenchmarkRunner.Run<ParsingBenchmarks>();   run in Release mode
```

`[MemoryDiagnoser]` shows how many bytes each call allocates. `Split` allocates four strings and an array. `Span` allocates nothing.

Measuring by hand with `Stopwatch` is misleading: JIT warm-up, tiered compilation, and GC noise distort the result. BenchmarkDotNet handles all of this.

## Why do allocations matter?

Every `new` (of a reference type) reserves space on the managed heap. Allocating is cheap, but **collecting** is not: while the GC runs, application threads may pause briefly, and CPU is spent. On a hot path (every request, every message), unnecessary allocations stretch the tail of the latency distribution (p99).

Hidden sources of allocation:

- String concatenation, `Substring`, `Split`, `ToString`, `string.Format`.
- LINQ: each operator allocates an iterator object and often a delegate.
- Converting a value type to `object` or to an interface (**boxing**).
- Lambdas that capture variables (the closure object).
- `params` arrays, `async` state machines (`ValueTask` reduces this on paths that complete synchronously).

## Span and Memory

`Span<T>` is a view that looks at a region of memory (an array, a string, stack memory from `stackalloc`, unmanaged memory) **without copying** it.

```csharp
ReadOnlySpan<char> line = "ORD-8412;3;249.90";
var firstSemicolon = line.IndexOf(';');
ReadOnlySpan<char> orderNo = line[..firstSemicolon];   // no new string, just a view
```

Its restrictions:

- `Span<T>` is a `ref struct`: it lives **only on the stack**. It cannot be a field of a class, cannot cross an `await` inside an `async` method, and cannot be captured in a lambda.
- These restrictions exist for safety: they prevent a view of stack memory from outliving that memory.

`Memory<T>` is its sibling that can be stored on the heap. You keep it in `async` methods and in fields, and convert it to a Span with `.Span` when you use it.

```csharp
public async Task ProcessAsync(Memory<byte> buffer, Stream stream)
{
    var read = await stream.ReadAsync(buffer);
    Parse(buffer.Span[..read]);
}
```

## stackalloc and ArrayPool

For small, short-lived buffers, allocating on the stack doesn't touch the heap at all:

```csharp
Span<byte> hash = stackalloc byte[32];
SHA256.HashData(payload, hash);
```

The stack is limited (usually 1 MB). For large buffers, or buffers whose size depends on input, `stackalloc` can cause a stack overflow. As a rule, don't go beyond a few hundred bytes.

For large buffers, use a **pool**:

```csharp
var buffer = ArrayPool<byte>.Shared.Rent(64 * 1024);   // at least this size, maybe larger
try
{
    var read = await stream.ReadAsync(buffer.AsMemory(0, 64 * 1024), ct);
    Process(buffer.AsSpan(0, read));                     // only what was read, not Length
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}
```

Watch out: `Rent` may return an array **larger** than requested, and the array is **not cleared** (it may contain the previous user's data). Continuing to use an array after returning it is a serious bug. Buffers that carry sensitive data are cleared with `Return(buffer, clearArray: true)`.

For object pooling there is `Microsoft.Extensions.ObjectPool` (e.g. a `StringBuilder` pool).

## Strings

- Strings are **immutable**. `+=` in a loop creates a new string at each step: O(n²) copying. Use `StringBuilder`.
- Be culture-aware when comparing: `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)`. `a.ToLower() == b.ToLower()` allocates two strings and is exposed to the Turkish "I/ı" problem.
- Thanks to interpolated string handlers, `$"..."` is efficient in modern .NET. Still, using templates in log calls is better (no formatting happens at all when the log level is disabled).
- `string.Create` and `TryFormat` let you format without creating intermediate strings.

## Boxing and struct design

```csharp
int count = 42;
object boxed = count;              // a new object on the heap
IComparable comparable = count;    // boxing again
```

Generics prevent boxing: `List<int>` doesn't box; the old `ArrayList` does.

When writing a struct:

- Keep it **small** (a few fields, around ~16 bytes). Large structs are copied every time they are passed.
- Make it **immutable**: `readonly struct`. Mutable structs produce surprising bugs where you modify a copy without noticing.
- Use an `in` parameter to pass large structs without copying.
- Override `Equals` and `GetHashCode` (or use a `record struct`). The default implementation may use reflection and is slow.

## The garbage collector

The .NET GC is **generational**: most objects die young.

| Generation | Contents | Collection |
| --- | --- | --- |
| **Gen 0** | New objects | Very frequent, very fast |
| **Gen 1** | Survivors of Gen 0 (a buffer) | Less frequent |
| **Gen 2** | Long-lived objects | Rare and expensive (full collection) |
| **LOH** | Objects of 85,000 bytes or more | Together with Gen 2. Not compacted by default |

Consequences:

- **Small, short-lived objects are cheap**; they die in Gen 0.
- **Objects that die in middle age** are expensive: they get promoted to Gen 2, die there, and require a full collection. Example: large objects created per request and held in a cache for a few minutes.
- **The LOH** can become fragmented. Frequently created large arrays (e.g. a 100 KB buffer on every request) put pressure on the LOH. The fix: `ArrayPool`.

GC modes:

- **Workstation GC:** for desktop applications. Low latency, less memory.
- **Server GC:** the default in ASP.NET Core. One heap per core, high throughput, but more memory.
- **DATAS** (Dynamic Adaptation To Application Sizes): enabled by default with Server GC since .NET 9. It adjusts the number of heaps dynamically based on load. It noticeably reduces memory usage in containers.
- `<ConcurrentGarbageCollection>` controls background GC, and `GCSettings.LatencyMode` handles latency-sensitive sections.

Calling `GC.Collect()` manually is almost always wrong. It disrupts the GC's own heuristics.

### Memory leaks

In a managed environment, a "leak" means **still holding references** to objects that are no longer needed. Common causes:

- Objects added to static collections and never removed (an unbounded cache).
- Events that are never unsubscribed (`+=` but no `-=`): the publisher keeps the subscriber alive.
- A singleton holding on to a scoped object (a captive dependency).
- `IDisposable` objects that are never disposed (connections, file handles: an unmanaged resource leak).

Diagnosis: watch heap growth with `dotnet-counters`, take a dump with `dotnet-dump`, and examine which root (GC root) is holding the objects.

## Compile-time optimizations

- **Source generators:** generate code at compile time instead of using runtime reflection.
  - `System.Text.Json`: serialization code is generated with `[JsonSerializable(typeof(OrderDto))]`.
  - `[GeneratedRegex]`: the regular expression is turned into code at compile time.
  - `[LoggerMessage]`: allocation-free logging.
- **FrozenDictionary / FrozenSet** (.NET 8): collections optimized for read speed, for lookup tables that are built once and never change.
- **Native AOT:** compiles the application straight to machine code, without the JIT. Very fast startup and low memory (ideal for serverless and CLI tools). Limitations: runtime reflection, dynamic code generation, and some libraries (some EF Core features, MVC controllers) are not supported. It works with Minimal APIs and source-generated JSON.
- **Tiered compilation and Dynamic PGO** (tiered compilation has been the default since .NET Core 3.0, Dynamic PGO since .NET 8): the JIT recompiles hot code better, based on the runtime profile. That's why you need a warm-up before measuring.

## Asked in interviews

- **"What is Span<T>, and why can't you use it in an async method?"** It's a copy-free view of memory. Because it's a `ref struct`, it lives only on the stack and can't cross an `await`. In async code you use `Memory<T>`.
- **"Why do GC generations exist?"** Most objects die young. Collecting young objects often and cheaply, and old ones rarely, is efficient.
- **"What is the LOH, and why is it a problem?"** Objects over 85,000 bytes. They are expensive to collect and cause fragmentation. I pool large buffers.
- **"What do you watch out for when using ArrayPool?"** The returned array may be larger than requested and dirty. I track the length myself, always return it, and never use it after returning it.
- **"Can a managed language have memory leaks?"** Yes: unnecessary references (static collections, event subscriptions) and undisposed unmanaged resources.
- **"An endpoint is slow. Where do you start?"** I measure. Most of the time it's the database or the network. If the code is the hot spot, I profile it and measure allocations with BenchmarkDotNet.

## Summary

- Measure first: profile, then BenchmarkDotNet and `[MemoryDiagnoser]`.
- On hot paths, unnecessary allocations mean GC pressure and p99 latency.
- `Span<T>` is a copy-free view; `Memory<T>` is its async-friendly sibling. `stackalloc` for small buffers, `ArrayPool` for large ones.
- Keep structs small and immutable. Generics prevent boxing.
- The GC is generational. Objects that die in middle age and large objects are expensive. In ASP.NET Core, Server GC and DATAS are the default.
- Source generators, frozen collections, and Native AOT deliver gains at compile time.
