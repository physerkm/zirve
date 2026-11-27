---
title: Delegates, Lambdas, and LINQ
summary: Using functions as values. Func and Action, closure pitfalls, LINQ's deferred execution, and the difference between IEnumerable and IQueryable.
---

## Delegates

A delegate is a **type-safe** reference to a method. It lets you assign methods to variables, pass them as parameters, and return them. In everyday code you rarely need to define your own delegate type; three built-in families cover almost every case:

| Type | Signature | Example |
| --- | --- | --- |
| `Action<T>` | Returns no value | `Action<string> log = Console.WriteLine;` |
| `Func<T, TResult>` | The last type parameter is the return type | `Func<int, int> square = x => x * x;` |
| `Predicate<T>` | Returns `bool` | `Predicate<int> isEven = x => x % 2 == 0;` |

```csharp
int Apply(int value, Func<int, int> transform) => transform(value);

Console.WriteLine(Apply(5, x => x * x));     // 25
```

`x => x * x` is a **lambda expression**: an anonymous method. The compiler converts it into a delegate (or, as you'll see below, an expression tree) based on the target type.

**Events** (`event`) are a publish–subscribe mechanism built on delegates. The `event` keyword protects the delegate by allowing only `+=` and `-=` from outside. Forgetting to unsubscribe is a classic source of **memory leaks**, because the publisher keeps the subscriber alive.

## Closures: capturing an outer variable

A lambda can use variables from the scope where it is defined. What it captures is **the variable itself, not its current value**.

```csharp
var factor = 2;
Func<int, int> multiply = x => x * factor;

factor = 10;
Console.WriteLine(multiply(3));     // 30, not 6
```

To make this work, the compiler moves the captured variable into a field of a hidden class. This has two consequences: the captured variable lives as long as the lambda, and every closure is a memory allocation.

The classic pitfall is capturing the variable of a `for` loop:

```csharp
var actions = new List<Action>();
for (var i = 0; i < 3; i++)
{
    actions.Add(() => Console.Write(i));
}

foreach (var action in actions) action();     // 333
```

All the lambdas share the **same** `i` variable, and when the loop ends, `i` is 3. The fix is to create a new variable on each iteration: `var copy = i;` and use `copy` in the lambda. A `foreach` loop doesn't have this problem; its loop variable is new on each iteration.

## LINQ

LINQ lets you write declarative queries over collections: you say **what** you want, not **how** to iterate.

```csharp
var topCustomers = orders
    .Where(o => o.Total > 100)
    .GroupBy(o => o.CustomerId)
    .Select(g => new { CustomerId = g.Key, Spent = g.Sum(o => o.Total) })
    .OrderByDescending(x => x.Spent)
    .Take(5)
    .ToList();
```

Commonly used operators:

| Purpose | Operators |
| --- | --- |
| Filtering | `Where`, `Distinct`, `Take`, `Skip`, `OfType` |
| Projection | `Select`, `SelectMany` (flattens nested collections) |
| Ordering | `OrderBy`, `ThenBy`, `Reverse` |
| Grouping / joining | `GroupBy`, `Join`, `Zip` |
| Single value | `First`, `FirstOrDefault`, `Single`, `Any`, `All`, `Count`, `Sum`, `Max`, `Aggregate` |
| Materialization | `ToList`, `ToArray`, `ToDictionary`, `ToHashSet` |

`First` throws an exception if there is no element; `FirstOrDefault` returns the default value. `Single` expects **exactly one** element; it also throws if there is more than one.

### Deferred execution

A LINQ query **does not run** when it is defined; it only builds a recipe. Execution happens when the results are requested: in calls such as `foreach`, `ToList()`, `Count()`, and `First()`.

```csharp
var numbers = new List<int> { 1, 2, 3 };
var evens = numbers.Where(n => n % 2 == 0);     // nothing has run yet

numbers.Add(4);
Console.WriteLine(evens.Count());               // 2: the query ran now, against the current list
```

This has two consequences:

**Multiple enumeration.** Iterating the same query twice does the work twice. If the source is expensive (a database, a file, a heavy computation), this is a serious performance bug.

```csharp
var expensive = items.Select(Compute);          // recipe

if (expensive.Any())                            // Compute ran
{
    foreach (var x in expensive) { }            // Compute ran AGAIN
}

var materialized = items.Select(Compute).ToList();   // run once, keep the result
```

**Streaming.** `Where` and `Select` process elements one at a time; they don't build intermediate collections. `Take(5)` stops iterating the source after the fifth element. By contrast, `OrderBy` and `GroupBy` must read the entire source before producing any results.

Underneath this behavior is `yield return`: the compiler generates a state machine that produces values on demand.

```csharp
IEnumerable<int> Evens(IEnumerable<int> source)
{
    foreach (var n in source)
    {
        if (n % 2 == 0) yield return n;     // waits here until the caller asks for the next element
    }
}
```

## IEnumerable and IQueryable

This is a favorite interview question and the source of one of the most expensive real-world mistakes.

| | `IEnumerable<T>` | `IQueryable<T>` |
| --- | --- | --- |
| What the lambda becomes | A delegate (compiled code) | An **expression tree** (a representation of code as data) |
| Where it runs | In memory, in your process | In the provider (e.g. in the database, as SQL) |
| Typical source | `List<T>`, arrays | EF Core `DbSet<T>` |

```csharp
// SQL: SELECT ... WHERE total > 100   -> filtering happens in the database
var a = db.Orders.Where(o => o.Total > 100).ToList();

// SQL: SELECT * FROM orders           -> the ENTIRE table is pulled into memory, filtering happens in memory
var b = db.Orders.AsEnumerable().Where(o => o.Total > 100).ToList();
```

Both give the same result, but the second moves millions of rows over the network. Converting an `IQueryable` to an `IEnumerable` too early (e.g. returning `IEnumerable` from a method, or calling `ToList()` and then filtering) is the most common form of this mistake.

With `IQueryable`, your lambda must be translatable to SQL; that's why you can't call your own C# methods inside the query: the provider can't translate them and fails at runtime.

## Performance notes

- Use `Any()` instead of `Count() > 0`: it stops at the first element.
- `list.Contains(x)` inside a loop is O(n); if you're doing lookups, convert to a set first with `ToHashSet()`.
- LINQ adds a little overhead compared with a hand-written loop (delegate calls, iterator allocations). In most code it doesn't matter; convert to a loop on hot paths proven by measurement.

## Summary

- A delegate is a type-safe reference to a method; `Func` and `Action` cover most needs.
- A closure captures the variable itself; watch out for `for` loop variables.
- LINQ uses deferred execution: the query runs when results are requested, and **every time** they are requested. Materialize with `ToList()` when needed.
- `IQueryable` translates the query for the database; switching to `IEnumerable` too early pulls the entire table into memory.
