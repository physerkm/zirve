---
title: async and await
summary: The C# model for asynchronous programming. What a Task is, what await does, how it differs from a thread, common mistakes (deadlock, async void, fire-and-forget), and cancellation.
---

`async`/`await` is the topic C# interviews dig into most, because it is easy to use and even easier to misunderstand. The core misconception is this: **`async` does not start a new thread.**

## What problem it solves

If a web server blocks a thread while it waits for a database response, that thread sits idle doing nothing. A thousand concurrent requests means a thousand waiting threads; each one consumes memory, and once the thread pool is exhausted, new requests wait in a queue.

In asynchronous code, the thread **returns to the pool** while I/O is pending and serves another request. When the response arrives, the work resumes where it left off on any thread from the pool. The goal is not to make a single request faster but to serve **more concurrent requests on the same hardware** (scalability). In desktop applications, the goal is to avoid blocking the UI thread.

## Task and await

A `Task` represents an operation that may not have completed yet (the counterpart of JavaScript's `Promise`). A `Task<T>` produces a value when it completes.

```csharp
public async Task<string> GetTitleAsync(string url, CancellationToken cancellationToken)
{
    using var client = new HttpClient();
    var html = await client.GetStringAsync(url, cancellationToken);   // the thread is released here
    return ExtractTitle(html);                                        // resumes when the response arrives
}
```

Here is what `await` does:

1. If the task has **already completed**, it continues synchronously.
2. If not, it registers the rest of the method as a **continuation** and returns control to the caller. The thread is not blocked.
3. When the task finishes, the continuation runs; if an exception occurred, it is rethrown at the `await` line.

The compiler turns an `async` method into a **state machine**: local variables become fields of an object, and each `await` is a suspension point.

## I/O-bound vs. CPU-bound work

| | I/O-bound work | CPU-bound work |
| --- | --- | --- |
| Example | HTTP request, database query, file read | Image processing, heavy computation |
| Thread while waiting | **Not used** | Runs continuously |
| Right tool | A truly asynchronous API with `await` | Offload to a pool thread with `Task.Run` (in UI applications) |

Writing `Task.Run(() => client.GetString(url))` for I/O is wrong: it moves the blocking call to another thread, but that thread still waits. In ASP.NET Core, wrapping CPU work in `Task.Run` doesn't help either; you are already on a pool thread.

## Common mistakes

### 1. Blocking on async code: `.Result` and `.Wait()`

```csharp
var title = GetTitleAsync(url, ct).Result;      // AVOID
```

It blocks the thread and throws away every benefit of being asynchronous. In environments with a **synchronization context** (SynchronizationContext), such as WPF, WinForms, and classic ASP.NET, it causes a **deadlock**: the blocked thread waits for the task to finish, while the task's continuation waits to get back onto that same thread.

The rule: **async all the way.** If a method uses `await`, its caller should `await` it too. ASP.NET Core has no synchronization context, so you won't see the classic deadlock there; but blocking still drains the thread pool.

### 2. `async void`

```csharp
async void Process() { await DoWorkAsync(); }    // AVOID
```

The caller cannot `await` this method and cannot tell whether it has finished. An exception thrown inside it cannot be caught and can crash the process. `async void` is only for **event handlers**; everywhere else, return `async Task`.

### 3. Forgetting to await the task (fire-and-forget)

```csharp
SaveAsync(order);            // no await: the error is silently lost
```

The task runs in the background; its exception is never observed, and after the request ends it may try to use services whose scope has already ended (e.g. `DbContext`). If you really need background work, use a queue and a `BackgroundService`.

### 4. Awaiting sequentially

Awaiting independent operations one after another **adds up** their durations. Start them all first, then await them together:

```csharp
// Sequential: ~duration(A) + duration(B)
var user = await GetUserAsync(id, ct);
var orders = await GetOrdersAsync(id, ct);

// Concurrent: ~max(duration(A), duration(B))
var userTask = GetUserAsync(id, ct);
var ordersTask = GetOrdersAsync(id, ct);
await Task.WhenAll(userTask, ordersTask);
var (user2, orders2) = (userTask.Result, ordersTask.Result);   // safe because they have completed
```

Note: EF Core's `DbContext` is not thread-safe; you cannot run two queries concurrently on the same context.

### 5. Unbounded concurrency in a loop

Starting a thousand requests at once for a thousand items overwhelms the downstream service or your own resources. Limit concurrency with `Parallel.ForEachAsync` or `SemaphoreSlim`.

## Cancellation: CancellationToken

When the user closes the page, it's wasteful for the server to keep running an expensive query. Cancellation is **cooperative**: you pass the token down to every asynchronous call.

```csharp
app.MapGet("/reports/{id}", async (int id, ReportService reports, CancellationToken cancellationToken) =>
    await reports.BuildAsync(id, cancellationToken));
```

ASP.NET Core cancels this token when the client disconnects. A canceled operation throws `OperationCanceledException`; this is not an error but an expected outcome.

## ConfigureAwait(false)

By default, `await` resumes on the captured synchronization context, if there is one (the UI thread in UI applications). `ConfigureAwait(false)` says "I don't need to return to the context."

- **Use it in library code**: you can't know the caller's context; it avoids the deadlock risk and an unnecessary context switch.
- **You don't need it in ASP.NET Core application code**: there is no synchronization context.
- **Don't use it in UI code**: you need to touch UI components after the `await`.

## ValueTask

`Task` is a class; every asynchronous call means a memory allocation. On hot paths where the result is usually available **synchronously** (e.g. reading from a cache), `ValueTask<T>` avoids that allocation. It has restrictions: it can be awaited only **once**. Don't use it without measuring; `Task` is the default.

## Asynchronous streams

To process results one by one as they arrive, use `IAsyncEnumerable<T>` and `await foreach`:

```csharp
await foreach (var row in ReadRowsAsync(cancellationToken))
{
    Process(row);
}
```

This is how you process large result sets without loading all the data into memory.

## Asked in interviews

- **"Does an async method start a new thread?"** No. The thread is released until the task completes; the continuation runs on a pool thread (or on the synchronization context).
- **"What's the difference between `Task.Run` and `await`?"** `Task.Run` hands work to a pool thread (for CPU work); `await` waits for a task's result without blocking.
- **"How does a deadlock happen?"** A thread with a synchronization context blocks on `.Result`; the task's continuation waits for that same thread.
- **"Where do exceptions go?"** They are stored inside the task and rethrown at the `await`. With `Task.WhenAll`, `await` throws only the first exception; all of them are in the task's `Exception` property.

## Summary

- `async`/`await` lets you wait without blocking threads; the gain is scalability.
- Write async all the way; don't use `.Result` or `.Wait()`.
- `async void` is only for event handlers.
- Await independent work concurrently with `Task.WhenAll`; limit concurrency.
- Pass the `CancellationToken` through every layer.
